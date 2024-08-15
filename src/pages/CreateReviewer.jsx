import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useAddReviewer, useReviewDimensions } from "../integrations/supabase";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import ReviewerForm from "../components/ReviewerForm";
import { Button } from "@/components/ui/button";

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
    llm_model: "aws--anthropic.claude-3-5-sonnet-20240620-v1:0", // Default LLM model
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    console.log("Submitting reviewer:", reviewer); // Debug log

    try {
      await addReviewer.mutateAsync(reviewer);
      toast.success("Reviewer created successfully");
      navigate("/");
    } catch (error) {
      console.error("Error creating reviewer:", error); // Debug log
      toast.error("Failed to create reviewer: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Create New Reviewer</h2>
        <form onSubmit={handleSubmit}>
          <ReviewerForm
            reviewer={reviewer}
            reviewDimensions={reviewDimensions}
            isLoadingDimensions={isLoadingDimensions}
            handleReviewerChange={handleReviewerChange}
            handleReviewerDimensionChange={handleReviewerDimensionChange}
            handleReviewerLLMTemperatureChange={handleReviewerLLMTemperatureChange}
          />
          <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Reviewer"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default CreateReviewer;