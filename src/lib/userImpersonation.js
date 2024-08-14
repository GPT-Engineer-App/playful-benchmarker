import { callSupabaseLLM } from './anthropic';
import { supabase } from '../integrations/supabase';

// Function to test the website using MultiOn through a proxy
export const testWebsite = async (projectId, testInstructions) => {
  try {
    const response = await fetch('https://jyltskwmiwqthebrpzxt.supabase.co/functions/v1/multion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bHRza3dtaXdxdGhlYnJwenh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIxNTA2NjIsImV4cCI6MjAzNzcyNjY2Mn0.a1y6NavG5JxoGJCNrAckAKMvUDaXAmd2Ny0vMvz-7Ng'
      },
      body: JSON.stringify({
        cmd: testInstructions,
        url: `https://lov-p-${projectId}.fly.dev/`,
        include_screenshot: true
      }),
    });

    if (!response.ok) {
      throw new Error(`MultiOn API request failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log('MultiOn API response:', result);
    return result; // Return the full result object, including the screenshot field
  } catch (error) {
    console.error('Error in testWebsite:', error);
    return { error: `Error testing website: ${error.message}` };
  }
};

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
const createProject = async (prompt, systemVersion) => {
  const secrets = await getUserSecrets();
  const gptEngineerTestToken = secrets.GPT_ENGINEER_TEST_TOKEN;

  const response = await fetch(`${systemVersion}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${gptEngineerTestToken}`,
    },
    body: JSON.stringify({ description: prompt, mode: 'instant' }),
  });
  if (!response.ok) {
    throw new Error('Failed to create project');
  }
  const data = await response.json();
  return { id: data.id, link: data.link };
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

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return result;
};

// Function to handle initial user impersonation and project creation
export const impersonateUser = async (prompt, systemVersion) => {
  try {
    // Create a new project
    const project = await createProject(prompt, systemVersion);

    return { projectId: project.id, projectLink: project.link };
  } catch (error) {
    console.error('Error in initial user impersonation:', error);
    throw error;
  }
};
