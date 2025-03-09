document.addEventListener("DOMContentLoaded", () => {
  const clearPreferencesButton = document.getElementById("clearPreferences");
  const statusElement = document.getElementById("status");

  /**
   * Gets the active tab's domain
   * @returns {Promise<string>} Promise that resolves to the active domain
   */
  async function getActiveDomain() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          resolve(null);
          return;
        }

        try {
          const url = new URL(tabs[0].url);
          resolve(url.hostname);
        } catch (error) {
          console.error("Error parsing URL:", error);
          resolve(null);
        }
      });
    });
  }

  /**
   * Shows a status message that fades out
   * @param {string} message - The message to display
   * @param {string} type - The type of message (success or error)
   */
  function showStatus(message, type = "success") {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.style.opacity = "1";

    setTimeout(() => {
      statusElement.style.opacity = "0";
    }, 3000);
  }

  /**
   * Clears site preferences for the active domain
   */
  async function clearSitePreferences() {
    const site = await getActiveDomain();

    if (!site) {
      showStatus("Unable to determine current site", "error");
      return;
    }

    chrome.storage.sync.get({ sitePreferences: {} }, (data) => {
      const sitePreferences = data.sitePreferences;

      if (sitePreferences.hasOwnProperty(site)) {
        delete sitePreferences[site];

        chrome.storage.sync.set({ sitePreferences }, () => {
          if (chrome.runtime.lastError) {
            showStatus(`Error: ${chrome.runtime.lastError.message}`, "error");
          } else {
            showStatus(`Preferences cleared for ${site}`);
          }
        });
      } else {
        showStatus(`No preferences found for ${site}`);
      }
    });
  }

  // Add click event for clear preferences button
  clearPreferencesButton.addEventListener("click", clearSitePreferences);
});
