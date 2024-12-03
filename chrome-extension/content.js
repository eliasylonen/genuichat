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

const getOpenAiApiKey = () => {
  const openAiApiKey = localStorage.getItem('genuichat-openai-api-key');
  if (!openAiApiKey) throw new Error('Missing OpenAI API key');
  return openAiApiKey;
};

const setLoadingIndicator = (statusBar, isLoading) => {
  statusBar.textContent = isLoading ? 'Loading...' : 'Ready';
};

const setupLayout = () => {
  const genuiContainer = document.createElement('div');
  genuiContainer.className = 'genui-container';
  
  const iframe = document.createElement('iframe');
  iframe.className = 'genui-iframe';

  const statusBar = document.createElement('div');
  statusBar.className = 'genui-status-bar';
  setLoadingIndicator(statusBar, true);

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

const generateChatCompletion = async (prompt) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getOpenAiApiKey()}`
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }
  
  const { choices } = await response.json();
  const { content } = choices[0].message;

  return content;
};

const generateHtmlOnChatResponse = async () => {
  console.log('Generating HTML from last chat response');

  const relevantInformationMarkdown = await generateChatCompletion(`Extract most relevant information from the following HTML.
Shorten the text significantly, but keep tables and other data original.
Respond in Markdown.

HTML:

${chatProvider.getLastMessageHTML()}`);
    console.log('Extracted the following relevant information from last chat response', relevantInformationMarkdown);

  const rawGeneratedHtml = await generateChatCompletion(`Generate HTML (no CSS) that displays relevant information in the Message on an HTML page.
Use tables, charts, and other visual elements if relevant to make data easy to understand.
Add useful buttons depending on the context.
All buttons must have unique ids. 

Reply only with HTML, nothing else.

Message:

${relevantInformationMarkdown}`);
    console.log('Generated HTML', rawGeneratedHtml);

  const rawImprovedHtml = await generateChatCompletion(`Add helpful buttons relevant parts of the page itself.
Do not implement button click handlers.
Respond with the updated HTML and nothing else.
All buttons must have unique ids.

Reply only with HTML, nothing else.

HTML:

${rawGeneratedHtml}`);
    console.log('Improved HTML', rawImprovedHtml);

  const improvedHtml = rawImprovedHtml.replace(/^```html\n|```$/g, '');

  return improvedHtml;
};

const generateHtmlOnButtonClick = async (buttonId, buttonText, dom) => {
    const prompt = `The user clicked the "${buttonText}" with id "${buttonId}" in the following DOM: \n\n###\n\n${dom}.\n\n###\n\nGenerate HTML (including CSS) reflecting necessary changes to of the last message on an HTML page.`;

    // TODO: Call OpenAI API

  return getPlaceholderHtml();
};

const loadHtml = async (iframe, html) => {
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

const onNewLatestResponseSeenListener = (iframe) => async () => {
  const html = await generateHtmlOnChatResponse();
  await loadHtml(iframe, html);
};

const addResponseCompletedListener = (iframe) => {
  chatProvider.addOnNewLatestResponseSeenListener(onNewLatestResponseSeenListener(iframe));
};

const handleIframeButtonClick = (iframe) => async (event) => {
  const html = await generateHtmlOnButtonClick(event.data.buttonId, event.data.buttonText, event.data.dom);
  await loadHtml(iframe, html);
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
  console.log('Initializing GenUIChat');

  const { iframe, statusBar } = setupLayout();

  try {
    getOpenAiApiKey();
  } catch (error) {
    await requestOpenAiApiKeyFromUser();
  }

  await waitUntilChatHistoryIsLoaded();

  const html = await generateHtmlOnChatResponse();
  await loadHtml(iframe, html);
  addResponseCompletedListener(iframe);
  window.addEventListener('message', handleMessage(iframe));
  console.log('GenUIChat initialized');
  setLoadingIndicator(statusBar, false);
};

window.addEventListener('load', () => initGenUIChat());
