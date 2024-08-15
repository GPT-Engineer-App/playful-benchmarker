import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useReviewer, useUpdateReviewer, useReviewDimensions } from "../integrations/supabase";
import { toast } from "sonner";
import Navbar from "../components/Navbar";
import ReviewerForm from "../components/ReviewerForm";
import { Button } from "@/components/ui/button";

const EditReviewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useSupabaseAuth();
  const { data: reviewerData, isLoading: isLoadingReviewer } = useReviewer(id);
  const updateReviewer = useUpdateReviewer();
  const { data: reviewDimensions, isLoading: isLoadingDimensions } = useReviewDimensions();

  const [reviewer, setReviewer] = useState({
    dimension: "",
    description: "",
    prompt: "",
    weight: 1,
    llm_temperature: 0,
    run_count: 1,
    llm_model: "aws--anthropic.claude-3-5-sonnet-20240620-v1:0",
  });

  useEffect(() => {
    if (reviewerData) {
      setReviewer(reviewerData);
    }
  }, [reviewerData]);

  const handleReviewerChange = (e) => {
    const { name, value } = e.target;
    setReviewer((prev) => ({ 
      ...prev, 
      [name]: name === 'weight' ? parseInt(value, 10) : value 
    }));
  };

  const handleReviewerDimensionChange = (value) => {
    setReviewer((prev) => ({ ...prev, dimension: value }));
  };

  const handleReviewerLLMTemperatureChange = (value) => {
    setReviewer((prev) => ({ ...prev, llm_temperature: value[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      toast.error("You must be logged in to update a reviewer");
      return;
    }

    try {
      await updateReviewer.mutateAsync({ id, ...reviewer });
      toast.success("Reviewer updated successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to update reviewer: " + error.message);
    }
  };

  if (isLoadingReviewer) {
    return <div>Loading reviewer...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Edit Reviewer</h2>
        <form onSubmit={handleSubmit}>
          <ReviewerForm
            reviewer={reviewer}
            reviewDimensions={reviewDimensions}
            isLoadingDimensions={isLoadingDimensions}
            handleReviewerChange={handleReviewerChange}
            handleReviewerDimensionChange={handleReviewerDimensionChange}
            handleReviewerLLMTemperatureChange={handleReviewerLLMTemperatureChange}
          />
          <Button type="submit" className="w-full mt-4">
            Update Reviewer
          </Button>
        </form>
      </main>
    </div>
  );
};

export default EditReviewer;