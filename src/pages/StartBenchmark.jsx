import { useState } from "react";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useBenchmarkScenarios, useUserSecrets } from "../integrations/supabase";
import Navbar from "../components/Navbar";
import ScenarioSelection from "../components/ScenarioSelection";
import SystemVersionSelection from "../components/SystemVersionSelection";
import StartBenchmarkButton from "../components/StartBenchmarkButton";
import useBenchmarkLogic from "../hooks/useBenchmarkLogic";
import { useIncompleteRuns } from "../integrations/supabase";

const StartBenchmark = () => {
  const { session } = useSupabaseAuth();
  const { data: scenarios, isLoading: scenariosLoading } = useBenchmarkScenarios();
  const { data: userSecrets } = useUserSecrets();
  const { data: incompleteRuns, isLoading: incompleteRunsLoading } = useIncompleteRuns();
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [systemVersion, setSystemVersion] = useState("http://localhost:8000");

  const {
    isRunning,
    handleStartBenchmark,
    handleContinueBenchmark
  } = useBenchmarkLogic(selectedScenarios, scenarios, systemVersion, session, userSecrets);

  if (scenariosLoading || incompleteRunsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {incompleteRuns && incompleteRuns.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Incomplete Runs</h3>
              <p>You have {incompleteRuns.length} incomplete benchmark runs.</p>
              <Button onClick={() => handleContinueBenchmark(incompleteRuns)} className="mt-2">
                Continue Incomplete Runs
              </Button>
            </div>
          )}

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
