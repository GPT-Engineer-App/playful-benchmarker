import { useState, useCallback, useEffect } from 'react';
import { supabase, useUpdateRun, useAddResult } from '../integrations/supabase';
import { toast } from 'sonner';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { callSupabaseLLM } from '../lib/anthropic';
import { sendChatMessage } from '../lib/userImpersonation';

const useBenchmarkRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const updateRun = useUpdateRun();
  const addResult = useAddResult();

  const handleSingleIteration = useCallback(async (gptEngineerTestToken) => {
    console.log('Starting single iteration');
    const { data: runs, error: runsError } = await supabase
      .from('runs')
      .select('*')
      .eq('state', 'paused')
      .order('created_at', { ascending: true })
      .limit(1);

    if (runsError) {
      console.error("Error fetching runs:", runsError);
      return;
    }

    if (!runs || runs.length === 0) {
      console.log("No paused runs available");
      return;
    }

    const availableRun = runs[0];
    console.log('Available run:', availableRun);

    // Try to start the paused run
    console.log('Attempting to start paused run:', availableRun.id);
    const { data: runStarted, error: startError } = await supabase
      .rpc('start_paused_run', { run_id: availableRun.id });

    if (startError) {
      console.error("Error starting run:", startError);
      return;
    }

    if (!runStarted) {
      console.log("Failed to start run (it may no longer be in 'paused' state):", availableRun.id);
      return;
    }
    console.log('Run started successfully');

    const startTime = Date.now();
    console.log('Starting iteration at:', new Date(startTime).toISOString());

    try {
      // Fetch project messages from Firestore
      console.log('Fetching project messages from Firestore');
      const messagesRef = collection(db, `projects/${availableRun.project_id}/trajectory`);
      const q = query(messagesRef, orderBy("timestamp", "asc"));
      const querySnapshot = await getDocs(q);
      let messages = querySnapshot.docs.map(doc => ({
        role: doc.data().sender === "human" ? "assistant" : "user",
        content: doc.data().content
      }));
      if (messages.length === 0) {
        messages = [{
          role: "user",
          content: "No messages have been added yet. Let's start the conversation!"
        }];
      }
      console.log('Fetched messages:', messages);

      // Call OpenAI to get next user impersonation action
      console.log('Calling OpenAI for next action');
      const nextAction = await callSupabaseLLM(messages[messages.length - 1].content, availableRun.llm_temperature);
      console.log('Next action:', nextAction);

      if (nextAction.includes("<lov-scenario-finished/>")) {
        console.log('Scenario finished, updating run state to completed');
        await updateRun.mutateAsync({
          id: availableRun.id,
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
      console.log('Extracted chat request:', chatRequest);

      // Call the chat endpoint
      console.log('Sending chat message');
      const chatResponse = await sendChatMessage(availableRun.project_id, chatRequest, availableRun.system_version, gptEngineerTestToken);
      console.log('Chat response:', chatResponse);

      // Add result
      console.log('Adding result to database');
      await addResult.mutateAsync({
        run_id: availableRun.id,
        reviewer_id: null,
        result: {
          type: 'chat_message_sent',
          data: chatResponse,
        },
      });

      console.log('Iteration completed successfully');
      toast.success("Iteration completed successfully");
    } catch (error) {
      console.error("Error during iteration:", error);
      toast.error(`Iteration failed: ${error.message}`);
    } finally {
      const endTime = Date.now();
      const timeUsage = Math.round((endTime - startTime) / 1000); // Convert to seconds
      console.log(`Iteration completed in ${timeUsage} seconds`);

      // Update the total_time_usage in Supabase
      console.log('Updating total time usage');
      const { data, error } = await supabase
        .rpc('update_run_time_usage', { 
          run_id: availableRun.id, 
          time_increment: timeUsage 
        });

      if (error) console.error('Error updating time usage:', error);

      // Check if the run has timed out
      console.log('Checking if run has timed out');
      const { data: runData } = await supabase
        .from('runs')
        .select('state')
        .eq('id', availableRun.id)
        .single();

      if (runData.state !== 'timed_out') {
        console.log('Run not timed out, updating state to paused');
        // Update run state back to 'paused' only if it hasn't timed out
        await updateRun.mutateAsync({
          id: availableRun.id,
          state: 'paused',
        });
      } else {
        console.log('Run has timed out');
      }
    }
  }, [updateRun, addResult]);

  useEffect(() => {
    const fetchUserSecrets = async () => {
      const { data: userSecrets, error } = await supabase
        .from('user_secrets')
        .select('secret')
        .limit(1);

      if (error) {
        console.error("Error fetching user secrets:", error);
        toast.error("Failed to fetch user secrets. Cannot run benchmark.");
        return null;
      }

      if (userSecrets && userSecrets.length > 0) {
        const secrets = JSON.parse(userSecrets[0].secret);
        return secrets.GPT_ENGINEER_TEST_TOKEN;
      } else {
        console.error("No user secrets found");
        toast.error("No user secrets found. Please set up your secrets.");
        return null;
      }
    };

    const runIteration = async () => {
      const gptEngineerTestToken = await fetchUserSecrets();
      if (gptEngineerTestToken) {
        await handleSingleIteration(gptEngineerTestToken);
      }
    };

    // Run the first iteration immediately
    runIteration();

    // Set up the interval for subsequent iterations
    const intervalId = setInterval(runIteration, 60000);

    return () => clearInterval(intervalId);
  }, [handleSingleIteration]);

  return { isRunning };
};

export default useBenchmarkRunner;
