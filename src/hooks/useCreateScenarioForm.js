import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useAddBenchmarkScenario, useUpdateBenchmarkScenario, useAddScenarioReviewer, useDeleteScenarioReviewer } from "../integrations/supabase";
import { toast } from "sonner";

const useCreateScenarioForm = () => {
  const navigate = useNavigate();
  const { session } = useSupabaseAuth();
  const addBenchmarkScenario = useAddBenchmarkScenario();
  const updateBenchmarkScenario = useUpdateBenchmarkScenario();
  const addScenarioReviewer = useAddScenarioReviewer();
  const deleteScenarioReviewer = useDeleteScenarioReviewer();

  const [scenario, setScenario] = useState(() => {
    const savedScenario = localStorage.getItem('draftScenario');
    return savedScenario ? JSON.parse(savedScenario) : {
      name: "",
      description: "",
      prompt: "",
      llm_temperature: 0.5,
      timeout: 300,
    };
  });

  const [reviewers, setReviewers] = useState([]);

  const saveDraft = useCallback(() => {
    localStorage.setItem('draftScenario', JSON.stringify(scenario));
  }, [scenario]);

  useEffect(() => {
    window.addEventListener('beforeunload', saveDraft);
    return () => {
      window.removeEventListener('beforeunload', saveDraft);
      saveDraft();
    };
  }, [saveDraft]);

  const handleScenarioChange = (e) => {
    const { name, value } = e.target;
    setScenario((prev) => ({ ...prev, [name]: value }));
  };

  const handleLLMTemperatureChange = (value) => {
    setScenario((prev) => ({ ...prev, llm_temperature: value[0] }));
  };

  const handleAddReviewer = () => {
    setReviewers([...reviewers, { dimension: "", description: "", prompt: "", weight: 1, llm_temperature: 0.5, run_count: 1 }]);
  };

  const handleReviewerChange = (index, e) => {
    const { name, value } = e.target;
    const updatedReviewers = [...reviewers];
    updatedReviewers[index] = { ...updatedReviewers[index], [name]: value };
    setReviewers(updatedReviewers);
  };

  const handleDeleteReviewer = (index) => {
    setReviewers(reviewers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      toast.error("You must be logged in to create a scenario");
      return;
    }

    try {
      let scenarioId;
      if (scenario.id) {
        // Update existing scenario
        await updateBenchmarkScenario.mutateAsync(scenario);
        scenarioId = scenario.id;
      } else {
        // Create new scenario
        const result = await addBenchmarkScenario.mutateAsync(scenario);
        scenarioId = result.data.id;
      }

      // Handle reviewers
      for (const reviewer of reviewers) {
        if (reviewer.id) {
          // Update existing reviewer
          await addScenarioReviewer.mutateAsync({ scenario_id: scenarioId, reviewer_id: reviewer.id });
        } else {
          // Add new reviewer
          await addScenarioReviewer.mutateAsync({ scenario_id: scenarioId, reviewer: reviewer });
        }
      }

      // Delete removed reviewers
      const existingReviewerIds = reviewers.filter(r => r.id).map(r => r.id);
      await deleteScenarioReviewer.mutateAsync({ scenario_id: scenarioId, reviewer_ids: existingReviewerIds });

      // Clear the draft from localStorage
      localStorage.removeItem('draftScenario');

      toast.success(scenario.id ? "Scenario updated successfully" : "Scenario created successfully");
      navigate("/");
    } catch (error) {
      console.error("Error creating/updating scenario:", error);
      toast.error(`Failed to ${scenario.id ? 'update' : 'create'} scenario: ${error.message}`);
    }
  };

  return {
    scenario,
    reviewers,
    handleScenarioChange,
    handleLLMTemperatureChange,
    handleSubmit,
    setScenario,
    setReviewers,
    handleAddReviewer,
    handleReviewerChange,
    handleDeleteReviewer,
  };
};

export default useCreateScenarioForm;