export const loadHtml = async (iframeElement, html) => {
  iframeElement.onload = () => {
    const link = document.createElement('link');
    link.href = chrome.runtime.getURL('iframeStyles.css');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    iframeElement.contentDocument.head.appendChild(link);

    const buttons = iframeElement.contentDocument.querySelectorAll('button');

    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        window.parent.postMessage({
          type: 'button-click',
          buttonId: e.target.id,
          buttonText: e.target.textContent
        }, '*');
      });
    });
  };

  iframeElement.contentDocument.open();
  iframeElement.contentDocument.write(html);
  iframeElement.contentDocument.close();
};
