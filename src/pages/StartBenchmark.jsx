import { useState } from "react";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useBenchmarkScenarios, useAddRun } from "../integrations/supabase";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import ScenarioSelection from "../components/ScenarioSelection";
import SystemVersionSelection from "../components/SystemVersionSelection";
import StartBenchmarkButton from "../components/StartBenchmarkButton";
import useBenchmarkRunner from "../hooks/useBenchmarkRunner";

const StartBenchmark = () => {
  const { session } = useSupabaseAuth();
  const { data: scenarios, isLoading: scenariosLoading } = useBenchmarkScenarios();
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [systemVersion, setSystemVersion] = useState("http://localhost:8000");

  const { isRunning, startRunner, stopRunner } = useBenchmarkRunner(systemVersion);
  const addRun = useAddRun();

  if (scenariosLoading) {
    return <div>Loading...</div>;
  }

  const handleStartBenchmark = async () => {
    if (selectedScenarios.length === 0) {
      toast.error("Please select at least one scenario to run.");
      return;
    }

    try {
      // Create run entries for each selected scenario
      for (const scenarioId of selectedScenarios) {
        await addRun.mutateAsync({
          scenario_id: scenarioId,
          system_version: systemVersion,
          state: 'paused',
          user_id: session.user.id,
          project_id: `temp_project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
      }

      toast.success("Benchmark runs created successfully");
      startRunner();
    } catch (error) {
      console.error("Error starting benchmark:", error);
      toast.error("An error occurred while starting the benchmark. Please try again.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <ScenarioSelection
            scenarios={scenarios}
            selectedScenarios={selectedScenarios}
            setSelectedScenarios={setSelectedScenarios}
          />

          <SystemVersionSelection
            systemVersion={systemVersion}
            setSystemVersion={setSystemVersion}
          />

          <StartBenchmarkButton
            isRunning={isRunning}
            onClick={isRunning ? stopRunner : handleStartBenchmark}
          />
        </div>
      </main>
    </div>
  );
};

export default StartBenchmark;
