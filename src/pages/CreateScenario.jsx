import ScenarioDetails from "../components/ScenarioDetails";
import ReviewerDetails from "../components/ReviewerDetails";
import useCreateScenarioForm from "../hooks/useCreateScenarioForm";
import { Button } from "@/components/ui/button";
import Navbar from "../components/Navbar";

const CreateScenario = () => {
  const {
    scenario,
    reviewers,
    reviewDimensions,
    isLoadingDimensions,
    handleScenarioChange,
    handleLLMModelChange,
    handleLLMTemperatureChange,
    handleReviewerChange,
    handleReviewerDimensionChange,
    handleReviewerLLMModelChange,
    handleReviewerLLMTemperatureChange,
    addReviewerField,
    handleDeleteReviewer,
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
            handleLLMModelChange={handleLLMModelChange}
            handleLLMTemperatureChange={handleLLMTemperatureChange}
          />

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Reviewers</h2>
            {reviewers.map((reviewer, index) => (
              <ReviewerDetails
                key={index}
                reviewer={reviewer}
                index={index}
                reviewDimensions={reviewDimensions}
                isLoadingDimensions={isLoadingDimensions}
                handleReviewerChange={handleReviewerChange}
                handleReviewerDimensionChange={handleReviewerDimensionChange}
                handleReviewerLLMModelChange={handleReviewerLLMModelChange}
                handleReviewerLLMTemperatureChange={handleReviewerLLMTemperatureChange}
                handleDeleteReviewer={handleDeleteReviewer}
              />
            ))}
            <Button type="button" onClick={addReviewerField}>Add Reviewer</Button>
          </div>

          <Button type="submit" className="w-full">Create Scenario</Button>
        </form>
      </main>
    </div>
  );
};

export default CreateScenario;