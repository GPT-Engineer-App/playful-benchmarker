import { useState, useCallback, useEffect } from 'react';
import { supabase, useUpdateRun } from '../integrations/supabase';
import { toast } from 'sonner';
import { callSupabaseLLM } from '../lib/anthropic';
import { sendChatMessage, testWebsite } from '../lib/userImpersonation';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const useBenchmarkRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const updateRun = useUpdateRun();

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
    
    // Fetch the scenario associated with this run
    const { data: scenario, error: scenarioError } = await supabase
      .from('benchmark_scenarios')
      .select('prompt')
      .eq('id', availableRun.scenario_id)
      .single();

    if (scenarioError) {
      console.error("Error fetching scenario:", scenarioError);
      return;
    }

    console.log('Scenario prompt:', scenario.prompt);

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
      // Fetch project messages from Supabase trajectory table
      console.log('Fetching project messages from Supabase');
      const { data: trajectoryMessages, error: trajectoryError } = await supabase
        .from('trajectory_messages')
        .select('*')
        .eq('run_id', availableRun.id)
        .order('created_at', { ascending: true });

      if (trajectoryError) {
        console.error("Error fetching trajectory messages:", trajectoryError);
        throw trajectoryError;
      }

      const messages = trajectoryMessages.map(msg => ({
        role: msg.role === "impersonator" ? "assistant" : "user",
        content: msg.content
      }));
      console.log('Fetched messages:', messages);

      // Call OpenAI to get next user impersonation action
      console.log('Calling OpenAI for next action');
      const nextAction = await callSupabaseLLM(scenario.prompt, messages, availableRun.llm_temperature);
      console.log('Next action:', nextAction);

      // Insert trajectory message for impersonator
      await supabase.rpc('add_trajectory_message', {
        p_run_id: availableRun.id,
        p_content: nextAction,
        p_role: 'impersonator'
      });

      if (nextAction.includes("<lov-scenario-finished/>")) {
        console.log('Scenario finished, updating run state to completed');
        await updateRun.mutateAsync({
          id: availableRun.id,
          state: 'completed',
        });
        toast.success("Scenario completed successfully");
        return;
      }

      const testWebsiteMatch = nextAction.match(/<lov-test-website>([\s\S]*?)<\/lov-test-website>/);
      const chatRequestMatch = nextAction.match(/<lov-chat-request>([\s\S]*?)<\/lov-chat-request>/);

      if (testWebsiteMatch) {
        const testInstructions = testWebsiteMatch[1].trim();
        console.log('Extracted test instructions:', testInstructions);

        // Call the test website function
        console.log('Testing website');
        const testResult = await testWebsite(availableRun.project_id, testInstructions, availableRun.system_version, gptEngineerTestToken);

        // Insert trajectory message for tool output
        await supabase.rpc('add_trajectory_message', {
          p_run_id: availableRun.id,
          p_content: testResult,
          p_role: 'tool_output'
        });
      } else if (chatRequestMatch) {
        const chatRequest = chatRequestMatch[1].trim();
        console.log('Extracted chat request:', chatRequest);

        // Call the chat endpoint
        console.log('Sending chat message');
        await sendChatMessage(availableRun.project_id, chatRequest, availableRun.system_version, gptEngineerTestToken);

        // Fetch all messages from the project's trajectory
        const latestMessagesRef = collection(db, `projects/${availableRun.project_id}/trajectory`);
        const latestMessagesQuery = query(latestMessagesRef, orderBy("created_at", "desc"));
        const latestMessagesSnapshot = await getDocs(latestMessagesQuery);
        
        const filteredMessages = latestMessagesSnapshot.docs
          .map(doc => ({ ...doc.data(), id: doc.id }))
          .filter(msg => msg.role === 'ai' && msg.channel?.type === 'instant-channel');

        if (filteredMessages.length > 0) {
          const latestMessage = filteredMessages[0];
          // Insert trajectory message for tool output
          await supabase.rpc('add_trajectory_message', {
            p_run_id: availableRun.id,
            p_content: latestMessage.content,
            p_role: 'tool_output'
          });
          console.log('Latest assistant message:', latestMessage.content);
        } else {
          console.warn('No matching messages found in the project trajectory');
        }
      } else {
        console.error("Unexpected assistant message format");
        await updateRun.mutateAsync({
          id: availableRun.id,
          state: 'impersonator_failed',
        });
        throw new Error("Unexpected assistant message format");
      }

      console.log('Iteration completed successfully');
      toast.success("Iteration completed successfully");
    } catch (error) {
      console.error("Error during iteration:", error);
      toast.error(`Iteration failed: ${error.message}`);
      await updateRun.mutateAsync({
        id: availableRun.id,
        state: 'impersonator_failed',
      });
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
      console.log('Checking run state');
      const { data: runData } = await supabase
        .from('runs')
        .select('state')
        .eq('id', availableRun.id)
        .single();

      if (runData.state === 'timed_out') {
        console.log('Run has timed out');
      } else if (runData.state === 'impersonator_failed') {
        console.log('Impersonator failed, not updating state');
      } else {
        console.log('Updating state to paused');
        await updateRun.mutateAsync({
          id: availableRun.id,
          state: 'paused',
        });
      }
    }
  }, [updateRun]);

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
