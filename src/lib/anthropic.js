import Anthropic from '@anthropic-ai/sdk';

export async function callAnthropicLLM(prompt, apiKey, model = 'claude-3-opus-20240229') {
  try {
    if (!apiKey) {
      throw new Error('Anthropic API key not provided');
    }

    // Initialize the Anthropic client with the provided API key
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