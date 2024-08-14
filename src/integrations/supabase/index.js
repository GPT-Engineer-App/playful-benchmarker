import { createClient } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Create and export the Supabase client
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_PROJECT_URL,
  import.meta.env.VITE_SUPABASE_API_KEY
);

// Add this function to the existing exports
export const useGenerateText = () => {
  return useMutation({
    mutationFn: async ({ prompt }) => {
      // Implement the text generation logic here
      // For now, we'll return a placeholder
      return `Generated text for prompt: ${prompt}`;
    },
  });
};

// Add other Supabase-related hooks and functions here
// For example:
export const useBenchmarkScenarios = () => {
  return useQuery(['benchmarkScenarios'], async () => {
    const { data, error } = await supabase
      .from('benchmark_scenarios')
      .select('*');
    if (error) throw error;
    return data;
  });
};

// Add more hooks as needed