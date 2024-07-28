import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useAddBenchmarkScenario, useAddReview } from "../integrations/supabase";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { toast } from "sonner";

const CreateScenario = () => {
  const [scenario, setScenario] = useState({
    name: "",
    description: "",
    prompt: "",
    llm_model: "",
    llm_temperature: 0,
  });
  const [reviews, setReviews] = useState([]);
  const navigate = useNavigate();
  const { session, logout } = useSupabaseAuth();
  const addBenchmarkScenario = useAddBenchmarkScenario();
  const addReview = useAddReview();

  const handleScenarioChange = (e) => {
    const { name, value } = e.target;
    setScenario((prev) => ({ ...prev, [name]: value }));
  };

  const handleLLMModelChange = (value) => {
    setScenario((prev) => ({ ...prev, llm_model: value }));
  };

  const handleLLMTemperatureChange = (value) => {
    setScenario((prev) => ({ ...prev, llm_temperature: value[0] }));
  };

  const handleReviewChange = (index, e) => {
    const { name, value } = e.target;
    setReviews((prev) => {
      const newReviews = [...prev];
      newReviews[index] = { ...newReviews[index], [name]: value };
      return newReviews;
    });
  };

  const handleReviewLLMTemperatureChange = (index, value) => {
    setReviews((prev) => {
      const newReviews = [...prev];
      newReviews[index] = { ...newReviews[index], llm_temperature: value[0] };
      return newReviews;
    });
  };

  const addReviewField = () => {
    setReviews((prev) => [
      ...prev,
      {
        dimension: "",
        description: "",
        prompt: "",
        weight: 0,
        llm_model: "",
        llm_temperature: 0,
        run_count: 1,
      },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      toast.error("You must be logged in to create a scenario");
      return;
    }

    try {
      const { data: scenarioData, error: scenarioError } = await addBenchmarkScenario.mutateAsync(scenario);
      if (scenarioError) throw scenarioError;

      for (const review of reviews) {
        const { error: reviewError } = await addReview.mutateAsync({
          ...review,
          scenario_id: scenarioData[0].id,
        });
        if (reviewError) throw reviewError;
      }

      toast.success("Scenario and reviews created successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to create scenario: " + error.message);
    }
  };

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
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Scenario Details</h2>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={scenario.name}
                onChange={handleScenarioChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={scenario.description}
                onChange={handleScenarioChange}
              />
            </div>
            <div>
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                name="prompt"
                value={scenario.prompt}
                onChange={handleScenarioChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="llm_model">LLM Model</Label>
              <Select onValueChange={handleLLMModelChange} value={scenario.llm_model}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select LLM Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aws--anthropic.claude-3-5-sonnet-20240620-v1:0">
                    aws--anthropic.claude-3-5-sonnet-20240620-v1:0
                  </SelectItem>
                  <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="llm_temperature">LLM Temperature: {scenario.llm_temperature.toFixed(2)}</Label>
              <Slider
                id="llm_temperature"
                min={0}
                max={1}
                step={0.01}
                value={[scenario.llm_temperature]}
                onValueChange={handleLLMTemperatureChange}
                className="mt-2"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Reviews</h2>
            {reviews.map((review, index) => (
              <div key={index} className="border p-4 rounded-md space-y-2">
                <h3 className="text-lg font-semibold">Review {index + 1}</h3>
                <div>
                  <Label htmlFor={`dimension-${index}`}>Dimension</Label>
                  <Input
                    id={`dimension-${index}`}
                    name="dimension"
                    value={review.dimension}
                    onChange={(e) => handleReviewChange(index, e)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`review-description-${index}`}>Description</Label>
                  <Textarea
                    id={`review-description-${index}`}
                    name="description"
                    value={review.description}
                    onChange={(e) => handleReviewChange(index, e)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`review-prompt-${index}`}>Prompt</Label>
                  <Textarea
                    id={`review-prompt-${index}`}
                    name="prompt"
                    value={review.prompt}
                    onChange={(e) => handleReviewChange(index, e)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`weight-${index}`}>Weight</Label>
                  <Input
                    id={`weight-${index}`}
                    name="weight"
                    type="number"
                    step="0.1"
                    value={review.weight}
                    onChange={(e) => handleReviewChange(index, e)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`review-llm-model-${index}`}>LLM Model</Label>
                  <Input
                    id={`review-llm-model-${index}`}
                    name="llm_model"
                    value={review.llm_model}
                    onChange={(e) => handleReviewChange(index, e)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor={`review-llm-temperature-${index}`}>LLM Temperature: {review.llm_temperature.toFixed(2)}</Label>
                  <Slider
                    id={`review-llm-temperature-${index}`}
                    min={0}
                    max={1}
                    step={0.01}
                    value={[review.llm_temperature]}
                    onValueChange={(value) => handleReviewLLMTemperatureChange(index, value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor={`run-count-${index}`}>Run Count</Label>
                  <Input
                    id={`run-count-${index}`}
                    name="run_count"
                    type="number"
                    value={review.run_count}
                    onChange={(e) => handleReviewChange(index, e)}
                    required
                  />
                </div>
              </div>
            ))}
            <Button type="button" onClick={addReviewField}>Add Review</Button>
          </div>

          <Button type="submit" className="w-full">Create Scenario</Button>
        </form>
      </main>
    </div>
  );
};

export default CreateScenario;