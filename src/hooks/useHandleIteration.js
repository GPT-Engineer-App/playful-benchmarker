import { supabase } from '../integrations/supabase';
import { callSupabaseLLM } from '../lib/anthropic';
import { sendChatMessage, testWebsite } from '../lib/userImpersonation';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useHandleIteration = (updateRun) => {
  return async (availableRun, gptEngineerTestToken) => {
    // Fetch the scenario associated with this run
    const { data: scenario, error: scenarioError } = await supabase
      .from('benchmark_scenarios')
      .select('prompt')
      .eq('id', availableRun.scenario_id)
      .single();

    if (scenarioError) {
      console.error("Error fetching scenario:", scenarioError);
      throw scenarioError;
    }

    console.log('Scenario prompt:', scenario.prompt);

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

    const messages = trajectoryMessages.map(msg => {
      if (msg.role === "tool_output") {
        try {
          const content = JSON.parse(msg.content);
          if (content.screenshot) {
            return [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: "image/png",
                      data: content.screenshot,
                    },
                  },
                  { type: "text", text: "This is a screenshot of the current state of the website." },
                ],
              },
              {
                role: "user",
                content: content.result || "No result provided",
              },
            ];
          }
        } catch (error) {
          console.error("Error parsing tool output:", error);
        }
      }
      return {
        role: msg.role === "impersonator" ? "assistant" : "user",
        content: msg.content,
      };
    }).flat();
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
      return;
    }

    const testWebsiteMatch = nextAction.match(/<lov-test-website>([\s\S]*?)<\/lov-test-website>/);
    const chatRequestMatch = nextAction.match(/<lov-chat-request>([\s\S]*?)<\/lov-chat-request>/);

    let timeUsage = 0;

    if (testWebsiteMatch) {
      const testInstructions = testWebsiteMatch[1].trim();
      console.log('Extracted test instructions:', testInstructions);

      // Call the test website function
      console.log('Testing website');
      const testResult = await testWebsite(availableRun.project_id, testInstructions, availableRun.system_version, gptEngineerTestToken);

      // Insert trajectory message for tool output
      await supabase.rpc('add_trajectory_message', {
        p_run_id: availableRun.id,
        p_content: JSON.stringify(testResult),
        p_role: 'tool_output'
      });
    } else if (chatRequestMatch) {
      const chatRequest = chatRequestMatch[1].trim();
      console.log('Extracted chat request:', chatRequest);

      // Call the chat endpoint and measure the time
      console.log('Sending chat message');
      const startTime = Date.now();
      await sendChatMessage(availableRun.project_id, chatRequest, availableRun.system_version, gptEngineerTestToken);
      const endTime = Date.now();
      timeUsage = endTime - startTime; // Time in milliseconds
      console.log(`Chat message sent in ${timeUsage} milliseconds`);

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

    // Update the total_time_usage in Supabase
    if (timeUsage > 0) {
      console.log('Updating total time usage');
      const { data, error } = await supabase
        .rpc('update_run_time_usage', { 
          run_id: availableRun.id, 
          time_increment: timeUsage // Store time usage in milliseconds
        });

      if (error) console.error('Error updating time usage:', error);
    }
  };
};