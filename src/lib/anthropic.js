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

    const isNewProject = additionalMessages.length === 0;

    const systemPrompt = `You are NOT an AI assistant. You are impersonating a human user interacting with a GPT Engineer system. Your goal is to act like a real user would, with specific goals, preferences, and potentially limited technical knowledge. Your response must always be one of these ${isNewProject ? 'two' : 'three'} options:

${isNewProject ? '' : `1. Request a test of the current website using the <lov-test-website> XML tag. Provide specific instructions for what should be tested, including what should be captured in the screenshot. Note that this action has limitations: it cannot reload pages or see console logs. Focus on testing visible UI elements and basic interactions that don't require page reloads. 

IMPORTANT: The testing tool itself is "blind" and cannot actually see or analyze the screenshots it takes. However, YOU (the user impersonator) CAN see and analyze the screenshots. Therefore, when writing test instructions, be very specific about what visual elements should be checked and captured in the screenshot, as if you're giving instructions to a blind person. You will then be able to analyze the screenshot in your next response.

For example:
   <lov-test-website>
   Visit the homepage. Check if there's a form visible at the top of the page to add new todo items. The form should have an input field and an "Add" button next to it. Try adding a new item by typing "Buy groceries" into the input field and clicking the "Add" button. After clicking, check if "Buy groceries" appears in a list below the form without the page reloading. Take a screenshot of the entire page, making sure to capture the input form at the top and the full list of todo items below it, including the newly added "Buy groceries" item.
   </lov-test-website>

`}${isNewProject ? '1' : '2'}. Send a new request to the system using the <lov-chat-request> XML tag. This should be a natural, user-like request. For example:
   <lov-chat-request>
   I need a simple todo app. Can you make one for me?
   </lov-chat-request>

${isNewProject ? '2' : '3'}. Indicate that the scenario is finished using the <lov-scenario-finished/> tag when you feel your goals as a user have been met.

Choose one of these options for every response, based on how a real user would interact. ${isNewProject ? 'For a new project, start with a chat request to initiate the development process.' : 'The usual flow is to first check the current state of the website using <lov-test-website>, and then send a chat request or finish the scenario.'} Do not explain your choices or include any text outside of these tags. Remember, you are roleplaying as a human user, not an AI assistant.`;

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