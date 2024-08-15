import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScenarioDetails from "../components/ScenarioDetails";
import useCreateScenarioForm from "../hooks/useCreateScenarioForm";
import { useBenchmarkScenario, useUpdateBenchmarkScenario, useReviewers, useScenarioReviewers } from "../integrations/supabase";
import { toast } from "sonner";
import Navbar from "../components/Navbar";

const EditScenario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: scenarioData, isLoading: isLoadingScenario } = useBenchmarkScenario(id);
  const { data: scenarioReviewers, isLoading: isLoadingScenarioReviewers } = useScenarioReviewers(id);
  const updateScenario = useUpdateBenchmarkScenario();
  const { data: availableReviewers = [] } = useReviewers();

  const {
    scenario,
    handleScenarioChange,
    handleLLMTemperatureChange,
    setScenario,
    selectedReviewers,
    setSelectedReviewers,
    handleReviewerSelection,
  } = useCreateScenarioForm();

  useEffect(() => {
    if (scenarioData) {
      setScenario(scenarioData);
    }
  }, [scenarioData, setScenario]);

  useEffect(() => {
    if (scenarioReviewers) {
      setSelectedReviewers(scenarioReviewers.map(sr => sr.reviewer_id));
    }
  }, [scenarioReviewers, setSelectedReviewers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateScenario.mutateAsync({ id, ...scenario, reviewers: selectedReviewers });
      toast.success("Scenario updated successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to update scenario: " + error.message);
    }
  };

  if (isLoadingScenario || isLoadingScenarioReviewers) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <ScenarioDetails
            scenario={scenario}
            handleScenarioChange={handleScenarioChange}
            handleLLMTemperatureChange={handleLLMTemperatureChange}
            availableReviewers={availableReviewers}
            selectedReviewers={selectedReviewers}
            handleReviewerSelection={handleReviewerSelection}
          />

          <Button type="submit" className="w-full">Update Scenario</Button>
        </form>
      </main>
    </div>
  );
};

export default EditScenario;