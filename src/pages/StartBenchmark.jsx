import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useBenchmarkScenarios, useAddRun, useAddResult, useUpdateRun, useUserSecrets, useRuns } from "../integrations/supabase";
import { supabase } from "../integrations/supabase";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import { impersonateUser } from "../lib/userImpersonation";
import { callOpenAILLM } from "../lib/anthropic";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

const StartBenchmark = () => {
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

    const availableRun = runs.find(run => run.state === "paused" || run.state === "running");
    if (!availableRun) {
      console.log("No available run found");
      return;
    }

    // If the run is paused, try to start it
    if (availableRun.state === "paused") {
      const { data: runStarted, error: startError } = await supabase
        .from('runs')
        .update({ state: 'running' })
        .eq('id', availableRun.id)
        .select()
        .single();

      if (startError) {
        console.error("Error starting run:", startError);
        return;
      }

      if (!runStarted) {
        console.log("Failed to start run:", availableRun.id);
        return;
      }
    }

    // At this point, the run should be in 'running' state

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
    }, 5000); // Run every 5 seconds

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
        
        // Call initial user impersonation function
        const { projectId, initialRequest, messages: initialMessages } = await impersonateUser(scenario.prompt, systemVersion, scenario.llm_temperature);

        // Create a new run entry with 'running' state
        const { data: newRun, error: createRunError } = await supabase
          .from('runs')
          .insert({
            scenario_id: scenarioId,
            system_version: systemVersion,
            project_id: projectId,
            user_id: session.user.id,
            link: `${systemVersion}/projects/${projectId}`,
            state: 'running'
          })
          .select()
          .single();

        if (createRunError) throw new Error(`Failed to create run: ${createRunError.message}`);

        toast.success(`Benchmark started for scenario: ${scenario.name}`);

        // Pause the run immediately after creation
        const { error: pauseRunError } = await supabase
          .from('runs')
          .update({ state: 'paused' })
          .eq('id', newRun.id);

        if (pauseRunError) {
          console.error(`Failed to pause run: ${pauseRunError.message}`);
          // We don't throw here to allow other scenarios to proceed
        }
      }

      toast.success("All benchmarks started successfully!");
    } catch (error) {
      console.error("Error starting benchmark:", error);
      toast.error("An error occurred while starting the benchmark. Please try again.");
      setIsRunning(false);
    }
  }, [selectedScenarios, scenarios, systemVersion, session, addRun, addResult, userSecrets]);

  if (scenariosLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Select Scenarios</h2>
          <div className="space-y-4 mb-8">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="flex items-center space-x-2">
                <Checkbox
                  id={scenario.id}
                  checked={selectedScenarios.includes(scenario.id)}
                  onCheckedChange={() => handleScenarioToggle(scenario.id)}
                />
                <Label htmlFor={scenario.id}>{scenario.name}</Label>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-4">Select System Version</h2>
          <Select value={systemVersion} onValueChange={setSystemVersion}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select system version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="http://localhost:8000">http://localhost:8000</SelectItem>
              <SelectItem value="https://api.gpt-engineer.com">https://api.gpt-engineer.com</SelectItem>
              {/* Add more options here in the future */}
            </SelectContent>
          </Select>

          <Button 
            onClick={handleStartBenchmark} 
            className="mt-8 w-full"
            disabled={isRunning}
          >
            {isRunning ? "Running Benchmark..." : "Start Benchmark"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default StartBenchmark;
