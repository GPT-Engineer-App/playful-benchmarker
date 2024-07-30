import { useState, useCallback, useEffect } from 'react';
import { supabase, useUpdateRun, useAddResult, useAddRun } from '../integrations/supabase';
import { toast } from 'sonner';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { callOpenAILLM } from '../lib/anthropic';
import { sendChatMessage, impersonateUser } from '../lib/userImpersonation';

const useBenchmarkRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const updateRun = useUpdateRun();
  const addResult = useAddResult();
  const addRun = useAddRun();

  const handleSingleIteration = useCallback(async (gptEngineerTestToken, systemVersion) => {
    // ... (keep the existing handleSingleIteration logic)
  }, [updateRun, addResult]);

  const startRunner = useCallback(async (selectedScenarios, systemVersion) => {
    try {
      // Create run entries for each selected scenario
      for (const scenarioId of selectedScenarios) {
        await addRun.mutateAsync({
          scenario_id: scenarioId,
          system_version: systemVersion,
          state: 'paused',
          user_id: supabase.auth.user().id,
        });
      }

      setIsRunning(true);
    } catch (error) {
      console.error("Error creating run entries:", error);
      throw error;
    }
  }, [addRun]);

  const stopRunner = useCallback(() => {
    setIsRunning(false);
  }, []);

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(async () => {
        // ... (keep the existing interval logic)
      }, 5000); // Run every 5 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, handleSingleIteration]);

  return { isRunning, startRunner, stopRunner };
};

export default useBenchmarkRunner;
