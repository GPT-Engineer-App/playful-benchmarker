import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "../integrations/supabase/auth";
import { useAddBenchmarkScenario } from "../integrations/supabase";
import { toast } from "sonner";

const useCreateScenarioForm = () => {
  const navigate = useNavigate();
  const { session } = useSupabaseAuth();
  const addBenchmarkScenario = useAddBenchmarkScenario();

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

  const [selectedReviewers, setSelectedReviewers] = useState([]);

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

  const handleReviewerSelection = (reviewerId, isSelected) => {
    setSelectedReviewers(prev => 
      isSelected 
        ? [...prev, reviewerId]
        : prev.filter(id => id !== reviewerId)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      toast.error("You must be logged in to create a scenario");
      return;
    }

    try {
      console.log("Attempting to create scenario:", scenario);
      const result = await addBenchmarkScenario.mutateAsync({ ...scenario, reviewers: selectedReviewers });
      console.log("Scenario creation response:", result);
      
      if (result.error) {
        throw new Error("Failed to create scenario: " + result.error.message);
      }
      
      const createdScenarioId = result.data?.id || result.id;
      if (!createdScenarioId) {
        throw new Error("Failed to create scenario: No ID returned");
      }
      
      console.log("Created scenario ID:", createdScenarioId);

      // Clear the draft from localStorage
      localStorage.removeItem('draftScenario');

      toast.success("Scenario created successfully");
      navigate("/");
    } catch (error) {
      console.error("Error creating scenario:", error);
      toast.error(`Failed to create scenario: ${error.message}`);
    }
  };

  return {
    scenario,
    handleScenarioChange,
    handleLLMTemperatureChange,
    handleSubmit,
    setScenario,
    selectedReviewers,
    setSelectedReviewers,
    handleReviewerSelection,
  };
};

export default useCreateScenarioForm;