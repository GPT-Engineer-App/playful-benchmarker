import { callAnthropicLLM } from './anthropic';

// Function to parse LLM response and extract special XML tags
const parseLLMResponse = (response) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(response, "text/xml");
  const chatRequests = xmlDoc.getElementsByTagName('lov-chat-request');
  return Array.from(chatRequests).map(node => node.textContent.trim());
};

// Function to create a new project
const createProject = async (description) => {
  const response = await fetch('http://localhost:8000/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description, mode: 'instant' }),
  });
  if (!response.ok) {
    throw new Error('Failed to create project');
  }
  return response.json();
};

// Function to send a chat message to a project
const sendChatMessage = async (projectId, message) => {
  const response = await fetch(`http://localhost:8000/projects/${projectId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, images: [], mode: 'instant' }),
  });
  if (!response.ok) {
    throw new Error('Failed to send chat message');
  }
  return response.json();
};

// Main function to handle user impersonation
export const impersonateUser = async (prompt) => {
  try {
    const llmResponse = await callAnthropicLLM(prompt);
    const chatRequests = parseLLMResponse(llmResponse);
    
    let projectId = null;
    const results = [];

    for (let i = 0; i < chatRequests.length; i++) {
      const request = chatRequests[i];
      
      if (i === 0) {
        // For the first request, create a new project
        const project = await createProject(request);
        projectId = project.id;
        results.push({ type: 'project_created', data: project });
      }
      
      // Send chat message for all requests
      const chatResponse = await sendChatMessage(projectId, request);
      results.push({ type: 'chat_message_sent', data: chatResponse });
    }

    return results;
  } catch (error) {
    console.error('Error in user impersonation:', error);
    throw error;
  }
};