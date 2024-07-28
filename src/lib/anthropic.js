import { supabase } from '../integrations/supabase';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

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

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error calling Anthropic LLM:', error);
    throw error;
  }
}