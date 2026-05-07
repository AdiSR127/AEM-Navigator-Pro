chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = tab.url;
    
    // Check if it's an AEM content page
    if (url.includes('/content/') || url.includes('/editor.html') || url.includes('/sites.html')) {
      // Set a blue badge that says 'AEM'
      chrome.action.setBadgeText({ tabId: tabId, text: "AEM" });
      chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: "#eb1000" });
    } else {
      // Remove badge if not an AEM page
      chrome.action.setBadgeText({ tabId: tabId, text: "" });
    }
  }
});