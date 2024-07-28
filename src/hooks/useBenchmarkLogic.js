import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useBenchmarkScenarios, useAddRun, useAddResult, useUpdateRun, useUserSecrets, useRuns } from "../integrations/supabase";
import { supabase } from "../integrations/supabase";
import { impersonateUser } from "../lib/userImpersonation";
import { callOpenAILLM } from "../lib/anthropic";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

const useBenchmarkLogic = () => {
  const navigate = useNavigate();
  const { session } = useSupabaseAuth();
  const { data: scenarios, isLoading: scenariosLoading } = useBenchmarkScenarios();
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [systemVersion, setSystemVersion] = useState("http://localhost:8000");
  const [isRunning, setIsRunning] = useState(false);
  const addRun = useAddRun();
  const addResult = useAddResult();
  const updateRun = useUpdateRun();
  const { data: runs } = useRuns();
  const { data: userSecrets } = useUserSecrets();

  const sendChatMessage = async (projectId, message, systemVersion, gptEngineerTestToken) => {
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

  const handleSingleIteration = useCallback(async (gptEngineerTestToken) => {
    if (!runs || runs.length === 0) {
      console.log("No runs available");
      return;
    }

    const pausedRun = runs.find(run => run.state === "paused");
    if (!pausedRun) {
      console.log("No paused run found");
      return;
    }

    const { data: runStarted, error: startError } = await supabase
      .rpc('start_paused_run', { run_id: pausedRun.id });

    if (startError) {
      console.error("Error starting run:", startError);
      return;
    }

    if (!runStarted) {
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
      const messagesRef = collection(db, `project/${pausedRun.project_id}/trajectory`);
      const q = query(messagesRef, orderBy("timestamp", "asc"));
      const querySnapshot = await getDocs(q);
      const messages = querySnapshot.docs.map(doc => ({
        role: doc.data().sender === "human" ? "assistant" : "user",
        content: doc.data().content
      }));

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

      const chatResponse = await sendChatMessage(pausedRun.project_id, chatRequest, systemVersion, gptEngineerTestToken);

      await addResult.mutateAsync({
        run_id: pausedRun.id,
        reviewer_id: null,
        result: {
          type: 'chat_message_sent',
          data: chatResponse,
        },
      });

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
      const timeUsage = Math.round((endTime - startTime) / 1000);

      const { data, error } = await supabase
        .rpc('update_run_time_usage', { 
          run_id: pausedRun.id, 
          time_increment: timeUsage 
        });

      if (error) console.error('Error updating time usage:', error);

      const { data: runData } = await supabase
        .from('runs')
        .select('state')
        .eq('id', pausedRun.id)
        .single();

      if (runData.state !== 'timed_out') {
        await updateRun.mutateAsync({
          id: pausedRun.id,
          state: 'paused',
        });
      }
    }
  }, [runs, updateRun, addResult, systemVersion, sendChatMessage, supabase, toast]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (isRunning && userSecrets && userSecrets.length > 0) {
        const secrets = JSON.parse(userSecrets[0].secret);
        const gptEngineerTestToken = secrets.GPT_ENGINEER_TEST_TOKEN;
        if (gptEngineerTestToken) {
          await handleSingleIteration(gptEngineerTestToken);
        } else {
          console.error("GPT Engineer test token not found in user secrets");
          setIsRunning(false);
          toast.error("GPT Engineer test token not found. Please set it up in your secrets.");
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isRunning, handleSingleIteration, userSecrets, setIsRunning, toast]);

  const handleScenarioToggle = (scenarioId) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenarioId)
        ? prev.filter((id) => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const handleStartBenchmark = useCallback(async () => {
    if (selectedScenarios.length === 0) {
      toast.error("Please select at least one scenario to run.");
      return;
    }

    if (!userSecrets || userSecrets.length === 0) {
      toast.error("No user secrets found. Please set up your GPT Engineer test token.");
      return;
    }

    const secrets = JSON.parse(userSecrets[0].secret);
    const gptEngineerTestToken = secrets.GPT_ENGINEER_TEST_TOKEN;

    if (!gptEngineerTestToken) {
      toast.error("GPT Engineer test token not found. Please set it up in your secrets.");
      return;
    }

    setIsRunning(true);

    try {
      for (const scenarioId of selectedScenarios) {
        const scenario = scenarios.find((s) => s.id === scenarioId);
        
        const { projectId, initialRequest, messages: initialMessages } = await impersonateUser(scenario.prompt, systemVersion, scenario.llm_temperature);

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
    } catch (error) {
      console.error("Error starting benchmark:", error);
      toast.error("An error occurred while starting the benchmark. Please try again.");
      setIsRunning(false);
    }
  }, [selectedScenarios, scenarios, systemVersion, session, addRun, addResult, userSecrets]);

  return {
    scenarios,
    scenariosLoading,
    selectedScenarios,
    systemVersion,
    isRunning,
    handleScenarioToggle,
    setSystemVersion,
    handleStartBenchmark,
  };
};

export default useBenchmarkLogic;