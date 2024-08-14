import { supabase } from '../integrations/supabase/index.js';

export async function callSupabaseLLM(systemPrompt, basePrompt, additionalMessages = [], temperature = 0.7) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    if (!basePrompt) {
      throw new Error('Base prompt is undefined or empty');
    }

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: basePrompt
      },
      ...additionalMessages
    ];

    // Log the LLM request
    console.log('LLM Request:', JSON.stringify({ messages, temperature }, null, 2));

    // Validate messages
    const validMessages = messages.every(msg => msg.role && msg.content);
    if (!validMessages) {
      throw new Error('Invalid message format: All messages must have role and content fields');
    }

    // Assert that the last message has role "user"
    if (messages[messages.length - 1].role !== "user") {
      throw new Error('The last message must have a role of "user"');
    }

    const response = await fetch('https://jyltskwmiwqthebrpzxt.supabase.co/functions/v1/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bHRza3dtaXdxdGhlYnJwenh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIxNTA2NjIsImV4cCI6MjAzNzcyNjY2Mn0.a1y6NavG5JxoGJCNrAckAKMvUDaXAmd2Ny0vMvz-7Ng'
      },
      body: JSON.stringify({ messages, temperature })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LLM call failed. Status: ${response.status}, Error: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('LLM Response:', JSON.stringify(data, null, 2));

    // Extract the content from the response
    if (!data || !data.content || !Array.isArray(data.content) || data.content.length === 0) {
      console.error('Unexpected response structure from Supabase LLM:', data);
      throw new Error('Unexpected response structure from Supabase LLM');
    }

    const content = data.content[0]?.text;
    if (typeof content !== 'string') {
      console.error('Unexpected content type in Supabase LLM response:', data.content[0]);
      throw new Error('Unexpected content type in Supabase LLM response');
    }

    return content;
  } catch (error) {
    console.error('Error calling Supabase LLM:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    throw error;
  }
}