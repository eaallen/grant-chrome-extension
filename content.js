// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getContent") {
    // Get page content
    const pageContent = {
      title: document.title,
      text: document.body.innerText
    };
    sendResponse(pageContent);
  }
}); 