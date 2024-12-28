const runCode = (programmingLanguage, code) => {
  const popupWindow = window.open("", "_blank", "width=800,height=600");
  if (programmingLanguage === "html") {
    alert("HTML is not yet supported");
  } else if (programmingLanguage === "javascript") {
    popupWindow.document.write(
      "<!DOCTYPE html><html><head><title>Test</title></head><body><p>Head and body test</p></body></html>"
    );
    popupWindow.document.close();

    const waitForReady = (win) =>
      new Promise((r) =>
        (function check() {
          win.document.readyState === "complete"
            ? r()
            : requestAnimationFrame(check);
        })()
      );

    waitForReady(popupWindow).then(() => {
      const script = popupWindow.document.createElement("script");
      script.src = URL.createObjectURL(
        new Blob(["alert('est script executed!');"], {
          type: "application/javascript",
        })
      );
      popupWindow.document.head.appendChild(script);
    });

  } else console.error("Popup was blocked or couldn't be opened.");
};

const createRunButtonElement = () => {
  const button = document.createElement("button");
  button.className = "run-button";
  button.textContent = "Run";
  button.style.marginLeft = "10px";
  return button;
};

const upsertRunButton = (codeBlockElement) => {
  if (codeBlockElement.querySelector(".run-button")) return;

  const topBarElement = codeBlockElement.firstChild;

  const programmingLanguage = topBarElement.textContent.toLowerCase().trim();
  if (!["html", "javascript"].includes(programmingLanguage)) return;

  const buttonElement = createRunButtonElement();
  buttonElement.addEventListener("click", () => {
    const code = codeBlockElement.querySelector("code").textContent;
    runCode(programmingLanguage, code);
  });

  const stickyBarElement = codeBlockElement.querySelector(".sticky").firstChild;

  stickyBarElement.appendChild(buttonElement);
};

const upsertRunButtonsToCodeBlocks = () => {
  const codeElements = document.querySelectorAll("code");
  const codeBlockElements = Array.from(codeElements).map(
    (codeElement) => codeElement.parentElement.parentElement
  );
  const supportedCodeBlockElements = Array.from(codeBlockElements).filter(
    (codeBlockElement) => {
      const programmingLanguage = codeBlockElement.firstChild.textContent
        .toLowerCase()
        .trim();
      return ["html", "javascript"].includes(programmingLanguage);
    }
  );
  supportedCodeBlockElements.forEach(upsertRunButton);
};

const main = () => {
  const mutationObserver = new MutationObserver(() => {
    upsertRunButtonsToCodeBlocks();
  });
  mutationObserver.observe(document, { subtree: true, childList: true });
  upsertRunButtonsToCodeBlocks();
};

main();
