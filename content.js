(function() {
    'use strict';

    function injectScript() {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('inject.js');
        (document.head || document.documentElement).appendChild(script);
    }

    function injectScriptIntoIframes() {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe, index) => {
            try {
                if (!iframe.id) {
                    iframe.id = `injected-frame-${index}`;
                }
                const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDocument) {
                    const script = iframeDocument.createElement('script');
                    script.src = chrome.runtime.getURL('inject.js');
                    iframeDocument.head.appendChild(script);
                }
            } catch (e) {
                // Silently fail for cross-origin iframes
            }
        });
    }

    function setupIframeObserver() {
        if (document.body) {
            injectScriptIntoIframes();
            const iframeObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        const addedNodes = Array.from(mutation.addedNodes);
                        const addedIframes = addedNodes.filter(node => node.tagName === 'IFRAME');
                        if (addedIframes.length > 0) {
                            injectScriptIntoIframes();
                        }
                    }
                });
            });
            iframeObserver.observe(document.body, { childList: true, subtree: true });
        } else {
            setTimeout(setupIframeObserver, 100);
        }
    }

    injectScript();
    setupIframeObserver();

    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'REQUEST_CLIPBOARD_HELPER') {
            chrome.runtime.sendMessage({ action: "openClipboardHelper", frameId: event.data.frameId });
        }
    }, false);

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.fileDataUrl && request.mimeType) {
            const message = {
                type: 'CLIPBOARD_DATA',
                clipboardData: {
                    fileDataUrl: request.fileDataUrl,
                    mimeType: request.mimeType
                }
            };
            
            if (request.frameId === 'top') {
                window.postMessage(message, '*');
            } else {
                const targetFrame = document.getElementById(request.frameId);
                if (targetFrame) {
                    targetFrame.contentWindow.postMessage(message, '*');
                }
            }
            sendResponse({ success: true });
        }
        return true;
    });
})();