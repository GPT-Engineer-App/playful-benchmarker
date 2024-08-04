import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useAddBenchmarkScenario, useAddReviewer, useReviewDimensions } from "../integrations/supabase";
import { toast } from "sonner";

const useCreateScenarioForm = () => {
  const navigate = useNavigate();
  const { session } = useSupabaseAuth();
  const addBenchmarkScenario = useAddBenchmarkScenario();
  const addReviewer = useAddReviewer();
  const { data: reviewDimensions, isLoading: isLoadingDimensions } = useReviewDimensions();

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

  const [reviewers, setReviewers] = useState(() => {
    const savedReviewers = localStorage.getItem('draftReviewers');
    return savedReviewers ? JSON.parse(savedReviewers) : [];
  });

  const saveDraft = useCallback(() => {
    localStorage.setItem('draftScenario', JSON.stringify(scenario));
    localStorage.setItem('draftReviewers', JSON.stringify(reviewers));
  }, [scenario, reviewers]);

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

  const handleReviewerChange = (index, e) => {
    const { name, value } = e.target;
    setReviewers((prev) => {
      const newReviewers = [...prev];
      newReviewers[index] = { 
        ...newReviewers[index], 
        [name]: name === 'weight' ? parseInt(value, 10) : value 
      };
      return newReviewers;
    });
  };

  const handleReviewerDimensionChange = (index, value) => {
    if (value === "create_new") {
      saveDraft();
      navigate("/create-review-dimension");
    } else {
      setReviewers((prev) => {
        const newReviewers = [...prev];
        newReviewers[index] = { ...newReviewers[index], dimension: value };
        return newReviewers;
      });
    }
  };

  const handleReviewerLLMTemperatureChange = (index, value) => {
    setReviewers((prev) => {
      const newReviewers = [...prev];
      newReviewers[index] = { ...newReviewers[index], llm_temperature: value[0] };
      return newReviewers;
    });
  };

  const addReviewerField = () => {
    setReviewers((prev) => [
      ...prev,
      {
        dimension: "",
        description: "",
        prompt: "",
        weight: 1,
        llm_temperature: 0,
        run_count: 1,
      },
    ]);
  };

  const handleDeleteReviewer = (index) => {
    setReviewers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      toast.error("You must be logged in to create a scenario");
      return;
    }

    try {
      console.log("Attempting to create scenario:", scenario);
      const { data: scenarioData, error: scenarioError } = await addBenchmarkScenario.mutateAsync(scenario);
      console.log("Scenario creation response:", { data: scenarioData, error: scenarioError });
      
      if (scenarioError) {
        throw new Error("Failed to create scenario: " + scenarioError.message);
      }
      if (!scenarioData || scenarioData.length === 0) {
        throw new Error("Failed to create scenario: No data returned");
      }

      const createdScenarioId = scenarioData[0].id;
      console.log("Created scenario ID:", createdScenarioId);

      const reviewerPromises = reviewers.map(reviewer =>
        addReviewer.mutateAsync({
          ...reviewer,
          scenario_id: createdScenarioId,
        })
      );

      await Promise.all(reviewerPromises);

      // Clear the draft from localStorage
      localStorage.removeItem('draftScenario');
      localStorage.removeItem('draftReviewers');

      toast.success("Scenario and reviewers created successfully");
      navigate("/");
    } catch (error) {
      console.error("Error creating scenario:", error);
      toast.error(`Failed to create scenario: ${error.message}`);
    }
  };

  return {
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
    setScenario,
    setReviewers,
  };
};

export default useCreateScenarioForm;
