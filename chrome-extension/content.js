(async () => {
  console.log('Content script started');
  const src = chrome.runtime.getURL('main.js');
  const mainScript = await import(src);
  mainScript.main();
})();
