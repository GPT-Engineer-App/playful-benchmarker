import { useNavigate } from "react-router-dom";
import ScenarioDetails from "../components/ScenarioDetails";
import useCreateScenarioForm from "../hooks/useCreateScenarioForm";
import { Button } from "@/components/ui/button";
import Navbar from "../components/Navbar";

const CreateScenario = () => {
  const navigate = useNavigate();
  const {
    scenario,
    handleScenarioChange,
    handleLLMTemperatureChange,
    handleSubmit,
  } = useCreateScenarioForm();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <ScenarioDetails
            scenario={scenario}
            handleScenarioChange={handleScenarioChange}
            handleLLMTemperatureChange={handleLLMTemperatureChange}
          />

          <Button type="submit" className="w-full mt-8">Create Scenario</Button>
        </form>
      </main>
    </div>
  );
};

export default CreateScenario;