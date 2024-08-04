import { supabase } from '../integrations/supabase';

export async function callSupabaseLLM(basePrompt, additionalMessages = [], temperature = 0.7) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const messages = [
      {
        role: "system",
        content: `You are an AI assistant impersonating a user interacting with a GPT Engineer system. When you want to send a request to the system, use the <lov-chat-request> XML tag. When you have no more requests and the scenario is finished, use the <lov-scenario-finished/> tag. Here are examples:

<lov-chat-request>
Create a todo app
</lov-chat-request>

When the scenario is complete:
<lov-scenario-finished/>`
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
    const content = data.content[0].text;

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
