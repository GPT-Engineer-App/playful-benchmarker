import { callOpenAILLM } from './anthropic';
import { supabase } from '../integrations/supabase';

// Function to retrieve user secrets
const getUserSecrets = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated');
  }

  const { data: secrets, error } = await supabase
    .from('user_secrets')
    .select('secret')
    .eq('user_id', session.user.id)
    .single();

  if (error) {
    throw new Error('Failed to retrieve user secrets');
  }

  return JSON.parse(secrets.secret);
};

// Function to create a new project
const createProject = async (description, systemVersion) => {
  const secrets = await getUserSecrets();
  const gptEngineerTestToken = secrets.GPT_ENGINEER_TEST_TOKEN;

  const response = await fetch(`${systemVersion}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${gptEngineerTestToken}`,
    },
    body: JSON.stringify({ description, mode: 'instant' }),
  });
  if (!response.ok) {
    throw new Error('Failed to create project');
  }
  return response.json();
};

// Function to send a chat message to a project
export const sendChatMessage = async (projectId, message, systemVersion) => {
  const secrets = await getUserSecrets();
  const gptEngineerTestToken = secrets.GPT_ENGINEER_TEST_TOKEN;

  const response = await fetch(`${systemVersion}/projects/${projectId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${gptEngineerTestToken}`,
    },
    body: JSON.stringify({ message, images: [], mode: 'instant' }),
  });
  if (!response.ok) {
    throw new Error('Failed to send chat message');
  }
  return response.json();
};

// Function to handle initial user impersonation and project creation
export const impersonateUser = async (prompt, systemVersion, temperature) => {
  try {
    const systemMessage = {
      role: "system",
      content: `You are an AI assistant impersonating a user interacting with a GPT Engineer system. When you want to send a request to the system, use the <lov-chat-request> XML tag. When you have no more requests and the scenario is finished, use the <lov-scenario-finished/> tag. Here are examples:

<lov-chat-request>
Create a todo app
</lov-chat-request>

When the scenario is complete:
<lov-scenario-finished/>`
    };

    const userMessage = {
      role: "user",
      content: "Now, based on the following prompt, generate appropriate requests to the GPT Engineer system:\n\n" + prompt
    };

    const messages = [systemMessage, userMessage];

    // Create a new project
    const chatRequest = await callOpenAILLM(messages, 'gpt-4o', temperature);
    const project = await createProject(chatRequest, systemVersion);

    // Add the OpenAI response as an assistant message
    messages.push({
      role: "assistant",
      content: chatRequest
    });

    return { projectId: project.id, initialRequest: chatRequest, messages };
  } catch (error) {
    console.error('Error in initial user impersonation:', error);
    throw error;
  }
};
