export const loadHtml = async (iframe, html) => {
  iframe.onload = () => {
    const buttons = iframe.contentDocument.querySelectorAll('button');
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

  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
}; 