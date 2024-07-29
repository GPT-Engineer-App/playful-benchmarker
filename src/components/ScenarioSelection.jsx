import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const ScenarioSelection = ({ scenarios, selectedScenarios, setSelectedScenarios }) => {
  const handleScenarioToggle = (scenarioId) => {
    setSelectedScenarios((prev) =>
      prev.includes(scenarioId)
        ? prev.filter((id) => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  return (
    <>
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
    </>
  );
};

export default ScenarioSelection;
