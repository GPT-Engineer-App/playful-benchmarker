import { useState, useEffect, useCallback } from 'react';
import { supabase, useUpdateRun } from '../integrations/supabase';
import { toast } from 'sonner';
import { useUserSecrets } from './useUserSecrets';
import { useSingleIteration } from './useSingleIteration';

const useBenchmarkRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const updateRun = useUpdateRun();
  const { fetchUserSecrets } = useUserSecrets();
  const { handleSingleIteration } = useSingleIteration(updateRun);

  const resetLongRunningRuns = useCallback(async () => {
    try {
      await supabase.rpc('reset_long_running_runs');
      console.log('Reset long-running runs');
    } catch (error) {
      console.error('Error resetting long-running runs:', error);
    }
  }, []);

  useEffect(() => {
    const currentDomain = window.location.hostname;
    if (currentDomain !== 'preview--playful-benchmarker.gptengineer.run') {
      console.log('Benchmark runner is disabled on this domain:', currentDomain);
      return;
    }

    const runIteration = async () => {
      const gptEngineerTestToken = await fetchUserSecrets();
      if (gptEngineerTestToken) {
        await handleSingleIteration(gptEngineerTestToken);
      }
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
  }, [handleSingleIteration, resetLongRunningRuns, fetchUserSecrets]);

  return { isRunning };
};

export default useBenchmarkRunner;