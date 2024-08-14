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

      const systemPrompt = `You are an AI assistant helping to generate content for benchmark scenarios. Your task is to generate either a name, description, or prompt based on the given instruction. Use the following examples as a reference for the style and content:

${examples.map(s => `Name: ${s.name}
Description: ${s.description}
Prompt: ${s.prompt}`).join('\n\n')}

Provide only the requested content without any additional text or explanations.`;

      let prompt = '';
      switch (type) {
        case 'scenario_name':
          prompt = 'Generate a name for a new benchmark scenario.';
          break;
        case 'scenario_description':
          prompt = `Generate a description for a benchmark scenario named "${name}".`;
          break;
        case 'scenario_prompt':
          prompt = `Generate a prompt for a benchmark scenario named "${name}" with the following description: "${description}".`;
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