import { cleanHtml } from './utils/cleanHtml.js';
import { loadHtml } from './loadHtml.js';
import { generateChatCompletion } from './generateChatCompletion.js';
import { setStatusIndicator } from './setStatusIndicator.js';

const extractRelevantInformation = async (chatProvider) => {
  console.log('Extracting relevant information from last chat response');

  const prompt = `Extract most relevant information from the following HTML.
Shorten the text significantly, but keep tables and other data original.
Respond in Markdown.

HTML:

${chatProvider.getLastMessageHTML()}`;

  const relevantInformationMarkdown = await generateChatCompletion(prompt);
  console.log('Extracted relevant information:', relevantInformationMarkdown);
  return relevantInformationMarkdown;
}

const generateInitialHtml = async (relevantInformationMarkdown) => {
  console.log('Generating initial HTML');
  const prompt = `Generate HTML (no CSS) that displays relevant information in the Message on an HTML page.
Use tables, charts, and other visual elements if relevant to make data easy to understand.
Add useful buttons depending on the context.
All buttons must have unique ids. 

Reply only with HTML, nothing else.

Message:

${relevantInformationMarkdown}`;

  const rawGeneratedHtml = await generateChatCompletion(prompt);
  console.log('Generated initial HTML');
  const generatedHtml = cleanHtml(rawGeneratedHtml);
  return generatedHtml;
}

const addHelpfulButtons = async (rawHtml) => {
  console.log('Adding helpful buttons');
  const prompt = `Add helpful buttons relevant parts of the page itself.
Do not implement button click handlers.
Respond with the updated HTML and nothing else.
All buttons must have unique ids.

Reply only with HTML, nothing else.

HTML:

${rawHtml}`;

  const rawImprovedHtml = await generateChatCompletion(prompt);
  console.log('Added helpful buttons');
  const improvedHtml = cleanHtml(rawImprovedHtml);
  return improvedHtml;
}

const generateHtmlOnChatResponse = async (iframe, chatProvider, statusBar) => {
  setStatusIndicator(statusBar, 'Extracting relevant information...');
  const relevantInformationMarkdown = await extractRelevantInformation(chatProvider);
  
  await loadHtml(iframe, relevantInformationMarkdown)
  
  setStatusIndicator(statusBar, 'Generating initial HTML...');
  const generatedHtml = await generateInitialHtml(relevantInformationMarkdown);
  await loadHtml(iframe, generatedHtml);
  
  setStatusIndicator(statusBar, 'Adding interactive elements...');
  const improvedHtml = await addHelpfulButtons(generatedHtml);
  await loadHtml(iframe, improvedHtml);
  
  setStatusIndicator(statusBar, 'Ready');
};

export { generateHtmlOnChatResponse }; 
