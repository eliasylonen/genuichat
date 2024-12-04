export const getOpenAiApiKey = () => {
  const openAiApiKey = localStorage.getItem('genuichat-openai-api-key');
  if (!openAiApiKey) throw new Error('Missing OpenAI API key');
  return openAiApiKey;
};
