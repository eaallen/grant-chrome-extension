// Initialize GRANT_CONFIG from localStorage or defaults
window.GRANT_CONFIG = JSON.parse(localStorage.getItem('GRANT_CONFIG')) || {
    apiEndpoint: '',
    hostUrl: '',
    contextData: ''
};

// Get configuration from the page context
const config = {
    apiEndpoint: window.GRANT_CONFIG.apiEndpoint,
    title: 'GENeral Grant',
    contextData: window.GRANT_CONFIG.contextData
};

// Create container div
const homeUrl = `${window.GRANT_CONFIG.hostUrl}/hackathon`;

const container = document.createElement('div');
container.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        background: white;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
        min-width: 200px;
        max-width: 800px;
        width: fit-content;
        overflow: visible;
    `;

// Create a content wrapper to help with sizing
const contentWrapper = document.createElement('div');
contentWrapper.style.cssText = `
        width: 300px;
        min-width: 200px;
        max-width: 800px;
    `;
container.appendChild(contentWrapper);

// Create and add logo
const title = document.createElement('h2');
title.textContent = config.title;
title.style.cssText = `
        text-align: center;
        margin: 0 0 15px 0;
        color: #333;
        font-family: Arial, sans-serif;
        font-size: 18px;
        cursor: move;
        width: 100%;
    `;
contentWrapper.appendChild(title);

const logo = document.createElement('img');
logo.src = `${homeUrl}/logo.png`;
logo.alt = 'Logo';
logo.style.cssText = `
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
        margin: 0 auto 15px auto;
        display: block;
    `;
contentWrapper.appendChild(logo);

// Create input fields
const apiInput = document.createElement('input');
apiInput.type = 'text';
apiInput.placeholder = 'API Endpoint';
apiInput.value = config.apiEndpoint || '';
apiInput.style.cssText = `
        width: 100%;
        margin-bottom: 10px;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
    `;
// Save API endpoint when it changes
apiInput.addEventListener('change', () => {
    window.GRANT_CONFIG.apiEndpoint = apiInput.value;
    localStorage.setItem('GRANT_CONFIG', JSON.stringify(window.GRANT_CONFIG));
});
contentWrapper.appendChild(apiInput);

const input1 = document.createElement('textarea');
input1.placeholder = 'Enter text...';
input1.value = config.contextData || '';
input1.style.cssText = `
        width: 100%;
        margin-bottom: 10px;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
        min-height: 60px;
        height: 120px;
        resize: vertical;
        overflow-y: auto;
    `;
// Save context when it changes
input1.addEventListener('change', () => {
    window.GRANT_CONFIG.contextData = input1.value;
    localStorage.setItem('GRANT_CONFIG', JSON.stringify(window.GRANT_CONFIG));
});
contentWrapper.appendChild(input1);

// Create submit button
const submitBtn = document.createElement('button');
submitBtn.textContent = 'SUBMIT';
submitBtn.style.cssText = `
        width: 100%;
        padding: 8px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;
contentWrapper.appendChild(submitBtn);

// Remove toggle button and visibility logic
let isOpen = true;

// Make container draggable
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;

title.addEventListener('mousedown', dragStart);

function dragStart(e) {
    initialX = e.clientX - container.offsetLeft;
    initialY = e.clientY - container.offsetTop;

    if (e.target === title) {
        isDragging = true;
    }
}

document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        // Keep within viewport bounds
        currentX = Math.min(Math.max(0, currentX), window.innerWidth - container.offsetWidth);
        currentY = Math.min(Math.max(0, currentY), window.innerHeight - container.offsetHeight);

        container.style.left = currentX + 'px';
        container.style.top = currentY + 'px';
        container.style.right = 'auto';
    }
}

function dragEnd() {
    isDragging = false;
}

// auth not used for now, would need to register app
async function getAuthToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, function(token) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }
            resolve(token);
        });
    });
}

// TODO: Update the submit handler to include authentication
submitBtn.addEventListener('click', async () => {
    console.log("click");

    console.log(input1.value);

    const url = new URL(apiInput.value);
    const context = input1.value;
    url.searchParams.set('context', context);
    const rawData = await getData();
    console.log('rawData', rawData.slice(0, 1000));
    
    url.searchParams.set('form', rawData.slice(0, 1000));

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const response = await fetch(url);
        console.log(response)
        const data = await response.json();
        console.log(data.result)

        // Save the context data and update localStorage
        window.GRANT_CONFIG.contextData = context;
        localStorage.setItem('GRANT_CONFIG', JSON.stringify(window.GRANT_CONFIG));

        submitBtn.textContent = 'Success!';
        setTimeout(() => {
            submitBtn.textContent = 'SUBMIT';
            submitBtn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        submitBtn.textContent = 'Error - Try Again';
        submitBtn.disabled = false;
    }
});
/**
 * Get the content of the current tab
 * @returns {Promise<string>} The content of the current tab
 */
function getData() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const activeTab = tabs[0];

            // First try to send message to existing content script
            chrome.tabs.sendMessage(activeTab.id, { action: "getContent" }, function (response) {
                if (chrome.runtime.lastError) {
                    // If content script is not loaded, inject it
                    chrome.scripting.executeScript({
                        target: { tabId: activeTab.id },
                        files: ['content.js']
                    }).then(() => {
                        // After injection, try sending the message again
                        setTimeout(() => {
                            chrome.tabs.sendMessage(activeTab.id, { action: "getContent" }, function (response) {
                                if (response) {
                                    resolve(response.text);
                                }
                            });
                        }, 100); // Small delay to ensure content script is loaded
                    });
                } else if (response) {
                    // Content script was already loaded
                    resolve(response.text);
                }
            });
        });
    });
}

// Just add container
document.body.appendChild(container);