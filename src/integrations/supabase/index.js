// ... (keep existing imports and code)

// Add these new functions to the existing file

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
    mutationFn: async ({ scenario_id, reviewer }) => {
      if (reviewer.id) {
        // If reviewer already exists, just link it to the scenario
        return fromSupabase(supabase.from('scenario_reviewers').insert({ scenario_id, reviewer_id: reviewer.id }));
      } else {
        // If it's a new reviewer, create it first and then link
        const { data: newReviewer, error: reviewerError } = await supabase.from('reviewers').insert(reviewer).select().single();
        if (reviewerError) throw reviewerError;
        return fromSupabase(supabase.from('scenario_reviewers').insert({ scenario_id, reviewer_id: newReviewer.id }));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['scenario_reviewers', variables.scenario_id]);
    },
  });
};

export const useDeleteScenarioReviewer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scenario_id, reviewer_ids }) => fromSupabase(
      supabase.from('scenario_reviewers')
        .delete()
        .eq('scenario_id', scenario_id)
        .not('reviewer_id', 'in', `(${reviewer_ids.join(',')})`)
    ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['scenario_reviewers', variables.scenario_id]);
    },
  });
};

// ... (keep the rest of the existing code)