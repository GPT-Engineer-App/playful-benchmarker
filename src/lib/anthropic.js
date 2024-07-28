import { useUserSecrets } from '../integrations/supabase';
import Anthropic from '@anthropic-ai/sdk';

export async function callAnthropicLLM(prompt, model = 'claude-3-opus-20240229') {
  try {
    // Use the useUserSecrets hook to get the user's secrets
    const { data: userSecrets, error: secretsError } = useUserSecrets();

    if (secretsError) {
      throw new Error('Failed to fetch user secrets');
    }

    if (!userSecrets || userSecrets.length === 0) {
      throw new Error('No user secrets found');
    }

    const secrets = JSON.parse(userSecrets[0].secret);
    const apiKey = secrets.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('Anthropic API key not found');
    }

    // Initialize the Anthropic client with the user's API key
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Call the Anthropic API using the SDK
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: 'You are an AI assistant impersonating a user interacting with a GPT Engineer system. When you want to send a request to the system, use the <lov-chat-request> XML tag.' },
        { role: 'user', content: prompt }
      ],
    });

    // Extract and return the assistant's response
    return response.content[0].text;
  } catch (error) {
    console.error('Error calling Anthropic LLM:', error);
    throw error;
  }
}