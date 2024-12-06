export const loadHtml = async (iframeElement, html) => {
  iframeElement.onload = () => {
    const link = document.createElement('link');
    link.href = chrome.runtime.getURL('iframeStyles.css');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    iframeElement.contentDocument.head.appendChild(link);

    const buttons = iframeElement.contentDocument.querySelectorAll('button');

    buttons.forEach(button => {
      button.addEventListener('click', (event) => {
        event.target.textContent = 'Loading...';
        window.parent.postMessage({
          type: 'button-click',
          buttonId: event.target.id,
          buttonText: event.target.textContent
        }, '*');
      });
    });
  };

  iframeElement.contentDocument.open();
  iframeElement.contentDocument.write(html);
  iframeElement.contentDocument.close();
};
