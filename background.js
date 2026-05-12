// URL of the portal you want to open
const PORTAL_URL = 'https://cloudwise-portal.appspot.com/#/apps/';

// Google favicon service URL (generates a 128px icon for best quality)
const FAVICON_API = 'https://portal.static.cloudwise.app/9.4.48/favicon.ico';

// === 1. Open the portal when the extension icon is clicked ===
chrome.action.onClicked.addListener(() => {
  // Opens the portal in a new tab and switches to it
  chrome.tabs.create({ url: PORTAL_URL, active: true });
});

// === 2. Fetch the site's favicon and set it as the extension icon ===
async function updateIcon() {
  try {
    const response = await fetch(FAVICON_API);
    if (!response.ok) throw new Error('Network response was not ok');
    
    // Convert the fetched favicon into a format Chrome can use as an icon
    const blob = await response.blob();
    const reader = new FileReader();
    
    reader.onloadend = function() {
      const base64data = reader.result;
      // Store the fetched icon so it can be reused later
      chrome.storage.local.set({ faviconData: base64data });
      // Set the extension icon dynamically
      chrome.action.setIcon({
        imageData: {
          16: createImageData(base64data, 16),
          48: createImageData(base64data, 48),
          128: createImageData(base64data, 128)
        }
      });
    };
    
    reader.readAsDataURL(blob);
  } catch (error) {
    console.warn('Could not fetch favicon, using default icon.', error);
    // Try to load a previously fetched favicon from storage
    const cached = await chrome.storage.local.get('faviconData');
    if (cached.faviconData) {
      chrome.action.setIcon({
        imageData: {
          16: createImageData(cached.faviconData, 16),
          48: createImageData(cached.faviconData, 48),
          128: createImageData(cached.faviconData, 128)
        }
      });
    }
  }
}

// Helper function to resize an image to the required icon size
function createImageData(dataUrl, size) {
  const img = new Image();
  img.src = dataUrl;
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  // The favicon will only be drawn once the image loads, so we return a promise.
  return new Promise((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      resolve(imageData);
    };
    img.onerror = () => {
      // If the image fails to load, return a blank canvas
      resolve(ctx.createImageData(size, size));
    };
  });
}

// Run the favicon update when the extension is installed or updated
chrome.runtime.onInstalled.addListener(updateIcon);
// Also try to update the icon when the service worker starts
updateIcon();// background.js
