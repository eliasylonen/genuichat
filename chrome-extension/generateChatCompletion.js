import { getOpenAiApiKey, getGeminiApiKey } from './getApiKey.js';

const generateChatCompletionOpenAi = async (prompt) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getOpenAiApiKey()}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }
  
  const { choices } = await response.json();
  const { content } = choices[0].message;

  return content;
};

const generateChatCompletionGemini = async (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${getGeminiApiKey()}`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;

  return content;
};

export const generateChatCompletion = async (state, prompt) => {
  if (state.isGeneratingHtml) throw new MultipleInFlightGenerationsError();
  state.isGeneratingHtml = true;
  const content = await generateChatCompletionGemini(prompt);
  state.isGeneratingHtml = false;
  return content;
};
