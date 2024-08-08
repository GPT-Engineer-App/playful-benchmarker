import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import ScenarioDetails from "../components/ScenarioDetails";
import ReviewerForm from "../components/ReviewerForm";
import useCreateScenarioForm from "../hooks/useCreateScenarioForm";
import { Button } from "@/components/ui/button";
import Navbar from "../components/Navbar";
import { useGenericReviewers } from "../integrations/supabase";

const CreateScenario = () => {
  const navigate = useNavigate();
  const {
    scenario,
    specificReviewers,
    selectedGenericReviewers,
    reviewDimensions,
    isLoadingDimensions,
    handleScenarioChange,
    handleLLMTemperatureChange,
    handleSpecificReviewerChange,
    handleSpecificReviewerDimensionChange,
    handleSpecificReviewerLLMTemperatureChange,
    addSpecificReviewerField,
    handleDeleteSpecificReviewer,
    handleGenericReviewerSelection,
    handleSubmit,
    existingReviewers,
    isLoadingReviewers,
  } = useCreateScenarioForm();

  const [activeReviewerIndex, setActiveReviewerIndex] = useState(null);
  const [selectedExistingReviewer, setSelectedExistingReviewer] = useState(null);
  const { data: genericReviewers, isLoading: isLoadingGenericReviewers } = useGenericReviewers();

  const handleReviewerSubmit = (e) => {
    e.preventDefault();
    if (activeReviewerIndex !== null) {
      setActiveReviewerIndex(null);
    } else {
      addSpecificReviewerField();
      setActiveReviewerIndex(specificReviewers.length);
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
            <h2 className="text-2xl font-bold">Specific Reviewers</h2>
            {specificReviewers.map((reviewer, index) => (
              <div key={index} className="border p-4 rounded-md">
                <h3 className="text-lg font-semibold mb-2">Reviewer {index + 1}</h3>
                {activeReviewerIndex === index ? (
                  <ReviewerForm
                    reviewer={reviewer}
                    reviewDimensions={reviewDimensions}
                    isLoadingDimensions={isLoadingDimensions}
                    handleReviewerChange={(e) => handleSpecificReviewerChange(index, e)}
                    handleReviewerDimensionChange={(value) => handleSpecificReviewerDimensionChange(index, value)}
                    handleReviewerLLMTemperatureChange={(value) => handleSpecificReviewerLLMTemperatureChange(index, value)}
                    handleSubmit={handleReviewerSubmit}
                    submitButtonText="Save Reviewer"
                  />
                ) : (
                  <div>
                    <p><strong>Dimension:</strong> {reviewer.dimension}</p>
                    <p><strong>Description:</strong> {reviewer.description}</p>
                    <div className="mt-2">
                      <Button type="button" onClick={() => setActiveReviewerIndex(index)}>Edit</Button>
                      <Button type="button" variant="destructive" className="ml-2" onClick={() => handleDeleteSpecificReviewer(index)}>Delete</Button>
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
                      addSpecificReviewerField(selectedExistingReviewer);
                    } else {
                      setActiveReviewerIndex(specificReviewers.length);
                    }
                    setSelectedExistingReviewer(null);
                  }}
                >
                  Add Specific Reviewer
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4 mt-8">
            <h2 className="text-2xl font-bold">Generic Reviewers</h2>
            {isLoadingGenericReviewers ? (
              <p>Loading generic reviewers...</p>
            ) : (
              genericReviewers?.map((reviewer) => (
                <div key={reviewer.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`generic-reviewer-${reviewer.id}`}
                    checked={selectedGenericReviewers.includes(reviewer.id)}
                    onCheckedChange={() => handleGenericReviewerSelection(reviewer.id)}
                  />
                  <label htmlFor={`generic-reviewer-${reviewer.id}`}>{reviewer.dimension}</label>
                </div>
              ))
            )}
          </div>

          <Button type="submit" className="w-full mt-8">Create Scenario</Button>
        </form>
      </main>
    </div>
  );
};

export default CreateScenario;
