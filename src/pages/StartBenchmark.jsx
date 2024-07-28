import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useBenchmarkScenarios, useAddRun, useAddResult, useUpdateRun, useUserSecrets } from "../integrations/supabase";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import { impersonateUser } from "../lib/userImpersonation";
import { callOpenAILLM } from "../lib/anthropic";

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

  const handleScenarioToggle = (scenarioId) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenarioId)
        ? prev.filter((id) => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const { data: userSecrets } = useUserSecrets();

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
        const { projectId, initialRequest, messages } = await impersonateUser(scenario.prompt, systemVersion, scenario.llm_temperature);

        // Create new run entry
        const runData = await addRun.mutateAsync({
          scenario_id: scenarioId,
          system_version: systemVersion,
          project_id: projectId,
          user_id: session.user.id,
          state: 'running',
          link: `${systemVersion}/projects/${projectId}`, // Save the link
        });

        const results = [];
        let conversationComplete = false;
        let chatRequest = initialRequest;

        try {
          // Start the conversation loop
          const startTime = Date.now();
          while (!conversationComplete) {
            // Send chat message
            const chatResponse = await sendChatMessage(projectId, chatRequest, systemVersion, gptEngineerTestToken);
            results.push({ type: 'chat_message_sent', data: chatResponse });

            // Check for timeout after sending the message
            if (Date.now() - startTime > scenario.timeout * 1000) {
              results.push({ type: 'timeout', data: { message: 'Scenario timed out' } });
              break;
            }

            // Add the chat response to the messages as a user message
            messages.push({ role: "user", content: chatResponse.message });

            // Get the next assistant message
            const nextAssistantMessage = await callOpenAILLM(messages, 'gpt-4o', scenario.llm_temperature);
            
            if (nextAssistantMessage.includes("<lov-scenario-finished/>")) {
              conversationComplete = true;
              results.push({ type: 'scenario_finished', data: { message: 'Scenario completed successfully' } });
            } else {
              const chatRequestMatch = nextAssistantMessage.match(/<lov-chat-request>([\s\S]*?)<\/lov-chat-request>/);
              if (chatRequestMatch) {
                chatRequest = chatRequestMatch[1].trim();
                messages.push({ role: "assistant", content: nextAssistantMessage });
              } else {
                console.warn("Unexpected assistant message format:", nextAssistantMessage);
                results.push({ type: 'unexpected_message', data: { message: nextAssistantMessage } });
              }
            }

            // Check for timeout after processing the response
            if (Date.now() - startTime > scenario.timeout * 1000) {
              results.push({ type: 'timeout', data: { message: 'Scenario timed out' } });
              break;
            }
          }

          // Save run results
          await addResult.mutateAsync({
            run_id: runData.id,
            reviewer_id: null,
            result: {
              impersonation_results: results,
              system_version: systemVersion,
            },
          });

          // Update run state to 'done'
          await updateRun.mutateAsync({
            id: runData.id,
            state: 'done',
          });

          toast.success(`Benchmark completed for scenario: ${scenario.name}`);
        } catch (error) {
          console.error("Error during benchmark run:", error);
          // Update run state to 'impersonator_failed'
          await updateRun.mutateAsync({
            id: runData.id,
            state: 'impersonator_failed',
          });
          toast.error(`Benchmark failed for scenario: ${scenario.name}`);
        }
      }

      toast.success("All benchmarks completed successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error running benchmark:", error);
      toast.error("An error occurred while running the benchmark. Please try again.");
    } finally {
      setIsRunning(false);
    }
  }, [selectedScenarios, scenarios, systemVersion, session, addRun, addResult, navigate]);

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