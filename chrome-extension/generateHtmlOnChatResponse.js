import { cleanHtml } from './utils/cleanHtml.js';
import { loadHtml } from './loadHtml.js';
import { generateChatCompletion } from './generateChatCompletion.js';
import { setStatusIndicator } from './setStatusIndicator.js';

const extractRelevantInformation = async (chatIntegration) => {
  const prompt = `Extract most relevant information from the following HTML.
Shorten the text significantly, but keep tables and other data original.
Respond in Markdown.

HTML:

${chatIntegration.getLastMessageHTML()}`;

  const relevantInformationMarkdown = await generateChatCompletion(prompt);
  return relevantInformationMarkdown;
}

const generateInitialHtml = async (relevantInformationMarkdown) => {
  const prompt = `Generate HTML (no CSS) that displays relevant information in the Message on an HTML page.
Use tables, charts, and other visual elements if relevant to make data easy to understand.
Add useful buttons depending on the context.
All buttons must have unique ids. 

Reply only with HTML, nothing else.

Message:

${relevantInformationMarkdown}`;

  const rawGeneratedHtml = await generateChatCompletion(prompt);
  const generatedHtml = cleanHtml(rawGeneratedHtml);
  return generatedHtml;
}

const addHelpfulButtons = async (rawHtml) => {
  const prompt = `Add helpful buttons relevant parts of the page itself.
Do not implement button click handlers.
Respond with the updated HTML and nothing else.
All buttons must have unique ids.

Reply only with HTML, nothing else.

HTML:

${rawHtml}`;

  const rawImprovedHtml = await generateChatCompletion(prompt);
  const improvedHtml = cleanHtml(rawImprovedHtml);
  return improvedHtml;
}

const generateHtmlOnChatResponse = async (iframeElement, chatIntegration, statusBarTextElement) => {
  setStatusIndicator(statusBarTextElement, 'Extracting relevant information...');
  const relevantInformationMarkdown = await extractRelevantInformation(chatIntegration);

  await loadHtml(iframeElement, relevantInformationMarkdown)

  setStatusIndicator(statusBarTextElement, 'Generating initial HTML...');
  const generatedHtml = await generateInitialHtml(relevantInformationMarkdown);
  await loadHtml(iframeElement, generatedHtml);

  setStatusIndicator(statusBarTextElement, 'Adding interactive elements...');
  const improvedHtml = await addHelpfulButtons(generatedHtml);
  await loadHtml(iframeElement, improvedHtml);

  setStatusIndicator(statusBarTextElement, 'Ready');
};

export { generateHtmlOnChatResponse }; 
