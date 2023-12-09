// background.js

let originTabId = null;
let helperTabId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background script received a message:", request);

    if (request.action === "openClipboardHelper") {
        originTabId = sender.tab.id;
        chrome.tabs.create({ url: chrome.runtime.getURL('clipboard-helpers/clipboard-helper.html'), active: true }, function(tab) {
            console.log("Clipboard helper tab created with id:", tab.id);
            helperTabId = tab.id;
        });
    } else if (request.fileDataUrl && originTabId !== null) {
        chrome.tabs.sendMessage(originTabId, { fileDataUrl: request.fileDataUrl, mimeType: request.mimeType }, response => {
            if (chrome.runtime.lastError) {
                console.error(`Error in sending message to content script: ${chrome.runtime.lastError.message}`);
            } else {
                console.log('Content script response:', response);
            }
            if (helperTabId !== null) {
                chrome.tabs.remove(helperTabId, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Failed to close the helper tab:", chrome.runtime.lastError.message);
                    }
                    chrome.tabs.update(originTabId, { active: true });
                });
                helperTabId = null;
            }
        });
    } else if (request.closeTab && helperTabId !== null) {
        chrome.tabs.remove(helperTabId, () => {
            if (chrome.runtime.lastError) {
                console.error("Failed to close the helper tab:", chrome.runtime.lastError.message);
            }
        });
        helperTabId = null;
    }

    return true;
});
