
const chatGptIntegration = {
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
  registerOnLatestChatResponseCompletedOrLoaded: (iframeElement, statusBarTextElement, state, onLatestChatResponseCompletedOrLoaded) => {
    let completedMessageIds = new Set();

    const getUniqueAcrossChatsLastMessageId = () => {
      const messageId = document.querySelector('main article:last-of-type').getAttribute('data-testid');
      const chatId = window.location.pathname.match(/\/c\/([0-9a-f-]+)/)?.[1];
      return `chat-${chatId}-message-${messageId}`;
    };

    const onMutation = async (event) => {
      const isLastChatGptResponseCompleted = !!document.querySelector('main article:last-of-type [data-testid="copy-turn-action-button"]');
      if (!isLastChatGptResponseCompleted) return;
      const completedMessageId = getUniqueAcrossChatsLastMessageId();
      if (completedMessageIds.has(completedMessageId)) return;
      completedMessageIds = new Set([...completedMessageIds, completedMessageId]);
      await onLatestChatResponseCompletedOrLoaded(iframeElement, statusBarTextElement, state);
    };
  
    const mutationObserver = new MutationObserver(onMutation);

    const mainElement = document.querySelector('main');
    const chatContainerElement = mainElement?.parentElement;
    if (!chatContainerElement) throw new Error('No chat container element found');

    mutationObserver.observe(chatContainerElement, { childList: true, subtree: true });
  },
  getLastMessageHTML: () => {
    const lastMessageElement = document.querySelector('main article:last-of-type div[data-message-author-role="assistant"] > div > div')
    if (!lastMessageElement) throw new Error('Last message not found');
    return lastMessageElement?.innerHTML;
  },
}

export const chatIntegration = (() => {
  switch (window.location.hostname) {
    case 'chatgpt.com':
      return chatGptIntegration;
    default:
      throw new Error('Unsupported chat provider');
  }
})();
