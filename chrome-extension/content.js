const chatGptProvider = {
  waitUntilChatHistoryIsLoaded: async () => new Promise((resolve) => {  
    const onMutation = (event) => {
      const isLoaded = !!document.querySelector('main article');
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
}

// TODO: Pass globals as arguments throughout the whole app
const iframe = document.createElement('iframe');

const chatProvider = (() => {
  switch (window.location.hostname) {
    case 'chatgpt.com':
      return chatGptProvider;
    default:
      throw new Error('Unsupported chat provider');
  }
})();

const getApiKey = () => localStorage.getItem('openai-api-key');

const setupLayout = () => {
  const genuiContainer = document.createElement('div');
  genuiContainer.className = 'genui-container';
  iframe.className = 'genui-iframe';

  genuiContainer.appendChild(iframe);
  document.body.appendChild(genuiContainer);

  const rootDivs = document.body.querySelectorAll('body > div');
  rootDivs.forEach(div => {
    div.style.maxWidth = '50%';
  });

  return iframe;
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

const generateHtmlOnChatResponse = async () => {
  const prompt = `Generate HTML (including CSS) that displays relevant information from the last message on an HTML page. Use tables, charts, and other visual elements if relevant to make data easy to understand. Add useful buttons depending on the context. All buttons must have unique ids.`;

  // TODO: Call OpenAI API

  return getPlaceholderHtml();
};

const generateHtmlOnButtonClick = async (buttonId, buttonText, dom) => {
  const prompt = `The user clicked the "${buttonText}" with id "${buttonId}" in the following DOM: \n\n###\n\n${dom}.\n\n###\n\nGenerate HTML (including CSS) reflecting necessary changes to of the last message on an HTML page.`;

  // TODO: Call OpenAI API

  return getPlaceholderHtml();
};

const loadHtml = async (html) => {
  iframe.onload = () => {
    const buttons = iframe.contentDocument.querySelectorAll('button');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        window.parent.postMessage({
          type: 'button-click',
          buttonId: e.target.id,
          buttonText: e.target.textContent,
          dom: iframe.contentDocument.documentElement.outerHTML
        }, '*');
      });
    });
  };

  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
};

const onNewLatestResponseSeenListener = async () => {
  const html = await generateHtmlOnChatResponse();
  await loadHtml(html);
};

const addResponseCompletedListener = () => {
  chatProvider.addOnNewLatestResponseSeenListener(onNewLatestResponseSeenListener);
};

const handleIframeButtonClick = async (event) => {
  const html = await generateHtmlOnButtonClick(event.data.buttonId, event.data.buttonText, event.data.dom);
  await loadHtml(html);
};

const handleMessage = (event) => {
  if (event.data.type === 'button-click') {
    handleIframeButtonClick(event);
  }
}

const waitUntilChatHistoryIsLoaded = async () => {
  console.log('Waiting until chat history is loaded');
  await chatProvider.waitUntilChatHistoryIsLoaded();
  console.log('Chat history loaded');
}

const initGenUIChat = async () => {
  console.log('Initializing GenUIChat');
  
  setupLayout();

  await waitUntilChatHistoryIsLoaded();

  const html = await generateHtmlOnChatResponse();
  await loadHtml(html);
  addResponseCompletedListener();
  window.addEventListener('message', handleMessage);
  console.log('GenUIChat initialized');
};

window.addEventListener('load', () => initGenUIChat());
