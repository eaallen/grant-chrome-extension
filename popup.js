// When popup opens
document.addEventListener('DOMContentLoaded', function() {
  // Get the current active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const activeTab = tabs[0];
    
    // First try to send message to existing content script
    chrome.tabs.sendMessage(activeTab.id, {action: "getContent"}, function(response) {
      if (chrome.runtime.lastError) {
        // If content script is not loaded, inject it
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ['content.js']
        }).then(() => {
          // After injection, try sending the message again
          setTimeout(() => {
            chrome.tabs.sendMessage(activeTab.id, {action: "getContent"}, function(response) {
              if (response) {
                document.getElementById('pageTitle').textContent = response.title;
                document.getElementById('pageText').textContent = response.text;
              }
            });
          }, 100); // Small delay to ensure content script is loaded
        });
      } else if (response) {
        // Content script was already loaded
        document.getElementById('pageTitle').textContent = response.title;
        document.getElementById('pageText').textContent = response.text;
      }
    });
  });
}); 