import { useState } from "react";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useBenchmarkScenarios } from "../integrations/supabase";
import Navbar from "../components/Navbar";
import ScenarioSelection from "../components/ScenarioSelection";
import SystemVersionSelection from "../components/SystemVersionSelection";
import StartBenchmarkButton from "../components/StartBenchmarkButton";
import useBenchmarkLogic from "../hooks/useBenchmarkLogic";

const StartBenchmark = () => {
  const { session } = useSupabaseAuth();
  const { data: scenarios, isLoading: scenariosLoading } = useBenchmarkScenarios();
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [systemVersion, setSystemVersion] = useState("http://localhost:8000");

  const { isRunning, handleStartBenchmark } = useBenchmarkLogic(selectedScenarios, scenarios, systemVersion, session);

  if (scenariosLoading) {
    return <div>Loading scenarios...</div>;
  }

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
            onClick={handleStartBenchmark}
          />
        </div>
      </main>
    </div>
  );
};

export default StartBenchmark;
