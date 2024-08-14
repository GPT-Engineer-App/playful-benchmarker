import { useState } from 'react';
import { useBenchmarkScenarios } from '../integrations/supabase';
import { callSupabaseLLM } from '../lib/anthropic';

export const useGenerateText = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: scenarios } = useBenchmarkScenarios();

  const generateText = async (type, name = '', description = '') => {
    setIsGenerating(true);
    try {
      const examples = scenarios?.slice(0, 5).map(s => ({
        name: s.name,
        description: s.description,
        prompt: s.prompt
      })) || [];

      let systemPrompt = 'You are an AI assistant helping to generate content for benchmark scenarios. Provide concise and relevant responses based on the given examples and instructions.';
      let prompt = '';
      switch (type) {
        case 'scenario_name':
          prompt = `Generate a name for a new benchmark scenario. Here are some examples:\n${examples.map(s => `- ${s.name}`).join('\n')}\nNew scenario name:`;
          break;
        case 'scenario_description':
          prompt = `Generate a description for a benchmark scenario named "${name}". Here are some examples:\n${examples.map(s => `Name: ${s.name}\nDescription: ${s.description}`).join('\n\n')}\nDescription for "${name}":`;
          break;
        case 'scenario_prompt':
          prompt = `Generate a prompt for a benchmark scenario named "${name}" with the following description: "${description}". Here are some examples:\n${examples.map(s => `Name: ${s.name}\nDescription: ${s.description}\nPrompt: ${s.prompt}`).join('\n\n')}\nPrompt for "${name}":`;
          break;
        default:
          throw new Error('Invalid generation type');
      }

      const generatedText = await callSupabaseLLM(systemPrompt, prompt);
      return generatedText.trim();
    } catch (error) {
      console.error('Error generating text:', error);
      return '';
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateText, isGenerating };
};