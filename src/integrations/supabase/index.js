import { createClient } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

import React from "react";
export const queryClient = new QueryClient();
export function SupabaseProvider({ children }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
}

const fromSupabase = async (query) => {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
};

// ... (keep all existing code)

// Add this new hook
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

// ... (keep all existing code)