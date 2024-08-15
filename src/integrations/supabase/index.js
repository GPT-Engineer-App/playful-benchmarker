// ... (keep existing imports and code)

// Update the useResults hook to fetch results for a specific run
export const useResults = (runId) => useQuery({
  queryKey: ['results', runId],
  queryFn: () => fromSupabase(supabase.from('results').select('*').eq('run_id', runId)),
  enabled: !!runId,
});

// ... (keep the rest of the file unchanged)