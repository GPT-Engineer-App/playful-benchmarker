import { supabase } from '../integrations/supabase';
import Anthropic from '@anthropic-ai/sdk';

export async function callAnthropicLLM(prompt, model = 'claude-3-opus-20240229') {
  try {
    // Fetch the user's secrets from Supabase
    const { data: userSecrets, error: secretsError } = await supabase
      .from('user_secrets')
      .select('secret')
      .single();

    if (secretsError) {
      throw new Error('Failed to fetch user secrets');
    }

    const secrets = JSON.parse(userSecrets.secret);
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
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract and return the assistant's response
    return response.content[0].text;
  } catch (error) {
    console.error('Error calling Anthropic LLM:', error);
    throw error;
  }
}