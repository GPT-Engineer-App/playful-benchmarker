// Add this import at the top of the file
import { callSupabaseLLM } from '../../lib/anthropic';

// Add this function to the existing exports
export const useGenerateText = () => {
  return useMutation({
    mutationFn: async ({ prompt }) => {
      const generatedText = await callSupabaseLLM(prompt, [], 0.7);
      return generatedText;
    },
  });
};