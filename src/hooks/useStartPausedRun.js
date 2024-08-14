import { supabase } from '../integrations/supabase';

export const useStartPausedRun = () => {
  return async (runId) => {
    console.log('Attempting to start paused run:', runId);
    const { data: runStarted, error: startError } = await supabase
      .rpc('start_paused_run', { run_id: runId });

    if (startError) {
      console.error("Error starting run:", startError);
      return false;
    }

    return runStarted;
  };
};