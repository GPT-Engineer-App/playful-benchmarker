import { supabase } from '../integrations/supabase';
import { toast } from "sonner";
import { useUserSecrets } from './useUserSecrets';
import { useStartPausedRun } from './useStartPausedRun';
import { useHandleIteration } from './useHandleIteration';
import { useUpdateRunState } from './useUpdateRunState';
import { callSupabaseLLM } from '../lib/anthropic';
import { reviewerPrompt } from '../lib/systemPrompts';

export const useSingleIteration = (updateRun) => {
  const { fetchUserSecrets } = useUserSecrets();
  const startPausedRun = useStartPausedRun();
  const handleIteration = useHandleIteration(updateRun);
  const updateRunState = useUpdateRunState(updateRun);

  const runReviewers = async (runId, reviewers) => {
    for (const reviewer of reviewers) {
      const { data: messages } = await supabase
        .from('trajectory_messages')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: true });

      const reviewerResult = await callSupabaseLLM(
        reviewerPrompt,
        reviewer.prompt,
        messages.map(msg => ({
          role: msg.role === 'impersonator' ? 'assistant' : 'user',
          content: msg.content
        })),
        reviewer.llm_temperature
      );

      const scoreMatch = reviewerResult.match(/<lov-score>(.*?)<\/lov-score>/);
      if (scoreMatch) {
        const score = parseFloat(scoreMatch[1]);
        await supabase.from('results').insert({
          run_id: runId,
          reviewer_id: reviewer.id,
          score: score
        });
      } else {
        console.error(`Reviewer ${reviewer.id} did not provide a valid score`);
      }
    }
  };

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

      // Check if the run is completed
      const { data: updatedRun } = await supabase
        .from('runs')
        .select('*')
        .eq('id', availableRun.id)
        .single();

      if (updatedRun.state === 'completed') {
        console.log('Run completed, starting reviewers');
        const { data: reviewers } = await supabase
          .from('scenario_reviewers')
          .select('reviewers (*)')
          .eq('scenario_id', updatedRun.scenario_id);

        await runReviewers(availableRun.id, reviewers.map(r => r.reviewers));
        console.log('Reviewers completed');
      }
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