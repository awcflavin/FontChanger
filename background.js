chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getTabFont") {
        // Content script is asking for the font assigned to its tab
        if (sender.tab && sender.tab.id) {
            chrome.storage.local.get(['tabSpecificFonts'], (result) => {
                const tabFonts = result.tabSpecificFonts || {};
                const font = tabFonts[sender.tab.id];
                sendResponse({ font: font });
            });
            return true; // Indicates we will respond asynchronously
        }
    }

});

// Clean up storage when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.local.get(['tabSpecificFonts'], (result) => {
        if (result.tabSpecificFonts && result.tabSpecificFonts[tabId]) {
            const newFonts = { ...result.tabSpecificFonts };
            delete newFonts[tabId];
            chrome.storage.local.set({ tabSpecificFonts: newFonts });
        }
    });
});
