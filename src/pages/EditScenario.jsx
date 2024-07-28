import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import ScenarioDetails from "../components/ScenarioDetails";
import ReviewerDetails from "../components/ReviewerDetails";
import useCreateScenarioForm from "../hooks/useCreateScenarioForm";
import { useBenchmarkScenario, useUpdateBenchmarkScenario, useReviewers, useUpdateReviewer } from "../integrations/supabase";
import { toast } from "sonner";

const EditScenario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useSupabaseAuth();
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
    handleLLMModelChange,
    handleLLMTemperatureChange,
    handleReviewerChange,
    handleReviewerDimensionChange,
    handleReviewerLLMModelChange,
    handleReviewerLLMTemperatureChange,
    addReviewerField,
    handleDeleteReviewer,
    setScenario,
    setReviewers,
  } = useCreateScenarioForm();

  useEffect(() => {
    if (scenarioData) {
      setScenario(scenarioData);
    }
  }, [scenarioData, setScenario]);

  useEffect(() => {
    if (reviewersData) {
      const scenarioReviewers = reviewersData.filter(reviewer => reviewer.scenario_id === id);
      setReviewers(scenarioReviewers);
    }
  }, [reviewersData, id, setReviewers]);

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

  const handleLogout = async () => {
    await logout();
  };

  if (isLoadingScenario || isLoadingReviewers) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Edit Scenario</h1>
          <nav>
            <ul className="flex space-x-4 items-center">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li><Link to="/about" className="hover:underline">About</Link></li>
              <li><Link to="/secrets" className="hover:underline">Secrets</Link></li>
              <li><Button onClick={handleLogout} variant="ghost" className="h-9 px-4 py-2">Logout</Button></li>
            </ul>
          </nav>
        </div>
      </header>

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
                key={reviewer.id}
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

          <Button type="submit" className="w-full">Update Scenario</Button>
        </form>
      </main>
    </div>
  );
};

export default EditScenario;