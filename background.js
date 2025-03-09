let originTabId = null;
let originFrameId = null;

/**
 * Handles the clipboard helper window creation
 * @param {Object} request - The request object from the content script
 * @param {Object} sender - The sender information
 * @param {Function} sendResponse - The callback function
 */
function handleOpenClipboardHelper(request, sender, sendResponse) {
  originTabId = sender.tab.id;
  originFrameId = request.frameId;

  chrome.windows.create(
    {
      url: chrome.runtime.getURL("clipboard-helpers/clipboard-helper.html"),
      type: "popup",
      width: 500,
      height: 400,
    },
    function (window) {
      if (chrome.runtime.lastError) {
        console.error(
          "Error creating clipboard helper window:",
          chrome.runtime.lastError.message
        );
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        console.log("Clipboard helper window created with id:", window.id);
        sendResponse({ success: true });
      }
    }
  );
}

/**
 * Handles clipboard data transfer to content script
 * @param {Object} request - The request object containing file data
 * @param {Function} sendResponse - The callback function
 */
function handleFileDataTransfer(request, sendResponse) {
  chrome.tabs.sendMessage(
    originTabId,
    {
      fileDataUrl: request.fileDataUrl,
      mimeType: request.mimeType,
      frameId: originFrameId,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          `Error in sending message to content script: ${chrome.runtime.lastError.message}`
        );
      } else {
        console.log("Content script response:", response);
      }
      closeHelperTabAndFocusOrigin();
    }
  );
}

/**
 * Closes the helper tab and focuses back on the origin tab
 */
function closeHelperTabAndFocusOrigin() {
  chrome.tabs.query(
    { url: chrome.runtime.getURL("clipboard-helpers/clipboard-helper.html") },
    function (tabs) {
      if (tabs.length > 0) {
        chrome.tabs.remove(tabs[0].id, () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Failed to close the helper tab:",
              chrome.runtime.lastError.message
            );
          }
        });
      }

      if (originTabId) {
        chrome.tabs.update(originTabId, { active: true }, () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Failed to activate the origin tab:",
              chrome.runtime.lastError.message
            );
          }
        });
      }
    }
  );
}

/**
 * Handles site preference saving
 * @param {Object} request - The request object with site and enabled properties
 * @param {Function} sendResponse - The callback function
 */
function handleSaveSitePreference(request, sendResponse) {
  const { site, enabled } = request;

  chrome.storage.sync.get({ sitePreferences: {} }, (data) => {
    const sitePreferences = data.sitePreferences;
    sitePreferences[site] = enabled;

    chrome.storage.sync.set({ sitePreferences }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error saving site preference:",
          chrome.runtime.lastError.message
        );
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        sendResponse({ success: true });
      }
    });
  });
}

/**
 * Handles site preference retrieval
 * @param {Object} request - The request object with site property
 * @param {Function} sendResponse - The callback function
 */
function handleGetSitePreference(request, sendResponse) {
  const { site } = request;

  chrome.storage.sync.get({ sitePreferences: {} }, (data) => {
    const sitePreferences = data.sitePreferences;
    sendResponse({ enabled: sitePreferences[site] });
  });
}

// Main message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received a message:", request);

  // Handle different message types
  if (request.action === "openClipboardHelper") {
    handleOpenClipboardHelper(request, sender, sendResponse);
    return true; // Keep the message channel open for async response
  } else if (request.fileDataUrl) {
    handleFileDataTransfer(request, sendResponse);
    return true;
  } else if (request.closeTab) {
    closeHelperTabAndFocusOrigin();
    return true;
  } else if (request.action === "saveSitePreference") {
    handleSaveSitePreference(request, sendResponse);
    return true;
  } else if (request.action === "getSitePreference") {
    handleGetSitePreference(request, sendResponse);
    return true;
  }
});
