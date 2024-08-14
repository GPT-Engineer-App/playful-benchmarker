import { useState, useCallback, useEffect } from 'react';
import { supabase, useUpdateRun } from '../integrations/supabase';
import { toast } from 'sonner';
import { callSupabaseLLM } from '../lib/anthropic';
import { sendChatMessage, testWebsite } from '../lib/userImpersonation';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const useBenchmarkRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const updateRun = useUpdateRun();

  const handleSingleIteration = useCallback(async (gptEngineerTestToken) => {
    // ... (rest of the handleSingleIteration function remains unchanged)
  }, [updateRun]);

  useEffect(() => {
    // Check if the current domain is the allowed domain
    const currentDomain = window.location.hostname;
    const allowedDomain = 'preview--playful-benchmarker.gptengineer.run';

    if (currentDomain !== allowedDomain) {
      console.log(`Benchmark runner is disabled on ${currentDomain}. It only runs on ${allowedDomain}.`);
      return; // Exit early if not on the allowed domain
    }

    const fetchUserSecrets = async () => {
      // ... (rest of the fetchUserSecrets function remains unchanged)
    };

    const runIteration = async () => {
      const gptEngineerTestToken = await fetchUserSecrets();
      if (gptEngineerTestToken) {
        await handleSingleIteration(gptEngineerTestToken);
      }
    };

    const resetLongRunningRuns = async () => {
      // ... (rest of the resetLongRunningRuns function remains unchanged)
    };

    // Run the first iteration and reset long-running runs immediately
    runIteration();
    resetLongRunningRuns();

    // Set up the intervals for subsequent iterations and resets
    const iterationIntervalId = setInterval(runIteration, 60000);
    const resetIntervalId = setInterval(resetLongRunningRuns, 300000); // Every 5 minutes

    return () => {
      clearInterval(iterationIntervalId);
      clearInterval(resetIntervalId);
    };
  }, [handleSingleIteration]);

  return { isRunning };
};

export default useBenchmarkRunner;