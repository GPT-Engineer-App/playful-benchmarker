import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useAddBenchmarkScenario, useAddReviewer, useReviewDimensions, useReviewers, useAddScenarioReviewer } from "../integrations/supabase";
import { toast } from "sonner";

const useCreateScenarioForm = () => {
  const navigate = useNavigate();
  const { session } = useSupabaseAuth();
  const addBenchmarkScenario = useAddBenchmarkScenario();
  const addReviewer = useAddReviewer();
  const { data: reviewDimensions, isLoading: isLoadingDimensions } = useReviewDimensions();
  const { data: existingReviewers, isLoading: isLoadingReviewers } = useReviewers();
  const addScenarioReviewer = useAddScenarioReviewer();

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

  const [specificReviewers, setSpecificReviewers] = useState(() => {
    const savedReviewers = localStorage.getItem('draftSpecificReviewers');
    return savedReviewers ? JSON.parse(savedReviewers) : [];
  });

  const [selectedGenericReviewers, setSelectedGenericReviewers] = useState(() => {
    const savedGenericReviewers = localStorage.getItem('draftSelectedGenericReviewers');
    return savedGenericReviewers ? JSON.parse(savedGenericReviewers) : [];
  });

  const saveDraft = useCallback(() => {
    localStorage.setItem('draftScenario', JSON.stringify(scenario));
    localStorage.setItem('draftSpecificReviewers', JSON.stringify(specificReviewers));
    localStorage.setItem('draftSelectedGenericReviewers', JSON.stringify(selectedGenericReviewers));
  }, [scenario, specificReviewers, selectedGenericReviewers]);

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

  const handleSpecificReviewerChange = (index, e) => {
    const { name, value } = e.target;
    setSpecificReviewers((prev) => {
      const newReviewers = [...prev];
      newReviewers[index] = { 
        ...newReviewers[index], 
        [name]: name === 'weight' ? parseInt(value, 10) : value 
      };
      return newReviewers;
    });
  };

  const handleSpecificReviewerDimensionChange = (index, value) => {
    if (value === "create_new") {
      saveDraft();
      navigate("/create-review-dimension");
    } else {
      setSpecificReviewers((prev) => {
        const newReviewers = [...prev];
        newReviewers[index] = { ...newReviewers[index], dimension: value };
        return newReviewers;
      });
    }
  };

  const handleSpecificReviewerLLMTemperatureChange = (index, value) => {
    setSpecificReviewers((prev) => {
      const newReviewers = [...prev];
      newReviewers[index] = { ...newReviewers[index], llm_temperature: value[0] };
      return newReviewers;
    });
  };

  const addSpecificReviewerField = (existingReviewer = null) => {
    setSpecificReviewers((prev) => [
      ...prev,
      existingReviewer || {
        dimension: "",
        description: "",
        prompt: "",
        weight: 1,
        llm_temperature: 0,
        run_count: 1,
      },
    ]);
  };

  const handleDeleteSpecificReviewer = (index) => {
    setSpecificReviewers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenericReviewerSelection = (reviewerId) => {
    setSelectedGenericReviewers((prev) => {
      if (prev.includes(reviewerId)) {
        return prev.filter(id => id !== reviewerId);
      } else {
        return [...prev, reviewerId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      toast.error("You must be logged in to create a scenario");
      return;
    }

    try {
      console.log("Attempting to create scenario:", scenario);
      const result = await addBenchmarkScenario.mutateAsync(scenario);
      console.log("Scenario creation response:", result);
      
      if (result.error) {
        throw new Error("Failed to create scenario: " + result.error.message);
      }
      
      const createdScenarioId = result.data?.id || result.id;
      if (!createdScenarioId) {
        throw new Error("Failed to create scenario: No ID returned");
      }
      
      console.log("Created scenario ID:", createdScenarioId);

      // Add specific reviewers
      const specificReviewerPromises = specificReviewers.map(async (reviewer) => {
        const { data: newReviewer } = await addReviewer.mutateAsync({ ...reviewer, is_generic: false });
        if (newReviewer && newReviewer.id) {
          await addScenarioReviewer.mutateAsync({
            scenario_id: createdScenarioId,
            reviewer_id: newReviewer.id,
          });
        }
      });

      // Add selected generic reviewers
      const genericReviewerPromises = selectedGenericReviewers.map(async (reviewerId) => {
        await addScenarioReviewer.mutateAsync({
          scenario_id: createdScenarioId,
          reviewer_id: reviewerId,
        });
      });

      await Promise.all([...specificReviewerPromises, ...genericReviewerPromises]);

      // Clear the draft from localStorage
      localStorage.removeItem('draftScenario');
      localStorage.removeItem('draftSpecificReviewers');
      localStorage.removeItem('draftSelectedGenericReviewers');

      toast.success("Scenario and reviewers created successfully");
      navigate("/");
    } catch (error) {
      console.error("Error creating scenario:", error);
      toast.error(`Failed to create scenario: ${error.message}`);
    }
  };

  return {
    scenario,
    specificReviewers,
    selectedGenericReviewers,
    setSelectedGenericReviewers,
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
    setScenario,
    setSpecificReviewers,
    existingReviewers,
    isLoadingReviewers,
  };
};

export default useCreateScenarioForm;
