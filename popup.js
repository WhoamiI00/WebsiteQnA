// Updated popup.js with enhanced Agent Mode capabilities

// Get references to the HTML elements
const questionInput = document.getElementById('question');
const askButton = document.getElementById('ask');
const answerDiv = document.getElementById('answer');
const loader = document.getElementById('loader');
const modelSelect = document.getElementById('modelSelect');
const agentModeToggle = document.getElementById('agentModeToggle');
const agentModeStatus = document.getElementById('agentModeStatus');

// Hard-coded API key - Replace with your actual Gemini API key
const GEMINI_API_KEY = "AIzaSyC9dSxnhfFUfubnDPjVJBPq6XnUHdUutPc";

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

// --- Model Selection Logic ---

modelSelect.addEventListener('change', () => {
    console.log(`Model changed to: ${modelSelect.value}`);
    
    const modelInfo = {
        'gemini-2.5-pro': 'Gemini 2.5 Pro: Best for complex reasoning and high-quality responses',
        'gemini-2.5-flash': 'Gemini 2.5 Flash: Good balance of quality and speed',
        'gemini-2.5-flash-lite': 'Gemini 2.5 Flash-Lite: Optimized for speed and efficiency',
        'gemini-2.0-flash': 'Gemini 2.0 Flash: Legacy model with good general capabilities'
    };
    
    answerDiv.textContent = modelInfo[modelSelect.value] || 'Model selected. Ask a question to get started.';
});

// --- Enhanced Agent Mode Logic ---

agentModeToggle.addEventListener('change', () => {
    const isAgentMode = agentModeToggle.checked;
    agentModeStatus.textContent = isAgentMode ? 'On' : 'Off';
    
    if (isAgentMode) {
        questionInput.placeholder = 'Enter a task (e.g., "Answer all quiz questions", "Upvote the first 5 posts", "Fill out this form")...';
        answerDiv.innerHTML = `
            <strong>🤖 Agent Mode Activated</strong><br>
            The AI will:<br>
            • Analyze the webpage content<br>
            • Perform actions automatically<br>
            • Click buttons, select answers, fill forms<br>
            • Provide detailed reports of actions taken<br><br>
            <em>Enter a task above and click "Execute Agent"</em>
        `;
        askButton.textContent = 'Execute Agent';
        askButton.style.background = 'linear-gradient(145deg, #e74c3c, #c0392b)';
    } else {
        questionInput.placeholder = 'e.g., What is this article about?';
        answerDiv.textContent = 'Standard Mode. Ask a question about the webpage content.';
        askButton.textContent = 'Ask Gemini';
        askButton.style.background = 'linear-gradient(145deg, var(--accent-blue), var(--accent-blue-dark))';
    }
});

// --- Image Selection Logic (unchanged) ---

selectImagesButton.addEventListener('click', async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        const pageData = results[0].result;
        if (!pageData || !pageData.images) {
            throw new Error("Could not retrieve images from the page.");
        }

        pageImages = pageData.images;
        imageGrid.innerHTML = '';

        if (pageImages.length === 0) {
            imageGrid.innerHTML = '<p>No images found on this page.</p>';
        } else {
            pageImages.forEach((image, index) => {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.dataset.index = index;

                if (selectedImages.some(img => img.src === image.src)) {
                    imageItem.classList.add('selected');
                }

                const img = document.createElement('img');
                img.src = image.src;
                img.alt = image.alt || 'Image ' + (index + 1);
                imageItem.appendChild(img);

                imageItem.addEventListener('click', () => {
                    imageItem.classList.toggle('selected');
                });

                imageGrid.appendChild(imageItem);
            });
        }

        imageModal.style.display = 'block';

    } catch (error) {
        console.error('Error loading images:', error);
        answerDiv.textContent = `Error loading images: ${error.message}`;
    }
});

closeModalButton.addEventListener('click', () => {
    imageModal.style.display = 'none';
});

cancelImageSelectionButton.addEventListener('click', () => {
    imageModal.style.display = 'none';
});

confirmImageSelectionButton.addEventListener('click', () => {
    const selectedElements = imageGrid.querySelectorAll('.image-item.selected');
    selectedImages = [];
    
    selectedElements.forEach(element => {
        const index = parseInt(element.dataset.index);
        if (!isNaN(index) && pageImages[index]) {
            selectedImages.push(pageImages[index]);
        }
    });
    
    updateSelectedImagesUI();
    imageModal.style.display = 'none';
});

function updateSelectedImagesUI() {
    selectedImagesContainer.innerHTML = '';
    
    if (selectedImages.length > 0) {
        imageCountBadge.textContent = selectedImages.length;
        imageCountBadge.style.display = 'block';
        
        selectedImages.forEach((image, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.className = 'selected-image-thumbnail';
            thumbnail.src = image.src;
            thumbnail.alt = image.alt || 'Selected image ' + (index + 1);
            thumbnail.title = 'Click to remove';
            
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

// --- Enhanced Main Logic with Agent Execution ---

askButton.addEventListener('click', async () => {
    const question = questionInput.value.trim();
    const isAgentMode = agentModeToggle.checked;

    if (!question) {
        answerDiv.innerHTML = `<span style="color: red;">Error: Please enter a ${isAgentMode ? 'task' : 'question'}.</span>`;
        return;
    }

    // Show enhanced loader
    loader.style.display = 'block';
    answerDiv.style.display = 'none';
    askButton.disabled = true;
    askButton.textContent = isAgentMode ? '🤖 Agent Working...' : '🤔 Thinking...';

    try {
        // Get the current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Execute the enhanced content script
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        const pageData = results[0].result;
        if (!pageData) {
            throw new Error("Could not retrieve content from the page.");
        }

        let answer;
        
        if (isAgentMode) {
            // Execute agent task
            answer = await executeAgentTask(tab.id, question, pageData);
        } else {
            // Regular Q&A mode
            answer = await callGeminiApi(GEMINI_API_KEY, question, pageData.text, selectedImages);
        }

        // Display the answer with enhanced formatting
        if (isAgentMode) {
            displayAgentResult(answer);
        } else {
            answerDiv.textContent = answer;
        }

    } catch (error) {
        console.error('Error:', error);
        answerDiv.innerHTML = `<span style="color: red;">An error occurred: ${error.message}</span>`;
    } finally {
        // Hide loader and re-enable button
        loader.style.display = 'none';
        answerDiv.style.display = 'block';
        askButton.disabled = false;
        
        const isAgentMode = agentModeToggle.checked;
        askButton.textContent = isAgentMode ? 'Execute Agent' : 'Ask Gemini';
    }
});

// --- New Agent Execution Function ---

async function executeAgentTask(tabId, task, pageData) {
    try {
        console.log('Executing agent task:', task);
        
        // Inject and execute the agent task
        const agentResults = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: async (taskDescription) => {
                // This function runs in the context of the webpage
                if (window.webPageAgent) {
                    const result = await window.webPageAgent.executeTask(taskDescription, {
                        text: document.body.innerText,
                        url: window.location.href
                    }, null); // API key not needed for client-side actions
                    
                    return result;
                } else {
                    return {
                        success: false,
                        error: 'Agent not available on this page'
                    };
                }
            },
            args: [task]
        });

        const result = agentResults[0].result;
        
        if (!result.success) {
            throw new Error(result.error || 'Agent execution failed');
        }

        return result;
        
    } catch (error) {
        console.error('Agent execution error:', error);
        return {
            success: false,
            error: error.message,
            report: `Failed to execute agent task: ${error.message}`
        };
    }
}

// --- Enhanced Display Function for Agent Results ---

function displayAgentResult(result) {
    let html = '';
    
    if (result.success) {
        html += `<div style="color: green; font-weight: bold; margin-bottom: 10px;">
            ✅ Task Completed Successfully
        </div>`;
        
        if (result.taskType) {
            html += `<div style="margin-bottom: 8px;">
                <strong>Task Type:</strong> ${result.taskType.charAt(0).toUpperCase() + result.taskType.slice(1)}
            </div>`;
        }
        
        if (result.actionsPerformed) {
            html += `<div style="margin-bottom: 8px;">
                <strong>Actions Performed:</strong> ${result.actionsPerformed}
            </div>`;
        }
        
        if (result.results && result.results.length > 0) {
            html += '<div style="margin: 10px 0;"><strong>Details:</strong><ul style="margin: 5px 0; padding-left: 20px;">';
            
            result.results.forEach(res => {
                Object.keys(res).forEach(key => {
                    if (key !== 'action') {
                        html += `<li>${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${res[key]}</li>`;
                    }
                });
            });
            
            html += '</ul></div>';
        }
        
        if (result.report) {
            html += `<div style="margin-top: 12px; padding: 10px; background-color: #f8f9fc; border-left: 3px solid var(--accent-blue); font-size: 13px;">
                <strong>Agent Report:</strong><br>
                ${result.report.replace(/\n/g, '<br>')}
            </div>`;
        }
        
    } else {
        html += `<div style="color: red; font-weight: bold; margin-bottom: 10px;">
            ❌ Task Failed
        </div>`;
        
        if (result.error) {
            html += `<div style="color: red; margin-bottom: 8px;">
                <strong>Error:</strong> ${result.error}
            </div>`;
        }
        
        if (result.actionsPerformed) {
            html += `<div style="margin-bottom: 8px;">
                <strong>Actions Attempted:</strong> ${result.actionsPerformed}
            </div>`;
        }
    }
    
    answerDiv.innerHTML = html;
}

// --- Helper Function: Call Gemini API (unchanged but optimized) ---

async function callGeminiApi(apiKey, question, context, selectedImages = [], modelName = null) {
    const model = modelName || modelSelect.value;
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const tokenLimits = getTokenLimitsForModel(model);
    const isAgentMode = agentModeToggle.checked;
    
    let promptText;
    
    if (isAgentMode) {
        promptText = `You are an advanced AI agent analyzing webpage content. The user has requested: "${question}". 
        
        Based on the webpage content below, provide a detailed analysis and action plan:
        
        Webpage Content:
        ---
        ${context.substring(0, tokenLimits.inputTokens)}
        ---

        Provide your analysis and recommendations for completing this task.`;  
    } else {
        promptText = `Based on the following webpage content${selectedImages.length > 0 ? ' and provided images' : ''}, please answer the user's question: "${question}"

        Webpage Content:
        ---
        ${context.substring(0, tokenLimits.inputTokens)}
        ---

        Answer:`;
    }
    
    const requestBody = {
        contents: [{
            parts: [{ text: promptText }]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: tokenLimits.outputTokens
        }
    };

    if (selectedImages.length > 0) {
        const imagePromises = selectedImages.map(async (image) => {
            let imageData;
            if (image.src.startsWith('data:')) {
                imageData = image.src.split(',')[1];
            } else {
                imageData = await fetchImageAsBase64(image.src);
            }
            
            return {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageData
                }
            };
        });
        
        const imageParts = await Promise.all(imagePromises);
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
            return "No answer was generated. The response might be blocked due to safety settings.";
        }

    } catch (error) {
        console.error("Failed to call Gemini API:", error);
        throw error;
    }
}

function getTokenLimitsForModel(model) {
    let inputTokens = 30000;
    let outputTokens = 2048;
    
    switch(model) {
        case 'gemini-2.5-pro':
            inputTokens = 1048576;
            outputTokens = 8192;
            break;
        case 'gemini-2.5-flash':
            inputTokens = 32768;
            outputTokens = 4096;
            break;
        case 'gemini-2.5-flash-lite':
            inputTokens = 16384;
            outputTokens = 2048;
            break;
        case 'gemini-2.0-flash':
            inputTokens = 32768;
            outputTokens = 2048;
            break;
    }
    
    return { inputTokens, outputTokens };
}

async function fetchImageAsBase64(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
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