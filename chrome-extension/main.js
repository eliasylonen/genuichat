import { generateHtmlOnChatResponse } from './generateHtmlOnChatResponse.js';
import { getOpenAiApiKey } from './getOpenAiApiKey.js';
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

const setupLayout = () => {
  const genuiContainerElement = document.createElement('div');
  genuiContainerElement.id = 'genui-container';
  
  const iframeElement = document.createElement('iframe');
  iframeElement.id = 'genui-iframeElement';

  const statusBarElement = document.createElement('div');
  statusBarElement.id = 'genui-status-bar';
  setStatusIndicator(statusBarElement, 'Initializing...');

  genuiContainerElement.appendChild(iframeElement);
  genuiContainerElement.appendChild(statusBarElement);
  document.body.appendChild(genuiContainerElement);

  const rootDivs = document.body.querySelectorAll('body > div');
  rootDivs.forEach(div => {
    div.style.maxWidth = '50%';
  });

  return { genuiContainerElement, iframeElement, statusBarElement };
};

const onLatestChatResponseCompletedOrLoaded = (iframeElement) => async () => {
  await generateHtmlOnChatResponse(iframeElement, chatProvider);
};

const registerOnLatestChatResponseCompletedOrLoaded = (iframeElement) => {
  chatProvider.registerOnLatestChatResponseCompletedOrLoaded(onLatestChatResponseCompletedOrLoaded(iframeElement));
};

const handleIframeButtonClick = (iframeElement, statusBarElement) => async (event) => {
  const domHtml = iframeElement.contentDocument.documentElement.outerHTML;
  const html = await generateHtmlOnButtonClick(iframeElement, statusBarElement, event.data.buttonId, event.data.buttonText, domHtml);
};

const handleMessage = (iframeElement, statusBarElement) => (event) => {
  if (event.data.type === 'button-click') {
    handleIframeButtonClick(iframeElement, statusBarElement)(event);
  }
}

const waitUntilChatHistoryIsLoaded = async () => {
  await chatProvider.waitUntilChatHistoryIsLoaded();
}

const requestOpenAiApiKeyFromUser = async () => {
  const apiKey = prompt('Please enter your OpenAI API key to use GenUIChat:');
  if (apiKey) {
    localStorage.setItem('genuichat-openai-api-key', apiKey);
  } else {
    alert('API key is required for GenUIChat to function');
  }
};

const initGenUIChat = async () => {
  const { genuiContainerElement, iframeElement, statusBarElement } = setupLayout();

  try {
    getOpenAiApiKey();
  } catch (error) {
    await requestOpenAiApiKeyFromUser();
  }

  setStatusIndicator(statusBarElement, 'Waiting for chat history...');
  await waitUntilChatHistoryIsLoaded();
  await generateHtmlOnChatResponse(iframeElement, chatProvider, statusBarElement);
  registerOnLatestChatResponseCompletedOrLoaded(iframeElement);
  window.addEventListener('message', handleMessage(iframeElement, statusBarElement));
};

export const main = () => {
  initGenUIChat();
};
