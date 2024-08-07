import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ScenarioDetails from "../components/ScenarioDetails";
import ReviewerForm from "../components/ReviewerForm";
import useCreateScenarioForm from "../hooks/useCreateScenarioForm";
import { Button } from "@/components/ui/button";
import Navbar from "../components/Navbar";

const CreateScenario = () => {
  const navigate = useNavigate();
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
    handleSubmit,
  } = useCreateScenarioForm();

  const [activeReviewerIndex, setActiveReviewerIndex] = useState(null);

  const handleReviewerSubmit = (e) => {
    e.preventDefault();
    if (activeReviewerIndex !== null) {
      setActiveReviewerIndex(null);
    } else {
      addReviewerField();
      setActiveReviewerIndex(reviewers.length);
    }
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
          />

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Reviewers</h2>
            {reviewers.map((reviewer, index) => (
              <div key={index} className="border p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-2">Reviewer {index + 1}</h3>
                {activeReviewerIndex === index ? (
                  <ReviewerForm
                    reviewer={reviewer}
                    reviewDimensions={reviewDimensions}
                    isLoadingDimensions={isLoadingDimensions}
                    handleReviewerChange={(e) => handleReviewerChange(index, e)}
                    handleReviewerDimensionChange={(value) => handleReviewerDimensionChange(index, value)}
                    handleReviewerLLMTemperatureChange={(value) => handleReviewerLLMTemperatureChange(index, value)}
                    handleSubmit={handleReviewerSubmit}
                    submitButtonText="Save Reviewer"
                  />
                ) : (
                  <div>
                    <p><strong>Dimension:</strong> {reviewer.dimension}</p>
                    <p><strong>Description:</strong> {reviewer.description}</p>
                    <div className="mt-2">
                      <Button type="button" onClick={() => setActiveReviewerIndex(index)}>Edit</Button>
                      <Button type="button" variant="destructive" className="ml-2" onClick={() => handleDeleteReviewer(index)}>Delete</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {activeReviewerIndex === null && (
              <Button type="button" onClick={() => setActiveReviewerIndex(reviewers.length)}>Add Reviewer</Button>
            )}
          </div>

          <Button type="submit" className="w-full">Create Scenario</Button>
        </form>
      </main>
    </div>
  );
};

export default CreateScenario;
