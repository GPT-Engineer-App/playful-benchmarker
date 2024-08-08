import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    existingReviewers,
    isLoadingReviewers,
  } = useCreateScenarioForm();

  const [activeReviewerIndex, setActiveReviewerIndex] = useState(null);
  const [selectedExistingReviewer, setSelectedExistingReviewer] = useState(null);

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
              <div className="flex items-center space-x-2">
                <Select
                  onValueChange={(value) => setSelectedExistingReviewer(existingReviewers.find(r => r.id === value))}
                  disabled={isLoadingReviewers}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select existing reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingReviewers?.map((reviewer) => (
                      <SelectItem key={reviewer.id} value={reviewer.id}>
                        {reviewer.dimension}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => {
                    if (selectedExistingReviewer) {
                      addReviewerField(selectedExistingReviewer);
                    } else {
                      setActiveReviewerIndex(reviewers.length);
                    }
                    setSelectedExistingReviewer(null);
                  }}
                >
                  Add Reviewer
                </Button>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full">Create Scenario</Button>
        </form>
      </main>
    </div>
  );
};

export default CreateScenario;
