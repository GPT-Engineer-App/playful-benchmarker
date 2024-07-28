import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAuth } from "../../integrations/supabase/auth";
import { useBenchmarkScenarios, useUserSecrets } from "../../integrations/supabase";
import { toast } from "sonner";
import Navbar from "../Navbar";
import ScenarioSelection from "./ScenarioSelection";
import { useBenchmarkActions } from "../../hooks/useBenchmarkActions";

const StartBenchmark = () => {
  const { session } = useSupabaseAuth();
  const { data: scenarios, isLoading: scenariosLoading } = useBenchmarkScenarios();
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [systemVersion, setSystemVersion] = useState("http://localhost:8000");
  const { data: userSecrets } = useUserSecrets();
  const { isRunning, startBenchmark } = useBenchmarkActions(userSecrets);

  const handleScenarioToggle = (scenarioId) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenarioId)
        ? prev.filter((id) => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const handleStartBenchmark = async () => {
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

    await startBenchmark(selectedScenarios, scenarios, systemVersion, session);
  };

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
            onToggle={handleScenarioToggle}
          />

          <h2 className="text-2xl font-bold mb-4">Select System Version</h2>
          <Select value={systemVersion} onValueChange={setSystemVersion}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select system version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="http://localhost:8000">http://localhost:8000</SelectItem>
              <SelectItem value="https://api.gpt-engineer.com">https://api.gpt-engineer.com</SelectItem>
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