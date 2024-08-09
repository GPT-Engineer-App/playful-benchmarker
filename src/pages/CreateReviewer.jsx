import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useAddReviewer, useReviewDimensions } from "../integrations/supabase";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import ReviewerForm from "../components/ReviewerForm";

const CreateReviewer = () => {
  const navigate = useNavigate();
  const { session } = useSupabaseAuth();
  const addReviewer = useAddReviewer();
  const { data: reviewDimensions, isLoading: isLoadingDimensions } = useReviewDimensions();

  const [reviewer, setReviewer] = useState({
    dimension: "",
    description: "",
    prompt: "",
    weight: 1,
    llm_temperature: 0,
    run_count: 1,
  });

  const handleReviewerChange = (e) => {
    const { name, value } = e.target;
    setReviewer((prev) => ({ 
      ...prev, 
      [name]: name === 'weight' ? parseInt(value, 10) : value 
    }));
  };

  const handleReviewerDimensionChange = (value) => {
    if (value === "create_new") {
      navigate("/create-review-dimension");
    } else {
      setReviewer((prev) => ({ ...prev, dimension: value }));
    }
  };

  const handleReviewerLLMTemperatureChange = (value) => {
    setReviewer((prev) => ({ ...prev, llm_temperature: value[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      toast.error("You must be logged in to create a reviewer");
      return;
    }

    try {
      await addReviewer.mutateAsync(reviewer);
      toast.success("Reviewer created successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to create reviewer: " + error.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Create New Reviewer</h2>
        <ReviewerForm
          reviewer={reviewer}
          reviewDimensions={reviewDimensions}
          isLoadingDimensions={isLoadingDimensions}
          handleReviewerChange={handleReviewerChange}
          handleReviewerDimensionChange={handleReviewerDimensionChange}
          handleReviewerLLMTemperatureChange={handleReviewerLLMTemperatureChange}
          handleSubmit={handleSubmit}
          submitButtonText="Create Reviewer"
        />
      </main>
    </div>
  );
};

export default CreateReviewer;
