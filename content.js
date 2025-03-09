(function () {
  "use strict";

  /**
   * Injects the main script into the page
   */
  function injectScript() {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("inject.js");
    (document.head || document.documentElement).appendChild(script);

    // Clean up the script tag after load
    script.onload = function () {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }

  /**
   * Injects the script into iframes
   */
  function injectScriptIntoIframes() {
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((iframe, index) => {
      try {
        if (!iframe.id) {
          iframe.id = `injected-frame-${index}`;
        }

        const iframeDocument =
          iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDocument) {
          const script = iframeDocument.createElement("script");
          script.src = chrome.runtime.getURL("inject.js");
          iframeDocument.head.appendChild(script);

          // Clean up script tag after load
          script.onload = function () {
            if (script.parentNode) {
              script.parentNode.removeChild(script);
            }
          };
        }
      } catch (e) {
        // Silently fail for cross-origin iframes (expected behavior)
      }
    });
  }

  /**
   * Sets up an observer to detect new iframes
   */
  function setupIframeObserver() {
    if (document.body) {
      injectScriptIntoIframes();

      const iframeObserver = new MutationObserver((mutations) => {
        let hasNewIframes = false;

        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            const addedNodes = Array.from(mutation.addedNodes);
            const addedIframes = addedNodes.filter(
              (node) =>
                node.tagName === "IFRAME" ||
                (node.nodeType === Node.ELEMENT_NODE &&
                  node.querySelector("iframe"))
            );

            if (addedIframes.length > 0) {
              hasNewIframes = true;
            }
          }
        });

        if (hasNewIframes) {
          injectScriptIntoIframes();
        }
      });

      iframeObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    } else {
      // Document not ready yet, retry
      setTimeout(setupIframeObserver, 100);
    }
  }

  // Initialize script injection
  injectScript();
  setupIframeObserver();

  // Listen for requests to open the clipboard helper
  window.addEventListener(
    "message",
    function (event) {
      if (event.data && event.data.type === "REQUEST_CLIPBOARD_HELPER") {
        chrome.runtime.sendMessage({
          action: "openClipboardHelper",
          frameId: event.data.frameId,
        });
      }
    },
    false
  );

  // Handle messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.fileDataUrl && request.mimeType) {
      const message = {
        type: "CLIPBOARD_DATA",
        clipboardData: {
          fileDataUrl: request.fileDataUrl,
          mimeType: request.mimeType,
        },
      };

      // Forward the message to the appropriate frame
      if (request.frameId === "top") {
        window.postMessage(message, "*");
      } else {
        const targetFrame = document.getElementById(request.frameId);
        if (targetFrame) {
          targetFrame.contentWindow.postMessage(message, "*");
        }
      }

      sendResponse({ success: true });
    }
    return true;
  });
})();
