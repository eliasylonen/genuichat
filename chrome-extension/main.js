//const { generateHtmlOnChatResponse, generateChatCompletion, loadHtml } = await import(chrome.runtime.getURL('llm-providers/htmlGenerator.js'));
import { loadHtml } from './loadHtml.js';
import { generateChatCompletion } from './generateChatCompletion.js';
import { generateHtmlOnChatResponse } from './generateHtmlOnChatResponse.js';
import { getOpenAiApiKey } from './getOpenAiApiKey.js';
import { setStatusIndicator } from './setStatusIndicator.js';

console.log('Main script started');

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
  addOnNewLatestResponseSeenListener: (onNewLatestResponseSeenListener) => {
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
      console.log('Completed message id', completedMessageId);
      completedMessageIds = new Set([...completedMessageIds, completedMessageId]);
      onNewLatestResponseSeenListener();
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
  const genuiContainer = document.createElement('div');
  genuiContainer.className = 'genui-container';
  
  const iframe = document.createElement('iframe');
  iframe.className = 'genui-iframe';

  const statusBar = document.createElement('div');
  statusBar.className = 'genui-status-bar';
  setStatusIndicator(statusBar, 'Initializing...');

  genuiContainer.appendChild(iframe);
  genuiContainer.appendChild(statusBar);
  document.body.appendChild(genuiContainer);

  const rootDivs = document.body.querySelectorAll('body > div');
  rootDivs.forEach(div => {
    div.style.maxWidth = '50%';
  });

  return { iframe, statusBar };
};

const getPlaceholderHtml = () => `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        button { padding: 10px 20px; margin: 10px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <p>Ui generated at ${+new Date()}</p>
        <button id="do-something-button-1">Do something</button>
      </div>
    </body>
  </html>
`;

const onNewLatestResponseSeenListener = (iframe) => async () => {
  await generateHtmlOnChatResponse(iframe, chatProvider);
};

const addResponseCompletedListener = (iframe) => {
  chatProvider.addOnNewLatestResponseSeenListener(onNewLatestResponseSeenListener(iframe));
};

const handleIframeButtonClick = (iframe) => async (event) => {
  const domHtml = iframe.contentDocument.documentElement.outerHTML;
  const html = await generateHtmlOnButtonClick(event.data.buttonId, event.data.buttonText, domHtml);
};

const handleMessage = (iframe) => (event) => {
  if (event.data.type === 'button-click') {
    handleIframeButtonClick(iframe)(event);
  }
}

const waitUntilChatHistoryIsLoaded = async () => {
  console.log('Waiting until chat history is loaded');
  await chatProvider.waitUntilChatHistoryIsLoaded();
  console.log('Chat history loaded', document.querySelector('main article:last-of-type div[data-message-author-role="assistant"] > div > div'));
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
  const { iframe, statusBar } = setupLayout();

  try {
    getOpenAiApiKey();
  } catch (error) {
    await requestOpenAiApiKeyFromUser();
  }

  setStatusIndicator(statusBar, 'Waiting for chat history...');
  await waitUntilChatHistoryIsLoaded();
  await generateHtmlOnChatResponse(iframe, chatProvider, statusBar);
  addResponseCompletedListener(iframe);
  window.addEventListener('message', handleMessage(iframe));
};

const generateHtmlOnButtonClick = async (buttonId, buttonText, domHtml) => {
  try {
    const rawUpdatedHtml = await generateChatCompletion(`Generate HTML of the page after "${buttonText}" button click. Respond only with HTML, nothing else. The user clicked button with id "${buttonId}" in the following DOM.

DOM:

${domHtml}`);
    const updatedHtml = cleanHtml(rawUpdatedHtml);
    await loadHtml(iframe, updatedHtml);
  } catch (error) {
    console.error('Error generating HTML:', error);
  }
};

export const main = () => {
  console.log('Executing main function');
  initGenUIChat();
};
