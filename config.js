// Configuration file for API keys and environment variables

// Default API key (will be overridden by stored value if available)
let GEMINI_API_KEY = "";

// Function to get the API key from Chrome storage
export async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['geminiApiKey'], function(result) {
      if (result.geminiApiKey) {
        GEMINI_API_KEY = result.geminiApiKey;
      } else {
        // If no key is stored, use a default key for development
        // In production, you should prompt the user to enter their key
        GEMINI_API_KEY = "AIzaSyDcuFHb470LPqZfybM4vFiwH5m9XUhiiBM";
        // Store the default key
        chrome.storage.sync.set({geminiApiKey: GEMINI_API_KEY});
      }
      resolve(GEMINI_API_KEY);
    });
  });
}

// Function to set a new API key
export function setApiKey(newKey) {
  GEMINI_API_KEY = newKey;
  chrome.storage.sync.set({geminiApiKey: newKey});
}

// Export the API key for immediate use (though it might be empty initially)
export { GEMINI_API_KEY };