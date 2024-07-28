import { toast } from "sonner";
import { supabase } from "../integrations/supabase";
import { impersonateUser } from "../lib/userImpersonation";
import { callOpenAILLM } from "../lib/anthropic";

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

export const handleSingleIteration = async (run, systemVersion, gptEngineerTestToken, updateRun, addResult) => {
  const startTime = Date.now();

  try {
    // Fetch project messages from Firestore
    const messagesRef = collection(db, `project/${run.project_id}/trajectory`);
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);
    const messages = querySnapshot.docs.map(doc => ({
      role: doc.data().sender === "human" ? "assistant" : "user",
      content: doc.data().content
    }));

    // Call OpenAI to get next user impersonation action
    const nextAction = await callOpenAILLM(messages, 'gpt-4o', run.llm_temperature);

    if (nextAction.includes("<lov-scenario-finished/>")) {
      await updateRun.mutateAsync({
        id: run.id,
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
    const chatResponse = await sendChatMessage(run.project_id, chatRequest, systemVersion, gptEngineerTestToken);

    // Add result
    await addResult.mutateAsync({
      run_id: run.id,
      reviewer_id: null,
      result: {
        type: 'chat_message_sent',
        data: chatResponse,
      },
    });

    // Update run state back to 'paused'
    await updateRun.mutateAsync({
      id: run.id,
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
        run_id: run.id, 
        time_increment: timeUsage 
      });

    if (error) console.error('Error updating time usage:', error);

    // Check if the run has timed out
    const { data: runData } = await supabase
      .from('runs')
      .select('state')
      .eq('id', run.id)
      .single();

    if (runData.state !== 'timed_out') {
      // Update run state back to 'paused' only if it hasn't timed out
      await updateRun.mutateAsync({
        id: run.id,
        state: 'paused',
      });
    }
  }
};

export const startBenchmark = async (selectedScenarios, scenarios, systemVersion, session, addRun, addResult, gptEngineerTestToken) => {
  for (const scenarioId of selectedScenarios) {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    
    // Call initial user impersonation function
    const { projectId, initialRequest, messages: initialMessages } = await impersonateUser(scenario.prompt, systemVersion, scenario.llm_temperature);

    // Get the project link from the impersonateUser response
    const projectResponse = await fetch(`${systemVersion}/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${gptEngineerTestToken}`,
      },
    });
    
    if (!projectResponse.ok) {
      throw new Error(`Failed to fetch project details: ${projectResponse.statusText}`);
    }
    
    const projectData = await projectResponse.json();
    const projectLink = projectData.link;

    // Create a new run entry with 'paused' state
    const { data: newRun, error: createRunError } = await supabase
      .from('runs')
      .insert({
        scenario_id: scenarioId,
        system_version: systemVersion,
        project_id: projectId,
        user_id: session.user.id,
        link: projectLink,
        state: 'paused'
      })
      .select()
      .single();

    if (createRunError) throw new Error(`Failed to create run: ${createRunError.message}`);

    // Start the paused run
    const { data: startedRun, error: startRunError } = await supabase
      .rpc('start_paused_run', { run_id: newRun.id });

    if (startRunError) throw new Error(`Failed to start run: ${startRunError.message}`);

    if (startedRun) {
      toast.success(`Benchmark started for scenario: ${scenario.name}`);
    } else {
      toast.warning(`Benchmark created but not started for scenario: ${scenario.name}`);
    }
  }

  toast.success("All benchmarks started successfully!");
};