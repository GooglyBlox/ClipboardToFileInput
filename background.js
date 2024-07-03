let originTabId = null;
let originFrameId = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background script received a message:", request);

    if (request.action === "openClipboardHelper") {
        originTabId = sender.tab.id;
        originFrameId = request.frameId;
        chrome.windows.create({ url: chrome.runtime.getURL('clipboard-helpers/clipboard-helper.html'), type: 'popup' }, function(window) {
            if (chrome.runtime.lastError) {
                console.error("Error creating clipboard helper window:", chrome.runtime.lastError.message);
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else {
                console.log("Clipboard helper window created with id:", window.id);
                sendResponse({ success: true });
            }
        });
        return true;
    } else if (request.fileDataUrl) {
        chrome.tabs.sendMessage(originTabId, { 
            fileDataUrl: request.fileDataUrl, 
            mimeType: request.mimeType, 
            frameId: originFrameId 
        }, response => {
            if (chrome.runtime.lastError) {
                console.error(`Error in sending message to content script: ${chrome.runtime.lastError.message}`);
            } else {
                console.log('Content script response:', response);
            }
            chrome.tabs.query({ url: chrome.runtime.getURL('clipboard-helpers/clipboard-helper.html') }, function(tabs) {
                if (tabs.length > 0) {
                    chrome.tabs.remove(tabs[0].id, () => {
                        if (chrome.runtime.lastError) {
                            console.error("Failed to close the helper tab:", chrome.runtime.lastError.message);
                        }
                    });
                }
                chrome.tabs.update(originTabId, { active: true }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Failed to activate the origin tab:", chrome.runtime.lastError.message);
                    }
                });
            });
        });
        return true;
    } else if (request.closeTab) {
        chrome.tabs.query({ url: chrome.runtime.getURL('clipboard-helpers/clipboard-helper.html') }, function(tabs) {
            if (tabs.length > 0) {
                chrome.tabs.remove(tabs[0].id, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Failed to close the helper tab:", chrome.runtime.lastError.message);
                    }
                });
            }
            chrome.tabs.update(originTabId, { active: true }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Failed to activate the origin tab:", chrome.runtime.lastError.message);
                }
            });
        });
        return true;
    } else if (request.action === 'saveSitePreference') {
        const { site, enabled } = request;
        chrome.storage.sync.get({ sitePreferences: {} }, (data) => {
            const sitePreferences = data.sitePreferences;
            sitePreferences[site] = enabled;
            chrome.storage.sync.set({ sitePreferences }, () => {
                sendResponse({ success: true });
            });
        });
        return true;
    } else if (request.action === 'getSitePreference') {
        const { site } = request;
        chrome.storage.sync.get({ sitePreferences: {} }, (data) => {
            const sitePreferences = data.sitePreferences;
            sendResponse({ enabled: sitePreferences[site] });
        });
        return true;
    }
});