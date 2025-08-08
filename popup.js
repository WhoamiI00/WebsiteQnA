// Get references to the HTML elements
const questionInput = document.getElementById('question');
const askButton = document.getElementById('ask');
const answerDiv = document.getElementById('answer');
const loader = document.getElementById('loader');
const modelSelect = document.getElementById('modelSelect');
const agentModeToggle = document.getElementById('agentModeToggle');
const agentModeStatus = document.getElementById('agentModeStatus');

// Hard-coded API key - Replace with your actual Gemini API key
const GEMINI_API_KEY = "AIzaSyAXKXQcr4sNmPQO814zkocKctBaeGsELbY";

// Image selection elements
const selectImagesButton = document.getElementById('selectImages');
const imageModal = document.getElementById('imageModal');
const imageGrid = document.getElementById('imageGrid');
const closeModalButton = document.querySelector('.close');
const cancelImageSelectionButton = document.getElementById('cancelImageSelection');
const confirmImageSelectionButton = document.getElementById('confirmImageSelection');
const selectedImagesContainer = document.getElementById('selectedImagesContainer');
const imageCountBadge = document.getElementById('imageCountBadge');

// Store page images and selected images
let pageImages = [];
let selectedImages = [];

// No API key management needed as it's now hard-coded

// --- Model Selection Logic ---

// Add event listener for model selection change
modelSelect.addEventListener('change', () => {
    // You could update UI elements based on the selected model if needed
    console.log(`Model changed to: ${modelSelect.value}`);
    
    // Optional: Display a message about the selected model
    const modelInfo = {
        'gemini-2.5-pro': 'Gemini 2.5 Pro: Best for complex reasoning and high-quality responses',
        'gemini-2.5-flash': 'Gemini 2.5 Flash: Good balance of quality and speed',
        'gemini-2.5-flash-lite': 'Gemini 2.5 Flash-Lite: Optimized for speed and efficiency',
        'gemini-2.0-flash': 'Gemini 2.0 Flash: Legacy model with good general capabilities'
    };
    
    answerDiv.textContent = modelInfo[modelSelect.value] || 'Model selected. Ask a question to get started.';
});

// --- Agent Mode Logic ---

// Add event listener for agent mode toggle
agentModeToggle.addEventListener('change', () => {
    const isAgentMode = agentModeToggle.checked;
    agentModeStatus.textContent = isAgentMode ? 'On' : 'Off';
    
    // Update UI based on agent mode
    if (isAgentMode) {
        questionInput.placeholder = 'Enter a task or question (e.g., "Solve the math problems on this page" or "What is this article about?")...';
        answerDiv.textContent = 'Agent Mode activated. The AI will automatically analyze the page content, including images, and perform web searches if needed.';
    } else {
        questionInput.placeholder = 'e.g., What is the nature of this magic...';
        answerDiv.textContent = 'Standard Mode. Ask a question about the webpage content.';
    }
});

// --- Image Selection Logic ---

// Open the image selection modal
selectImagesButton.addEventListener('click', async () => {
    try {
        // Get the current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Execute the content script to get page content and images
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        const pageData = results[0].result;
        if (!pageData || !pageData.images) {
            throw new Error("Could not retrieve images from the page.");
        }

        // Store the page images
        pageImages = pageData.images;

        // Clear the image grid
        imageGrid.innerHTML = '';

        // Populate the image grid with images from the page
        if (pageImages.length === 0) {
            imageGrid.innerHTML = '<p>No images found on this page.</p>';
        } else {
            pageImages.forEach((image, index) => {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.dataset.index = index;

                // Check if this image is already selected
                if (selectedImages.some(img => img.src === image.src)) {
                    imageItem.classList.add('selected');
                }

                const img = document.createElement('img');
                img.src = image.src;
                img.alt = image.alt || 'Image ' + (index + 1);
                imageItem.appendChild(img);

                // Add click event to select/deselect image
                imageItem.addEventListener('click', () => {
                    imageItem.classList.toggle('selected');
                });

                imageGrid.appendChild(imageItem);
            });
        }

        // Show the modal
        imageModal.style.display = 'block';

    } catch (error) {
        console.error('Error loading images:', error);
        answerDiv.textContent = `Error loading images: ${error.message}`;
    }
});

// Close the modal when clicking the close button
closeModalButton.addEventListener('click', () => {
    imageModal.style.display = 'none';
});

// Close the modal when clicking the cancel button
cancelImageSelectionButton.addEventListener('click', () => {
    imageModal.style.display = 'none';
});

// Confirm image selection
confirmImageSelectionButton.addEventListener('click', () => {
    // Get all selected images
    const selectedElements = imageGrid.querySelectorAll('.image-item.selected');
    
    // Clear the current selection
    selectedImages = [];
    
    // Add the selected images to the array
    selectedElements.forEach(element => {
        const index = parseInt(element.dataset.index);
        if (!isNaN(index) && pageImages[index]) {
            selectedImages.push(pageImages[index]);
        }
    });
    
    // Update the UI to show selected images
    updateSelectedImagesUI();
    
    // Close the modal
    imageModal.style.display = 'none';
});

// Update the UI to show selected images
function updateSelectedImagesUI() {
    // Clear the container
    selectedImagesContainer.innerHTML = '';
    
    // Update the count badge
    if (selectedImages.length > 0) {
        imageCountBadge.textContent = selectedImages.length;
        imageCountBadge.style.display = 'block';
        
        // Add thumbnails for selected images
        selectedImages.forEach((image, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.className = 'selected-image-thumbnail';
            thumbnail.src = image.src;
            thumbnail.alt = image.alt || 'Selected image ' + (index + 1);
            thumbnail.title = 'Click to remove';
            
            // Add click event to remove the image
            thumbnail.addEventListener('click', () => {
                selectedImages.splice(index, 1);
                updateSelectedImagesUI();
            });
            
            selectedImagesContainer.appendChild(thumbnail);
        });
    } else {
        imageCountBadge.style.display = 'none';
    }
}

// --- Main Logic: Asking a Question ---

askButton.addEventListener('click', async () => {
    const question = questionInput.value.trim();

    if (!question) {
        answerDiv.textContent = 'Error: Please enter a question.';
        return;
    }

    // Show loader and disable button
    loader.style.display = 'block';
    answerDiv.style.display = 'none';
    askButton.disabled = true;
    askButton.textContent = 'Thinking...';

    try {
        // 1. Get the current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // 2. Execute the content script to get page content
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        const pageData = results[0].result;
        if (!pageData) {
            throw new Error("Could not retrieve content from the page.");
        }

        // 3. Call the Gemini API with the selected model
        const answer = await callGeminiApi(GEMINI_API_KEY, question, pageData.text, selectedImages);

        // 4. Display the answer
        answerDiv.textContent = answer;

    } catch (error) {
        console.error('Error:', error);
        answerDiv.textContent = `An error occurred: ${error.message}`;
    } finally {
        // Hide loader and re-enable button
        loader.style.display = 'none';
        answerDiv.style.display = 'block';
        askButton.disabled = false;
        askButton.textContent = 'Ask Gemini';
    }
});


// --- Helper Function: Call Gemini API ---

async function callGeminiApi(apiKey, question, context, selectedImages = [], modelName = null) {
    // Get the selected model from the dropdown or use the provided model name
    const model = modelName || modelSelect.value;
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Get appropriate token limits based on the model
    const tokenLimits = getTokenLimitsForModel(model);
    
    // Prepare the prompt text
    const promptText = `Based on the following webpage content${selectedImages.length > 0 ? ' and provided images' : ''}, please provide a concise answer to the user's question. 
    
    IMPORTANT: If the webpage content doesn't contain the answer, use your general knowledge to provide the most accurate and helpful response possible. You should always try to answer the question even if it's not directly related to the webpage content.

    Webpage Content:
    ---
    ${context.substring(0, tokenLimits.inputTokens)}
    ---

    User's Question: "${question}"

    Answer:`;
    
    // Prepare the request body
    const requestBody = {
        contents: [{
            parts: [{ text: promptText }]
        }],
        generationConfig: {
            temperature: 0.7,  // Increased temperature for more creative responses when using general knowledge
            topK: 32,
            topP: 0.95,
            maxOutputTokens: tokenLimits.outputTokens
        }
    };

    // Add images to the request if any are selected
    if (selectedImages.length > 0) {
        // Process all images and add them to the request
        // We need to use Promise.all to handle async operations
        const imagePromises = selectedImages.map(async (image) => {
            let imageData;
            if (image.src.startsWith('data:')) {
                // For data URLs, extract the base64 part
                imageData = image.src.split(',')[1];
            } else {
                // For HTTP URLs, fetch and convert
                imageData = await fetchImageAsBase64(image.src);
            }
            
            return {
                inlineData: {
                    mimeType: 'image/jpeg', // Assuming JPEG, adjust if needed
                    data: imageData
                }
            };
        });
        
        // Wait for all image processing to complete
        const imageParts = await Promise.all(imagePromises);
        
        // Add all image parts to the request
        requestBody.contents[0].parts.push(...imageParts);
    }

    try {
        const response = await fetch(apiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} - ${errorData.error.message}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "No answer was generated. The response might be blocked due to safety settings or other issues.";
        }

    } catch (error) {
        console.error("Failed to call Gemini API:", error);
        throw error; // Re-throw the error to be caught by the main click handler
    }
}

// Helper function to get appropriate token limits based on the model
function getTokenLimitsForModel(model) {
    // Optimized values for Pro subscription
    // Pro subscription allows for maximum token usage across all models
    let inputTokens = 30000;
    let outputTokens = 2048;
    
    // Adjust based on specific model capabilities with Pro subscription optimization
    switch(model) {
        case 'gemini-2.5-pro':
            inputTokens = 1048576; // ~1M tokens (maximum for Pro)
            outputTokens = 8192;   // Maximum output tokens for Pro
            break;
        case 'gemini-2.5-flash':
            inputTokens = 32768;    // Increased for Pro subscription
            outputTokens = 4096;    // Maximum for this model
            break;
        case 'gemini-2.5-flash-lite':
            inputTokens = 16384;    // Increased for Pro subscription
            outputTokens = 2048;    // Maximum for this model
            break;
        case 'gemini-2.0-flash':
            inputTokens = 32768;    // Increased for Pro subscription
            outputTokens = 2048;    // Maximum for this model
            break;
        // Add more models as needed
    }
    
    return { inputTokens, outputTokens };
}

// Helper function to fetch an image and convert it to base64
async function fetchImageAsBase64(imageUrl) {
    try {
        // For security reasons, we can only fetch images from the same origin or CORS-enabled sources
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Extract the base64 data part
                const base64data = reader.result.split(',')[1];
                resolve(base64data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error fetching image:', error);
        throw new Error(`Failed to fetch image: ${error.message}`);
    }
}
