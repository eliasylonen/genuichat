import { cleanHtml } from './utils/cleanHtml.js';
import { loadHtml } from './loadHtml.js';
import { generateChatCompletion } from './generateChatCompletion.js';
import { setStatusIndicator } from './setStatusIndicator.js';

const extractRelevantInformation = async (chatProvider) => {
  const prompt = `Extract most relevant information from the following HTML.
Shorten the text significantly, but keep tables and other data original.
Respond in Markdown.

HTML:

${chatProvider.getLastMessageHTML()}`;

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

const generateStyledHtml = async (rawHtml) => {
  const prompt = `Add sleek, minimalist, Stripe and Linear-inspired CSS styling to the following HTML.
Reply only with HTML and CSS, nothing else.

HTML:

${rawHtml}`;

  const rawStyledHtml = await generateChatCompletion(prompt);
  const styledHtml = cleanHtml(rawStyledHtml);
  return styledHtml;
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

  setStatusIndicator(statusBar, 'Generating styles...');
  const styledHtml = await generateStyledHtml(improvedHtml);
  await loadHtml(iframe, styledHtml);

  setStatusIndicator(statusBar, 'Ready');
};

export { generateHtmlOnChatResponse }; 
