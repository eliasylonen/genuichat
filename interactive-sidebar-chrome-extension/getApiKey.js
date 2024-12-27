export const getOpenAiApiKey = () => {
  const openAiApiKey = localStorage.getItem('genuichat-openai-api-key');
  if (!openAiApiKey) throw new Error('Missing OpenAI API key');
  return openAiApiKey;
};

export const getGeminiApiKey = () => {
  const geminiApiKey = localStorage.getItem('genuichat-gemini-api-key');
  if (!geminiApiKey) throw new Error('Missing Gemini API key');
  return geminiApiKey;
};
