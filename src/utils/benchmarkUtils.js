import { callOpenAILLM } from "../lib/anthropic";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export const sendChatMessage = async (projectId, message, systemVersion, gptEngineerTestToken) => {
  const response = await fetch(`${systemVersion}/projects/${projectId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${gptEngineerTestToken}`,
    },
    body: JSON.stringify({ message, images: [], mode: 'instant' }),
  });
  if (!response.ok) {
    throw new Error('Failed to send chat message');
  }
  return response.json();
};

export const handleSingleIteration = async (gptEngineerTestToken, runs, updateRun, addResult, systemVersion, supabase, toast) => {
  if (!runs || runs.length === 0) {
    console.log("No runs available");
    return;
  }

  const pausedRun = runs.find(run => run.state === "paused");
  if (!pausedRun) {
    console.log("No paused run found");
    return;
  }

  // Try to start the paused run
  const { data: runStarted, error: startError } = await supabase
    .rpc('start_paused_run', { run_id: pausedRun.id });

  if (startError) {
    console.error("Error starting run:", startError);
    return;
  }

  if (!runStarted) {
    // Check if the run timed out
    const { data: runData } = await supabase
      .from('runs')
      .select('state')
      .eq('id', pausedRun.id)
      .single();

    if (runData.state === 'timed_out') {
      console.log("Run timed out:", pausedRun.id);
      toast.error(`Run ${pausedRun.id} timed out`);
    } else {
      console.log("Run was not in 'paused' state, skipping");
    }
    return;
  }

  const startTime = Date.now();

  try {
    // Fetch project messages from Firestore
    const messagesRef = collection(db, `project/${pausedRun.project_id}/trajectory`);
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({
      role: doc.data().sender === "human" ? "assistant" : "user",
      content: doc.data().content
    }));

    // Call OpenAI to get next user impersonation action
    const nextAction = await callOpenAILLM(messages, 'gpt-4o', pausedRun.llm_temperature);

    if (nextAction.includes("<lov-scenario-finished/>")) {
      await updateRun.mutateAsync({
        id: pausedRun.id,
        state: 'completed',
      });
      toast.success("Scenario completed successfully");
      return;
    }

    const chatRequestMatch = nextAction.match(/<lov-chat-request>([\s\S]*?)<\/lov-chat-request>/);
    if (!chatRequestMatch) {
      throw new Error("Unexpected assistant message format");
    }

    const chatRequest = chatRequestMatch[1].trim();

    // Call the chat endpoint
    const chatResponse = await sendChatMessage(pausedRun.project_id, chatRequest, systemVersion, gptEngineerTestToken);

    // Add result
    await addResult.mutateAsync({
      run_id: pausedRun.id,
      reviewer_id: null,
      result: {
        type: 'chat_message_sent',
        data: chatResponse,
      },
    });

    // Update run state back to 'paused'
    await updateRun.mutateAsync({
      id: pausedRun.id,
      state: 'paused',
    });

    toast.success("Iteration completed successfully");
  } catch (error) {
    console.error("Error during iteration:", error);
    toast.error(`Iteration failed: ${error.message}`);
  } finally {
    const endTime = Date.now();
    const timeUsage = Math.round((endTime - startTime) / 1000); // Convert to seconds

    // Update the total_time_usage in Supabase
    const { data, error } = await supabase
      .rpc('update_run_time_usage', { 
        run_id: pausedRun.id, 
        time_increment: timeUsage 
      });

    if (error) console.error('Error updating time usage:', error);

    // Check if the run has timed out
    const { data: runData } = await supabase
      .from('runs')
      .select('state')
      .eq('id', pausedRun.id)
      .single();

    if (runData.state !== 'timed_out') {
      // Update run state back to 'paused' only if it hasn't timed out
      await updateRun.mutateAsync({
        id: pausedRun.id,
        state: 'paused',
      });
    }
  }
};