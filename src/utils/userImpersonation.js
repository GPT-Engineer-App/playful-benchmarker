import { callOpenAILLM } from '../lib/anthropic';

export const impersonateUser = async (prompt, systemVersion, temperature, gptEngineerTestToken) => {
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
    const projectResponse = await fetch(`${systemVersion}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${gptEngineerTestToken}`,
      },
      body: JSON.stringify({ description: chatRequest, mode: 'instant' }),
    });

    if (!projectResponse.ok) {
      throw new Error('Failed to create project');
    }

    const project = await projectResponse.json();

    // Get the project link
    const projectDetailsResponse = await fetch(`${systemVersion}/projects/${project.id}`, {
      headers: {
        'Authorization': `Bearer ${gptEngineerTestToken}`,
      },
    });
    
    if (!projectDetailsResponse.ok) {
      throw new Error(`Failed to fetch project details: ${projectDetailsResponse.statusText}`);
    }
    
    const projectData = await projectDetailsResponse.json();
    const projectLink = projectData.link;

    return { projectId: project.id, initialRequest: chatRequest, messages, projectLink };
  } catch (error) {
    console.error('Error in initial user impersonation:', error);
    throw error;
  }
};