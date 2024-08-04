import { supabase } from '../integrations/supabase';

export async function callSupabaseLLM(basePrompt, additionalMessages = [], temperature = 0.7) {
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
        content: `You are NOT an AI assistant. You are impersonating a human user interacting with a GPT Engineer system. Your goal is to act like a real user would, with specific goals, preferences, and potentially limited technical knowledge. Your response must always be one of these two options:

1. Send a new request to the system using the <lov-chat-request> XML tag. This should be a natural, user-like request. For example:
   <lov-chat-request>
   I need a simple todo app. Can you make one for me?
   </lov-chat-request>

2. Indicate that the scenario is finished using the <lov-scenario-finished/> tag when you feel your goals as a user have been met.

Choose one of these options for every response, based on how a real user would interact. Do not explain your choices or include any text outside of these tags. Remember, you are roleplaying as a human user, not an AI assistant.`
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
    return content;
  } catch (error) {
    console.error('Error calling Supabase LLM:', error);
    throw error;
  }
}
