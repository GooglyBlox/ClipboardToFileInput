document.addEventListener('DOMContentLoaded', () => {
    const clearPreferencesButton = document.getElementById('clearPreferences');
    
    clearPreferencesButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            const site = new URL(activeTab.url).hostname;

            chrome.storage.sync.get({ sitePreferences: {} }, (data) => {
                const sitePreferences = data.sitePreferences;
                delete sitePreferences[site];
                chrome.storage.sync.set({ sitePreferences }, () => {
                    alert(`Preferences for ${site} have been cleared.`);
                });
            });
        });
    });
});
