import { generateHtmlOnChatResponse } from './generateHtmlOnChatResponse.js';
import { getOpenAiApiKey, getGeminiApiKey } from './getApiKey.js';
import { setStatusIndicator } from './setStatusIndicator.js';
import { generateHtmlOnButtonClick } from './generateHtmlOnButtonClick.js';
import { chatIntegration } from './chatProvider.js';

const requestApiKey = async (apiKeyName, localStorageKey) => {
  const currentApiKey = localStorage.getItem(localStorageKey) ?? '';
  const apiKey = prompt(`Please enter your ${apiKeyName} API key to use GenUIChat:`, currentApiKey);
  if (apiKey) {
    localStorage.setItem(localStorageKey, apiKey);
  } else {
    alert(`${apiKeyName} API key is required for GenUIChat to function`);
  }
};

const requestAllApiKeysFromUser = async () => {
  await requestApiKey('OpenAI', 'genuichat-openai-api-key');
  await requestApiKey('Gemini', 'genuichat-gemini-api-key');
};

const requestMissingApiKeysFromUser = async () => {
  try {
    getOpenAiApiKey();
  } catch (error) {
    await requestApiKey('OpenAI', 'genuichat-openai-api-key');
  }

  try {
    getGeminiApiKey();
  } catch (error) {
    await requestApiKey('Gemini', 'genuichat-gemini-api-key');
  }
};

const setupLayout = () => {
  const genuiContainerElement = document.createElement('div');
  genuiContainerElement.id = 'genui-container';
  
  const iframeElement = document.createElement('iframe');
  iframeElement.id = 'genui-iframe';
  
  const statusBarElement = document.createElement('div');
  statusBarElement.id = 'genui-status-bar';

  const statusBarTextElement = document.createElement('p');
  statusBarTextElement.id = 'genui-status-bar-text';
  statusBarElement.appendChild(statusBarTextElement);

  const settingsButtonElement = document.createElement('button');
  settingsButtonElement.id = 'genui-status-bar-settings-button';
  settingsButtonElement.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>
  `;
  statusBarElement.appendChild(settingsButtonElement);

  genuiContainerElement.appendChild(iframeElement);
  genuiContainerElement.appendChild(statusBarElement);
  document.body.appendChild(genuiContainerElement);

  const rootDivs = document.body.querySelectorAll('body > div');
  rootDivs.forEach(div => {
    div.style.maxWidth = '50%';
  });

  return { genuiContainerElement, iframeElement, statusBarElement, statusBarTextElement, settingsButtonElement };
};

const onLatestChatResponseCompletedOrLoaded = async (iframeElement, statusBarTextElement, state) => {
  await generateHtmlOnChatResponse(iframeElement, statusBarTextElement, state, chatIntegration);
};

const registerOnLatestChatResponseCompletedOrLoaded = (iframeElement, statusBarTextElement, state) => {
  chatIntegration.registerOnLatestChatResponseCompletedOrLoaded(iframeElement, statusBarTextElement, state, onLatestChatResponseCompletedOrLoaded);
};

const handleIframeButtonClick = async (iframeElement, statusBarTextElement, state, event) => {
  state.isIframeButtonClickEnabled = false;
  
  const clickedButtonElement = iframeElement.contentDocument.getElementById(event.data.buttonId);
  if (clickedButtonElement) clickedButtonElement.textContent = 'Loading...';
  
  const domHtml = iframeElement.contentDocument.documentElement.outerHTML;
  const html = await generateHtmlOnButtonClick(iframeElement, statusBarTextElement, state, event.data.buttonId, event.data.buttonText, domHtml);
};

const registerOnWindowMessage = (iframeElement, statusBarTextElement, state) => {
  window.addEventListener('message', async (event) => {
    if (event.data.type === 'button-click' && state.isIframeButtonClickEnabled) {
      await handleIframeButtonClick(iframeElement, statusBarTextElement, state, event);
    }
  })
}

const waitUntilChatHistoryIsLoaded = async () => {
  await chatIntegration.waitUntilChatHistoryIsLoaded();
}

const onSettingsButtonClick = () => {
  requestAllApiKeysFromUser();
}

const registerOnSettingsButtonClick = (settingsButtonElement) => {
  settingsButtonElement.addEventListener('click', onSettingsButtonClick);
}

const initGenUIChat = async () => {
  const {
    genuiContainerElement,
    iframeElement,
    statusBarElement,
    statusBarTextElement,
    settingsButtonElement
  } = setupLayout();

  const state = {
    isIframeButtonClickEnabled: true
  }

  registerOnSettingsButtonClick(settingsButtonElement);
  registerOnWindowMessage(iframeElement, statusBarTextElement, state);

  await requestMissingApiKeysFromUser();

  setStatusIndicator(statusBarTextElement, 'Waiting for chat history...');
  await waitUntilChatHistoryIsLoaded();
  await generateHtmlOnChatResponse(iframeElement, statusBarTextElement, state, chatIntegration);
  registerOnLatestChatResponseCompletedOrLoaded(iframeElement, statusBarTextElement, state);
};

export const main = () => {
  initGenUIChat();
};
