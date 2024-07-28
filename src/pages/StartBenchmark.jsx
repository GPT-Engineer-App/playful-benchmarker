import { useState, useCallback, useEffect } from "react";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useBenchmarkScenarios, useAddRun, useAddResult, useUpdateRun, useUserSecrets, useRuns } from "../integrations/supabase";
import { supabase } from "../integrations/supabase";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import { callOpenAILLM } from "../lib/anthropic";
import ScenarioSelection from "../components/StartBenchmark/ScenarioSelection";
import SystemVersionSelection from "../components/StartBenchmark/SystemVersionSelection";
import StartBenchmarkButton from "../components/StartBenchmark/StartBenchmarkButton";
import { handleSingleIteration, startBenchmark } from "../utils/benchmarkUtils";

const StartBenchmark = () => {
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

  const handleScenarioToggle = (scenarioId) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenarioId)
        ? prev.filter((id) => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const handleStartBenchmark = useCallback(async () => {
    const success = await startBenchmark(selectedScenarios, scenarios, systemVersion, session, userSecrets, supabase, toast);
    if (success) {
      setIsRunning(true);
    }
  }, [selectedScenarios, scenarios, systemVersion, session, userSecrets]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (isRunning && userSecrets && userSecrets.length > 0) {
        const secrets = JSON.parse(userSecrets[0].secret);
        const gptEngineerTestToken = secrets.GPT_ENGINEER_TEST_TOKEN;
        if (gptEngineerTestToken) {
          const pausedRun = runs.find(run => run.state === "paused");
          if (pausedRun) {
            await handleSingleIteration(pausedRun, systemVersion, gptEngineerTestToken, updateRun, addResult, callOpenAILLM, sendChatMessage);
          }
        } else {
          console.error("GPT Engineer test token not found in user secrets");
          setIsRunning(false);
          toast.error("GPT Engineer test token not found. Please set it up in your secrets.");
        }
      }
    }, 5000); // Run every 5 seconds

    return () => clearInterval(intervalId);
  }, [isRunning, runs, updateRun, addResult, userSecrets, systemVersion]);

  if (scenariosLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <ScenarioSelection
            scenarios={scenarios}
            selectedScenarios={selectedScenarios}
            handleScenarioToggle={handleScenarioToggle}
          />

          <SystemVersionSelection
            systemVersion={systemVersion}
            setSystemVersion={setSystemVersion}
          />

          <StartBenchmarkButton
            onClick={handleStartBenchmark}
            isRunning={isRunning}
          />
        </div>
      </main>
    </div>
  );
};

export default StartBenchmark;