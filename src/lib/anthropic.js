import { supabase } from '../integrations/supabase';

export async function callSupabaseLLM(messages, temperature = 0.7) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Log the LLM request
    console.log('LLM Request:', JSON.stringify({ messages, temperature }, null, 2));

    const response = await fetch('https://jyltskwmiwqthebrpzxt.supabase.co/functions/v1/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bHRza3dtaXdxdGhlYnJwenh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIxNTA2NjIsImV4cCI6MjAzNzcyNjY2Mn0.a1y6NavG5JxoGJCNrAckAKMvUDaXAmd2Ny0vMvz-7Ng'
      },
      body: JSON.stringify({ messages, temperature })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Log the LLM response
    console.log('LLM Response:', JSON.stringify(data, null, 2));

    // Extract the content from the response
    const content = data.choices[0].message.content;

    // Parse the XML content to extract the chat request using regex
    const match = content.match(/<lov-chat-request>([\s\S]*?)<\/lov-chat-request>/);
    const chatRequest = match ? match[1].trim() : null;

    if (!chatRequest) {
      throw new Error('No valid chat request found in LLM response');
    }

    return chatRequest;
  } catch (error) {
    console.error('Error calling Supabase LLM:', error);
    throw error;
  }
}
