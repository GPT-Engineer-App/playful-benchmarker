import { supabase } from '../integrations/supabase';

export const useUpdateRunState = (updateRun) => {
  return async (availableRun) => {
    console.log('Checking run state');
    const { data: runData } = await supabase
      .from('runs')
      .select('state, benchmark_scenarios!inner(timeout)')
      .eq('id', availableRun.id)
      .single();

    if (runData.state === 'timed_out') {
      console.log('Run has timed out');
    } else if (runData.state === 'impersonator_failed') {
      console.log('Impersonator failed, not updating state');
    } else {
      const elapsedTime = Date.now() - new Date(availableRun.created_at).getTime();
      if (elapsedTime > runData.benchmark_scenarios.timeout * 1000) {
        console.log('Run has exceeded timeout, updating state to timed_out');
        await updateRun.mutateAsync({
          id: availableRun.id,
          state: 'timed_out',
        });
      } else {
        console.log('Updating state to paused');
        await updateRun.mutateAsync({
          id: availableRun.id,
          state: 'paused',
        });
      }
    }
  };
};