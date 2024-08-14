import { useState } from 'react';
import { useBenchmarkScenarios, useGenerateText } from '../integrations/supabase';
import { toast } from 'sonner';

const useAutoGenerate = (scenario, setScenario) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: scenarios } = useBenchmarkScenarios();
  const generateText = useGenerateText();

  const generateContent = async (type) => {
    setIsGenerating(true);
    try {
      let prompt = '';
      let existingScenarios = scenarios?.map(s => `Name: ${s.name}\nDescription: ${s.description}\nPrompt: ${s.prompt}`).join('\n\n') || '';

      switch (type) {
        case 'name':
          prompt = `Generate a unique and descriptive name for a new benchmark scenario. Here are some existing scenarios for reference:\n\n${existingScenarios}\n\nNew scenario name:`;
          break;
        case 'description':
          prompt = `Generate a brief description for a benchmark scenario named "${scenario.name}". The description should explain the purpose and key aspects of the scenario. Here are some existing scenarios for reference:\n\n${existingScenarios}\n\nDescription for "${scenario.name}":`;
          break;
        case 'prompt':
          prompt = `Generate a detailed prompt for a benchmark scenario named "${scenario.name}" with the following description: "${scenario.description}". The prompt should provide specific instructions for the AI to follow in implementing the scenario. Here are some existing scenarios for reference:\n\n${existingScenarios}\n\nPrompt for "${scenario.name}":`;
          break;
      }

      const generatedText = await generateText.mutateAsync({ prompt });
      setScenario(prev => ({ ...prev, [type]: generatedText }));
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} generated successfully`);
    } catch (error) {
      toast.error(`Failed to generate ${type}: ${error.message}`);
    }
    setIsGenerating(false);
  };

  const generateName = () => generateContent('name');
  const generateDescription = () => generateContent('description');
  const generatePrompt = () => generateContent('prompt');

  return { generateName, generateDescription, generatePrompt, isGenerating };
};

export default useAutoGenerate;