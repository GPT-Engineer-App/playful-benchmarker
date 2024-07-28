import { supabase } from '../integrations/supabase';

export async function callOpenAILLM(prompt, apiKey, model = 'gpt-4') {
  try {
    if (!apiKey) {
      throw new Error('OpenAI API key not provided');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${session.system_version}/openai/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are an AI assistant impersonating a user interacting with a GPT Engineer system. When you want to send a request to the system, use the <lov-chat-request> XML tag.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI LLM:', error);
    throw error;
  }
}