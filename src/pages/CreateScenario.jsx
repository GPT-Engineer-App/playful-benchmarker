import { useNavigate } from "react-router-dom";
import ScenarioDetails from "../components/ScenarioDetails";
import useCreateScenarioForm from "../hooks/useCreateScenarioForm";
import { Button } from "@/components/ui/button";
import Navbar from "../components/Navbar";
import { useGenerateText } from "../hooks/useGenerateText";
import { useReviewers } from "../integrations/supabase";

const CreateScenario = () => {
  const navigate = useNavigate();
  const {
    scenario,
    handleScenarioChange,
    handleLLMTemperatureChange,
    handleSubmit,
    setScenario,
    selectedReviewers,
    handleReviewerSelection,
  } = useCreateScenarioForm();

  const { generateText, isGenerating } = useGenerateText();
  const { data: availableReviewers = [] } = useReviewers();

  const handleGenerateName = async () => {
    const generatedName = await generateText("scenario_name");
    setScenario(prev => ({ ...prev, name: generatedName }));
  };

  const handleGenerateDescription = async () => {
    const generatedDescription = await generateText("scenario_description", scenario.name);
    setScenario(prev => ({ ...prev, description: generatedDescription }));
  };

  const handleGeneratePrompt = async () => {
    const generatedPrompt = await generateText("scenario_prompt", scenario.name, scenario.description);
    setScenario(prev => ({ ...prev, prompt: generatedPrompt }));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <ScenarioDetails
            scenario={scenario}
            handleScenarioChange={handleScenarioChange}
            handleLLMTemperatureChange={handleLLMTemperatureChange}
            handleGenerateName={handleGenerateName}
            handleGenerateDescription={handleGenerateDescription}
            handleGeneratePrompt={handleGeneratePrompt}
            isGenerating={isGenerating}
            availableReviewers={availableReviewers}
            selectedReviewers={selectedReviewers}
            handleReviewerSelection={handleReviewerSelection}
          />

          <Button type="submit" className="w-full mt-8">Create Scenario</Button>
        </form>
      </main>
    </div>
  );
};

export default CreateScenario;