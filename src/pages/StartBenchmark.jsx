import Navbar from "../components/Navbar";
import ScenarioSelector from "../components/benchmark/ScenarioSelector";
import SystemVersionSelector from "../components/benchmark/SystemVersionSelector";
import StartBenchmarkButton from "../components/benchmark/StartBenchmarkButton";
import useBenchmarkLogic from "../hooks/useBenchmarkLogic";

const StartBenchmark = () => {
  const {
    scenarios,
    scenariosLoading,
    selectedScenarios,
    systemVersion,
    isRunning,
    handleScenarioToggle,
    setSystemVersion,
    handleStartBenchmark,
  } = useBenchmarkLogic();

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
            handleScenarioToggle={handleScenarioToggle}
          />

          <SystemVersionSelector
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