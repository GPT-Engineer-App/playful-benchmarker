import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScenarioDetails from "../components/ScenarioDetails";
import ReviewerDetails from "../components/ReviewerDetails";
import useCreateScenarioForm from "../hooks/useCreateScenarioForm";
import { useBenchmarkScenario, useUpdateBenchmarkScenario, useReviewers, useUpdateReviewer } from "../integrations/supabase";
import { toast } from "sonner";
import Navbar from "../components/Navbar";

const EditScenario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: scenarioData, isLoading: isLoadingScenario } = useBenchmarkScenario(id);
  const { data: reviewersData, isLoading: isLoadingReviewers } = useReviewers();
  const updateScenario = useUpdateBenchmarkScenario();
  const updateReviewer = useUpdateReviewer();

  const {
    scenario,
    reviewers,
    reviewDimensions,
    isLoadingDimensions,
    handleScenarioChange,
    handleLLMTemperatureChange,
    handleReviewerChange,
    handleReviewerDimensionChange,
    handleReviewerLLMTemperatureChange,
    addReviewerField,
    handleDeleteReviewer,
    setScenario,
    setReviewers: setSpecificReviewers,
  } = useCreateScenarioForm();

  useEffect(() => {
    if (scenarioData) {
      setScenario(scenarioData);
    }
  }, [scenarioData, setScenario]);

  useEffect(() => {
    if (reviewersData) {
      const scenarioReviewers = reviewersData.filter(reviewer => reviewer.scenario_id === id);
      setSpecificReviewers(scenarioReviewers);
    }
  }, [reviewersData, id, setSpecificReviewers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateScenario.mutateAsync({ id, ...scenario });
      
      for (const reviewer of reviewers) {
        await updateReviewer.mutateAsync({ id: reviewer.id, ...reviewer });
      }

      toast.success("Scenario updated successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to update scenario: " + error.message);
    }
  };

  if (isLoadingScenario || isLoadingReviewers) {
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
          />

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Reviewers</h2>
            {reviewers && reviewers.length > 0 ? (
              reviewers.map((reviewer, index) => (
                <ReviewerDetails
                  key={reviewer.id}
                  reviewer={reviewer}
                  index={index}
                  reviewDimensions={reviewDimensions}
                  isLoadingDimensions={isLoadingDimensions}
                  handleReviewerChange={handleReviewerChange}
                  handleReviewerDimensionChange={handleReviewerDimensionChange}
                  handleReviewerLLMTemperatureChange={handleReviewerLLMTemperatureChange}
                  handleDeleteReviewer={handleDeleteReviewer}
                />
              ))
            ) : (
              <p>No reviewers found for this scenario.</p>
            )}
            <Button type="button" onClick={addReviewerField}>Add Reviewer</Button>
          </div>

          <Button type="submit" className="w-full">Update Scenario</Button>
        </form>
      </main>
    </div>
  );
};

export default EditScenario;
