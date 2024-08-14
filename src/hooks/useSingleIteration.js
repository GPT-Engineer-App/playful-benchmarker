import { supabase } from '../integrations/supabase';
import { toast } from "sonner";
import { useUserSecrets } from './useUserSecrets';
import { useStartPausedRun } from './useStartPausedRun';
import { useHandleIteration } from './useHandleIteration';
import { useUpdateRunState } from './useUpdateRunState';

export const useSingleIteration = (updateRun) => {
  const { fetchUserSecrets } = useUserSecrets();
  const startPausedRun = useStartPausedRun();
  const handleIteration = useHandleIteration(updateRun);
  const updateRunState = useUpdateRunState(updateRun);

  const handleSingleIteration = async () => {
    console.log('Starting single iteration');
    const { data: runs, error: runsError } = await supabase
      .from('runs')
      .select('*')
      .eq('state', 'paused')
      .order('created_at', { ascending: true })
      .limit(1);

    if (runsError) {
      console.error("Error fetching runs:", runsError);
      return;
    }

    if (!runs || runs.length === 0) {
      console.log("No paused runs available");
      return;
    }

    const availableRun = runs[0];
    console.log('Available run:', availableRun);

    const gptEngineerTestToken = await fetchUserSecrets();
    if (!gptEngineerTestToken) {
      console.error("No GPT Engineer test token available");
      return;
    }

    const runStarted = await startPausedRun(availableRun.id);
    if (!runStarted) {
      console.log("Failed to start run (it may no longer be in 'paused' state):", availableRun.id);
      return;
    }
    console.log('Run started successfully');

    try {
      await handleIteration(availableRun, gptEngineerTestToken);
      console.log('Iteration completed successfully');
      toast.success("Iteration completed successfully");
    } catch (error) {
      console.error("Error during iteration:", error);
      toast.error(`Iteration failed: ${error.message}`);
      await updateRun.mutateAsync({
        id: availableRun.id,
        state: 'impersonator_failed',
      });
    }

    await updateRunState(availableRun);
  };

  return { handleSingleIteration };
};