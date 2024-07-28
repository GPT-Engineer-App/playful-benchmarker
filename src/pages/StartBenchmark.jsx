import { useState, useCallback, useEffect } from "react";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useBenchmarkScenarios, useAddRun, useAddResult, useUpdateRun, useUserSecrets, useRuns } from "../integrations/supabase";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import ScenarioSelector from "../components/benchmark/ScenarioSelector";
import SystemVersionSelector from "../components/benchmark/SystemVersionSelector";
import StartBenchmarkButton from "../components/benchmark/StartBenchmarkButton";
import { validateBenchmarkStart, startBenchmarkRun, handleSingleIteration } from "../utils/benchmarkUtils";

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

  const handleScenarioToggle = (scenarioId) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenarioId)
        ? prev.filter((id) => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const handleStartBenchmark = useCallback(async () => {
    if (!validateBenchmarkStart(selectedScenarios, userSecrets)) {
      return;
    }

    const secrets = JSON.parse(userSecrets[0].secret);
    const gptEngineerTestToken = secrets.GPT_ENGINEER_TEST_TOKEN;

    setIsRunning(true);

    try {
      for (const scenarioId of selectedScenarios) {
        const scenario = scenarios.find((s) => s.id === scenarioId);
        await startBenchmarkRun(scenario, systemVersion, session, gptEngineerTestToken);
      }

      toast.success("All benchmarks started successfully!");
    } catch (error) {
      console.error("Error starting benchmark:", error);
      toast.error("An error occurred while starting the benchmark. Please try again.");
      setIsRunning(false);
    }
  }, [selectedScenarios, scenarios, systemVersion, session, userSecrets]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (isRunning && userSecrets && userSecrets.length > 0) {
        const secrets = JSON.parse(userSecrets[0].secret);
        const gptEngineerTestToken = secrets.GPT_ENGINEER_TEST_TOKEN;
        if (gptEngineerTestToken) {
          const pausedRun = runs?.find(run => run.state === "paused");
          if (pausedRun) {
            await handleSingleIteration(pausedRun, systemVersion, gptEngineerTestToken, updateRun, addResult);
          }
        } else {
          console.error("GPT Engineer test token not found in user secrets");
          setIsRunning(false);
          toast.error("GPT Engineer test token not found. Please set it up in your secrets.");
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isRunning, runs, systemVersion, updateRun, addResult, userSecrets]);

  if (scenariosLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <ScenarioSelector
            scenarios={scenarios}
            selectedScenarios={selectedScenarios}
            onScenarioToggle={handleScenarioToggle}
          />

          <SystemVersionSelector
            systemVersion={systemVersion}
            onSystemVersionChange={setSystemVersion}
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