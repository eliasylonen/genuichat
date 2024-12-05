import { generateHtmlOnChatResponse } from './generateHtmlOnChatResponse.js';
import { getOpenAiApiKey, getGeminiApiKey } from './getApiKey.js';
import { setStatusIndicator } from './setStatusIndicator.js';
import { generateHtmlOnButtonClick } from './generateHtmlOnButtonClick.js';

const chatGptProvider = {
  waitUntilChatHistoryIsLoaded: async () => new Promise((resolve) => {  
    const onMutation = (event) => {
      const isLoaded = !!document.querySelector('main article:last-of-type div[data-message-author-role="assistant"] > div > div');
      if (!isLoaded) return;
      mutationObserver.disconnect();
      resolve();
    };

    const mutationObserver = new MutationObserver(onMutation);
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }),
  registerOnLatestChatResponseCompletedOrLoaded: (onLatestChatResponseCompletedOrLoaded) => {
    let completedMessageIds = new Set();

    const getUniqueAcrossChatsLastMessageId = () => {
      const messageId = document.querySelector('main article:last-of-type').getAttribute('data-testid');
      const chatId = window.location.pathname.match(/\/c\/([0-9a-f-]+)/)?.[1];
      return `chat-${chatId}-message-${messageId}`;
    };

    const onMutation = (event) => {
      const isLastChatGptResponseCompleted = !!document.querySelector('main article:last-of-type [data-testid="copy-turn-action-button"]');
      if (!isLastChatGptResponseCompleted) return;
      const completedMessageId = getUniqueAcrossChatsLastMessageId();
      if (completedMessageIds.has(completedMessageId)) return;
      completedMessageIds = new Set([...completedMessageIds, completedMessageId]);
      onLatestChatResponseCompletedOrLoaded();
    };
  
    const mutationObserver = new MutationObserver(onMutation);

    const articleElement = document.querySelector('main article');
    const articlesContainer = articleElement?.parentElement;

    if (!articlesContainer) throw new Error('No articles container found');

    mutationObserver.observe(articlesContainer, { childList: true, subtree: true });
  },
  getLastMessageHTML: () => {
    const lastMessageElement = document.querySelector('main article:last-of-type div[data-message-author-role="assistant"] > div > div')
    if (!lastMessageElement) throw new Error('Last message not found');
    return lastMessageElement?.innerHTML;
  },
}

const chatProvider = (() => {
  switch (window.location.hostname) {
    case 'chatgpt.com':
      return chatGptProvider;
    default:
      throw new Error('Unsupported chat provider');
  }
})();

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
  iframeElement.id = 'genui-iframeElement';

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

const onLatestChatResponseCompletedOrLoaded = (iframeElement) => async () => {
  await generateHtmlOnChatResponse(iframeElement, chatProvider);
};

const registerOnLatestChatResponseCompletedOrLoaded = (iframeElement) => {
  chatProvider.registerOnLatestChatResponseCompletedOrLoaded(onLatestChatResponseCompletedOrLoaded(iframeElement));
};

const handleIframeButtonClick = (iframeElement, statusBarTextElement) => async (event) => {
  const domHtml = iframeElement.contentDocument.documentElement.outerHTML;
  const html = await generateHtmlOnButtonClick(iframeElement, statusBarTextElement, event.data.buttonId, event.data.buttonText, domHtml);
};

const onWindowMessage = (iframeElement, statusBarTextElement) => (event) => {
  if (event.data.type === 'button-click') {
    handleIframeButtonClick(iframeElement, statusBarTextElement)(event);
  }
}

const waitUntilChatHistoryIsLoaded = async () => {
  await chatProvider.waitUntilChatHistoryIsLoaded();
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

  registerOnSettingsButtonClick(settingsButtonElement);

  await requestMissingApiKeysFromUser();

  setStatusIndicator(statusBarTextElement, 'Waiting for chat history...');
  await waitUntilChatHistoryIsLoaded();
  await generateHtmlOnChatResponse(iframeElement, chatProvider, statusBarTextElement);
  registerOnLatestChatResponseCompletedOrLoaded(iframeElement);
  window.addEventListener('message', onWindowMessage(iframeElement, statusBarTextElement));
};

export const main = () => {
  initGenUIChat();
};
