// ... (existing imports and code)

export const useRunReviewers = (runId) => useQuery({
    queryKey: ['run_reviewers', runId],
    queryFn: async () => {
        const { data: results } = await supabase
            .from('results')
            .select('reviewer_id')
            .eq('run_id', runId);
        
        const reviewerIds = [...new Set(results.map(r => r.reviewer_id))];
        
        const { data: reviewers } = await supabase
            .from('reviewers')
            .select('*')
            .in('id', reviewerIds);
        
        return reviewers;
    },
    enabled: !!runId,
});

// ... (rest of the file)