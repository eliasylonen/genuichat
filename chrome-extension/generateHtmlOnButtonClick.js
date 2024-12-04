import { cleanHtml } from './utils/cleanHtml.js';
import { loadHtml } from './loadHtml.js';
import { generateChatCompletion } from './generateChatCompletion.js';
import { setStatusIndicator } from './setStatusIndicator.js';

const updateHtmlBasedOnButtonClick = async (buttonId, buttonText, domHtml) => {  const rawUpdatedHtml = await generateChatCompletion(`Generate HTML of the page after "${buttonText}" button click.
  Respond only with HTML, nothing else.
  The user clicked button with id "${buttonId}" in the following DOM.
  
  DOM:
  
  ${domHtml}`);
  return cleanHtml(rawUpdatedHtml);
};

export const generateHtmlOnButtonClick = async (iframe, statusBar, buttonId, buttonText, domHtml) => {
  setStatusIndicator(statusBar, 'Generating initial HTML...');
  const updatedHtml = await updateHtmlBasedOnButtonClick(buttonId, buttonText, domHtml);
  await loadHtml(iframe, updatedHtml);
  setStatusIndicator(statusBar, 'Ready');
};
