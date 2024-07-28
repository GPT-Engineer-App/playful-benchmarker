import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import ScenarioDetails from "../components/ScenarioDetails";
import ReviewerDetails from "../components/ReviewerDetails";
import useCreateScenarioForm from "../hooks/useCreateScenarioForm";

const CreateScenario = () => {
  const { logout } = useSupabaseAuth();
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
    handleSubmit,
  } = useCreateScenarioForm();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Create Scenario</h1>
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
                key={index}
                reviewer={reviewer}
                index={index}
                reviewDimensions={reviewDimensions}
                isLoadingDimensions={isLoadingDimensions}
                handleReviewerChange={handleReviewerChange}
                handleReviewerDimensionChange={handleReviewerDimensionChange}
                handleReviewerLLMModelChange={handleReviewerLLMModelChange}
                handleReviewerLLMTemperatureChange={handleReviewerLLMTemperatureChange}
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