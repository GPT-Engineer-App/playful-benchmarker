// ... (keep existing imports and code)

// Add these new exports
export const useScenarioReviewers = (scenarioId) => useQuery({
  queryKey: ['scenario_reviewers', scenarioId],
  queryFn: () => fromSupabase(supabase
    .from('scenario_reviewers')
    .select(`
      reviewer_id,
      reviewers (*)
    `)
    .eq('scenario_id', scenarioId)),
  enabled: !!scenarioId,
});

export const useAddScenarioReviewer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newScenarioReviewer) => fromSupabase(supabase.from('scenario_reviewers').insert([newScenarioReviewer])),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['scenario_reviewers', variables.scenario_id]);
    },
  });
};

export const useDeleteScenarioReviewer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scenario_id, reviewer_id }) => fromSupabase(
      supabase.from('scenario_reviewers')
        .delete()
        .match({ scenario_id, reviewer_id })
    ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['scenario_reviewers', variables.scenario_id]);
    },
  });
};

// ... (keep the rest of the existing code)