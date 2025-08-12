// agent.js - Advanced AI Agent System for Chrome Extension

/**
 * AI Agent System that can perform actions on webpages
 * Combines AI decision-making with DOM manipulation
 */

class WebPageAgent {
    constructor() {
        this.actionHistory = [];
        this.isRunning = false;
        this.currentTask = null;
    }

    /**
     * Main agent execution function with enhanced page analysis
     */
    async executeTask(task, context, apiKey) {
        this.isRunning = true;
        this.currentTask = task;
        
        try {
            // Step 0: Analyze the rendered page to understand its structure
            const pageAnalysis = this.analyzeRenderedPage();
            console.log('Page analysis:', pageAnalysis);
            
            // Step 1: Analyze the task and page content
            const analysis = await this.analyzeTaskAndPage(task, context, apiKey);
            
            // Step 2: Generate action plan
            const actionPlan = this.parseActionPlan(analysis);
            
            // Step 3: Execute actions
            const results = await this.executeActionPlan(actionPlan);
            
            // Step 4: Verify and report results
            const report = await this.generateReport(task, results, apiKey);
            
            return {
                success: true,
                report: report,
                actionsPerformed: this.actionHistory,
                pageAnalysis: pageAnalysis.summary
            };
            
        } catch (error) {
            console.error('Agent execution error:', error);
            return {
                success: false,
                error: error.message,
                actionsPerformed: this.actionHistory
            };
        } finally {
            this.isRunning = false;
            this.actionHistory = [];
        }
    }
    
    /**
     * Analyze the rendered page to understand its structure
     */
    analyzeRenderedPage() {
        // Collect information about the rendered page
        const interactiveElements = {
            buttons: Array.from(document.querySelectorAll('button, .button, [role="button"]')),
            links: Array.from(document.querySelectorAll('a[href]')),
            inputs: Array.from(document.querySelectorAll('input, textarea, select')),
            forms: Array.from(document.querySelectorAll('form')),
            images: Array.from(document.querySelectorAll('img')).filter(img => {
                const rect = img.getBoundingClientRect();
                return rect.width > 20 && rect.height > 20;
            }),
            voteElements: this.findPotentialVoteElements()
        };
        
        // Determine page type
        let pageType = 'generic';
        if (window.location.hostname.includes('reddit')) {
            pageType = 'reddit';
        } else if (document.querySelectorAll('.question, .quiz, input[type="radio"]').length > 0) {
            pageType = 'quiz';
        } else if (document.querySelectorAll('form').length > 0) {
            pageType = 'form';
        }
        
        // Create a summary of the page
        const summary = {
            pageType: pageType,
            url: window.location.href,
            title: document.title,
            buttonCount: interactiveElements.buttons.length,
            linkCount: interactiveElements.links.length,
            inputCount: interactiveElements.inputs.length,
            formCount: interactiveElements.forms.length,
            imageCount: interactiveElements.images.length,
            voteElementCount: interactiveElements.voteElements.length
        };
        
        return {
            interactiveElements,
            summary
        };
    }
    
    /**
     * Find potential vote elements on the page
     */
    findPotentialVoteElements() {
        let voteElements = [];
        
        // Common vote element selectors
        const selectors = [
            '.upvote', '.vote-up', '.arrow-up',
            '[aria-label*="upvote"]', '[title*="upvote"]',
            '.fa-arrow-up', '.icon-up',
            'button[data-action="upvote"]',
            '.vote.up', '.arrow.up',
            'button[title*="like"]', '.like-button',
            'svg[aria-label*="like"]', 'svg[aria-label*="upvote"]',
            'i.fa-thumbs-up', '[data-testid*="like"]', '[data-testid*="upvote"]'
        ];
        
        // Collect elements matching selectors
        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                voteElements = [...voteElements, ...Array.from(elements)];
            } catch (error) {
                console.warn(`Error with selector ${selector}:`, error);
            }
        });
        
        // Look for SVG icons that might be upvote buttons
        if (window.location.hostname.includes('reddit')) {
            const svgElements = document.querySelectorAll('svg');
            for (const svg of svgElements) {
                const postContainer = svg.closest('.Post') || svg.closest('[data-testid="post"]');
                if (postContainer) {
                    const rect = svg.getBoundingClientRect();
                    const postRect = postContainer.getBoundingClientRect();
                    if (rect.left < postRect.left + 50) { // Usually upvote buttons are on the left
                        voteElements.push(svg);
                    }
                }
            }
        }
        
        return voteElements;
    }

    /**
     * Analyze task and page content using AI
     */
    async analyzeTaskAndPage(task, context, apiKey) {
        const analysisPrompt = `
You are an AI web automation agent. Analyze the following task and webpage content, then provide a detailed action plan.

TASK: "${task}"

WEBPAGE CONTENT:
${context.substring(0, 50000)}

Your response should be in the following JSON format:
{
    "taskType": "quiz|voting|form|navigation|interaction|search|other",
    "confidence": 0.9,
    "actions": [
        {
            "type": "click|select|type|scroll|wait|extract",
            "selector": "CSS selector or description",
            "value": "value to input (if applicable)",
            "description": "What this action does",
            "waitFor": "optional selector to wait for after action"
        }
    ],
    "reasoning": "Explanation of the approach"
}

IMPORTANT RULES:
1. Be specific with CSS selectors when possible
2. For quiz/questions: look for radio buttons, checkboxes, or select elements
3. For voting: look for upvote/downvote buttons, heart icons, etc.
4. For forms: identify input fields, textareas, submit buttons
5. Break complex tasks into smaller, sequential actions
6. Include wait/delay actions when needed for page loading

Example selectors:
- Questions: "input[type='radio']", ".question-option", "[data-answer]"
- Voting: ".upvote", ".vote-up", "[aria-label*='upvote']", ".heart-button"
- Forms: "input[type='text']", "textarea", "button[type='submit']"
- Navigation: "a[href*='next']", ".pagination .next"
`;

        return await this.callGeminiAPI(analysisPrompt, apiKey);
    }

    /**
     * Parse the AI response into actionable steps
     */
    parseActionPlan(aiResponse) {
        try {
            // Clean the response to extract JSON
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in AI response');
            }
            
            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error('Error parsing action plan:', error);
            // Fallback: try to extract actions from text
            return this.parseActionPlanFromText(aiResponse);
        }
    }

    /**
     * Fallback parser for non-JSON responses
     */
    parseActionPlanFromText(text) {
        const actions = [];
        const lines = text.split('\n');
        
        for (let line of lines) {
            line = line.trim().toLowerCase();
            if (line.includes('click') || line.includes('select') || line.includes('type')) {
                actions.push({
                    type: 'manual_parse',
                    description: line,
                    selector: null
                });
            }
        }
        
        return {
            taskType: 'other',
            confidence: 0.5,
            actions: actions,
            reasoning: 'Fallback parsing used'
        };
    }

    /**
     * Execute the planned actions on the webpage
     */
    async executeActionPlan(actionPlan) {
        const results = [];
        
        console.log('Executing action plan:', actionPlan);
        
        for (let i = 0; i < actionPlan.actions.length; i++) {
            const action = actionPlan.actions[i];
            
            try {
                const result = await this.executeAction(action);
                results.push(result);
                this.actionHistory.push({
                    action: action,
                    result: result,
                    timestamp: new Date().toISOString()
                });
                
                // Wait between actions to avoid overwhelming the page
                await this.wait(500);
                
            } catch (error) {
                console.error(`Error executing action ${i}:`, error);
                results.push({
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    /**
     * Execute a single action
     */
    async executeAction(action) {
        switch (action.type) {
            case 'click':
                return await this.performClick(action.selector, action.description);
            
            case 'select':
                return await this.performSelect(action.selector, action.value, action.description);
            
            case 'type':
                return await this.performType(action.selector, action.value, action.description);
            
            case 'scroll':
                return await this.performScroll(action.value);
            
            case 'wait':
                return await this.performWait(action.value);
            
            case 'extract':
                return await this.extractData(action.selector, action.description);
            
            default:
                return await this.performSmartAction(action);
        }
    }

    /**
     * Perform click action
     */
    async performClick(selector, description) {
        const elements = this.findElements(selector, description);
        
        if (elements.length === 0) {
            throw new Error(`No elements found for: ${selector || description}`);
        }
        
        let clickedCount = 0;
        
        for (let element of elements) {
            try {
                // Scroll element into view
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.wait(200);
                
                // Check if element is clickable
                if (this.isElementClickable(element)) {
                    element.click();
                    clickedCount++;
                    await this.wait(300); // Wait for any animations or responses
                }
            } catch (error) {
                console.warn('Failed to click element:', error);
            }
        }
        
        return {
            success: true,
            action: 'click',
            elementsFound: elements.length,
            elementsClicked: clickedCount,
            description: description
        };
    }

    /**
     * Perform select action (for dropdowns, radio buttons, checkboxes)
     */
    async performSelect(selector, value, description) {
        const elements = this.findElements(selector, description);
        
        if (elements.length === 0) {
            throw new Error(`No elements found for: ${selector || description}`);
        }
        
        let selectedCount = 0;
        
        for (let element of elements) {
            try {
                if (element.type === 'radio' || element.type === 'checkbox') {
                    if (!element.checked) {
                        element.click();
                        selectedCount++;
                    }
                } else if (element.tagName === 'SELECT') {
                    if (value) {
                        element.value = value;
                        element.dispatchEvent(new Event('change'));
                        selectedCount++;
                    }
                }
                await this.wait(200);
            } catch (error) {
                console.warn('Failed to select element:', error);
            }
        }
        
        return {
            success: true,
            action: 'select',
            elementsFound: elements.length,
            elementsSelected: selectedCount,
            description: description
        };
    }

    /**
     * Perform type action
     */
    async performType(selector, value, description) {
        const elements = this.findElements(selector, description);
        
        if (elements.length === 0) {
            throw new Error(`No elements found for: ${selector || description}`);
        }
        
        let typedCount = 0;
        
        for (let element of elements) {
            try {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.focus();
                    element.value = value;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    typedCount++;
                    await this.wait(200);
                }
            } catch (error) {
                console.warn('Failed to type in element:', error);
            }
        }
        
        return {
            success: true,
            action: 'type',
            elementsFound: elements.length,
            elementsTyped: typedCount,
            value: value,
            description: description
        };
    }

    /**
     * Smart element finding with fallback strategies
     */
    findElements(selector, description) {
        let elements = [];
        
        // Strategy 1: Direct selector
        if (selector) {
            try {
                elements = Array.from(document.querySelectorAll(selector));
                if (elements.length > 0) return elements;
            } catch (error) {
                console.warn('Direct selector failed:', selector);
            }
        }
        
        // Strategy 2: Description-based finding
        if (description) {
            elements = this.findElementsByDescription(description);
            if (elements.length > 0) return elements;
        }
        
        // Strategy 3: Common patterns based on task type
        elements = this.findElementsByCommonPatterns(description);
        
        // Strategy 4: Advanced DOM analysis for complex cases
        if (elements.length === 0 && description) {
            elements = this.findElementsByAdvancedAnalysis(description);
        }
        
        return elements;
    }
    
    /**
     * Advanced DOM analysis for complex element finding
     */
    findElementsByAdvancedAnalysis(description) {
        const desc = (description || '').toLowerCase();
        let candidates = [];
        
        // Look for elements with matching text content
        const textNodes = document.evaluate(
            `//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${desc}')]`,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
        );
        
        for (let i = 0; i < textNodes.snapshotLength; i++) {
            candidates.push(textNodes.snapshotItem(i));
        }
        
        // Look for elements with matching attributes
        ['aria-label', 'title', 'placeholder', 'name', 'id', 'alt'].forEach(attr => {
            document.querySelectorAll(`[${attr}]`).forEach(el => {
                if (el[attr].toLowerCase().includes(desc)) {
                    candidates.push(el);
                }
            });
        });
        
        return candidates;
    }

    /**
     * Find elements by text description
     */
    findElementsByDescription(description) {
        const desc = description.toLowerCase();
        let elements = [];
        
        // For voting/upvoting
        if (desc.includes('upvote') || desc.includes('vote up')) {
            elements = Array.from(document.querySelectorAll([
                '.upvote', '.vote-up', '.arrow-up', 
                '[aria-label*="upvote"]', '[title*="upvote"]',
                '.fa-arrow-up', '.icon-up', 'button[data-action="upvote"]'
            ].join(', ')));
        }
        
        // For questions/answers
        else if (desc.includes('question') || desc.includes('answer') || desc.includes('quiz')) {
            elements = Array.from(document.querySelectorAll([
                'input[type="radio"]', 'input[type="checkbox"]',
                '.question-option', '.answer-choice', '.quiz-option',
                '[data-answer]', '.option', '.choice'
            ].join(', ')));
        }
        
        // For posts
        else if (desc.includes('post')) {
            elements = Array.from(document.querySelectorAll([
                '.post', '[data-post]', '.entry', '.item',
                '.content-item', 'article'
            ].join(', ')));
        }
        
        // For buttons
        else if (desc.includes('button') || desc.includes('click')) {
            elements = Array.from(document.querySelectorAll('button, .button, [role="button"]'));
        }
        
        return elements;
    }

    /**
     * Find elements by common patterns
     */
    findElementsByCommonPatterns(description) {
        const desc = (description || '').toLowerCase();
        
        // Reddit-specific patterns
        if (window.location.hostname.includes('reddit')) {
            if (desc.includes('upvote')) {
                return Array.from(document.querySelectorAll([
                    '.upvote', '[aria-label*="upvote"]', 
                    '.arrow.up', '.vote.up'
                ].join(', ')));
            }
            if (desc.includes('post')) {
                return Array.from(document.querySelectorAll('.Post, [data-testid="post"]'));
            }
        }
        
        // Quiz/form patterns
        if (desc.includes('question') || desc.includes('answer')) {
            return Array.from(document.querySelectorAll([
                'input[type="radio"]', 'input[type="checkbox"]',
                '.question', '.quiz-question', '[data-question]'
            ].join(', ')));
        }
        
        return [];
    }

    /**
     * Check if element is clickable
     */
    isElementClickable(element) {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return (
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.pointerEvents !== 'none' &&
            rect.width > 0 &&
            rect.height > 0 &&
            !element.disabled
        );
    }

    /**
     * Smart action execution for complex cases
     */
    async performSmartAction(action) {
        const description = (action.description || '').toLowerCase();
        
        // Handle specific task patterns
        if (description.includes('first') && description.includes('posts')) {
            return await this.handleFirstNPosts(action);
        }
        
        if (description.includes('correct answer') || description.includes('all questions')) {
            return await this.handleQuizQuestions(action);
        }
        
        return {
            success: false,
            error: 'Unknown action type: ' + action.type
        };
    }

    /**
     * Handle "first N posts" type actions with enhanced vote detection
     */
    async handleFirstNPosts(action) {
        const description = action.description.toLowerCase();
        const numberMatch = description.match(/(\d+)/);
        const count = numberMatch ? parseInt(numberMatch[1]) : 5;
        
        // Find posts
        const posts = this.findElementsByDescription('post');
        const targetPosts = posts.slice(0, count);
        
        let processedCount = 0;
        
        for (let post of targetPosts) {
            try {
                // Find upvote button within this post using multiple strategies
                let upvoteButton = post.querySelector([
                    '.upvote', '.vote-up', '.arrow-up',
                    '[aria-label*="upvote"]', '[title*="upvote"]',
                    '.fa-arrow-up', '.icon-up', 'button[data-action="upvote"]',
                    '.vote.up', '.arrow.up',
                    'button[title*="like"]', '.like-button',
                    'svg[aria-label*="like"]', 'svg[aria-label*="upvote"]',
                    'i.fa-thumbs-up', '[data-testid*="like"]', '[data-testid*="upvote"]'
                ].join(', '));
                
                // If no upvote button found, try to find by visual analysis
                if (!upvoteButton) {
                    // Look for small, square-ish elements that might be vote buttons
                    const potentialButtons = Array.from(post.querySelectorAll('*')).filter(el => {
                        if (!this.isElementClickable(el)) return false;
                        
                        const rect = el.getBoundingClientRect();
                        if (rect.width === 0 || rect.height === 0) return false;
                        
                        // Check if element is small and square-ish (like vote buttons often are)
                        const isSquarish = Math.abs(rect.width - rect.height) < 10 && rect.width < 50 && rect.height < 50;
                        
                        // Check if element contains arrow-like SVG or icon
                        const hasArrowIcon = el.querySelector('svg, i[class*="arrow"], i[class*="vote"], i[class*="thumb"]');
                        
                        return isSquarish || hasArrowIcon;
                    });
                    
                    if (potentialButtons.length > 0) {
                        upvoteButton = potentialButtons[0];
                    }
                }
                
                if (upvoteButton && this.isElementClickable(upvoteButton)) {
                    // Highlight the button before clicking for visual feedback
                    const originalStyle = upvoteButton.style.cssText;
                    upvoteButton.style.cssText += 'outline: 3px solid red !important; background-color: rgba(255, 0, 0, 0.2) !important;';
                    await this.wait(300);
                    
                    upvoteButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await this.wait(300);
                    upvoteButton.click();
                    processedCount++;
                    
                    // Restore original style
                    await this.wait(300);
                    upvoteButton.style.cssText = originalStyle;
                    
                    await this.wait(500);
                }
            } catch (error) {
                console.warn('Failed to process post:', error);
            }
        }
        
        return {
            success: true,
            action: 'process_posts',
            postsFound: posts.length,
            postsProcessed: processedCount,
            description: action.description
        };
    }

    /**
     * Handle quiz/question answering
     */
    async handleQuizQuestions(action) {
        const questions = document.querySelectorAll([
            '.question', '.quiz-question', '[data-question]',
            'input[type="radio"]', 'input[type="checkbox"]'
        ].join(', '));
        
        let answeredCount = 0;
        
        for (let question of questions) {
            try {
                // For radio buttons/checkboxes, click the first available option
                if (question.type === 'radio' || question.type === 'checkbox') {
                    if (!question.checked) {
                        question.click();
                        answeredCount++;
                        await this.wait(300);
                    }
                }
                // For question containers, find the first answer option
                else {
                    const answerOptions = question.querySelectorAll([
                        'input[type="radio"]', 'input[type="checkbox"]',
                        '.answer-option', '.option', '.choice'
                    ].join(', '));
                    
                    if (answerOptions.length > 0) {
                        answerOptions[0].click();
                        answeredCount++;
                        await this.wait(300);
                    }
                }
            } catch (error) {
                console.warn('Failed to answer question:', error);
            }
        }
        
        return {
            success: true,
            action: 'answer_questions',
            questionsFound: questions.length,
            questionsAnswered: answeredCount,
            description: action.description
        };
    }

    /**
     * Wait utility
     */
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate final report
     */
    async generateReport(originalTask, results, apiKey) {
        const reportPrompt = `
Task: "${originalTask}"

Results: ${JSON.stringify(results, null, 2)}

Action History: ${JSON.stringify(this.actionHistory, null, 2)}

Please provide a concise summary report of what was accomplished, including:
1. What actions were performed
2. How many elements were affected
3. Any issues encountered
4. Overall success status

Keep the report under 200 words.
`;

        try {
            return await this.callGeminiAPI(reportPrompt, apiKey);
        } catch (error) {
            return `Task completed. ${results.length} actions attempted. Check console for details.`;
        }
    }

    /**
     * Call Gemini API
     */
    async callGeminiAPI(prompt, apiKey) {
        const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        try {
            const response = await fetch(apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 4096
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('No valid response from API');
            }

        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }

    /**
     * Extract data from elements
     */
    async extractData(selector, description) {
        const elements = this.findElements(selector, description);
        
        const data = elements.map((el, index) => ({
            index: index,
            tagName: el.tagName,
            text: el.textContent?.trim(),
            value: el.value,
            checked: el.checked,
            href: el.href,
            src: el.src,
            id: el.id,
            className: el.className
        }));
        
        return {
            success: true,
            action: 'extract',
            elementsFound: elements.length,
            data: data,
            description: description
        };
    }

    /**
     * Scroll to element or position
     */
    async performScroll(target) {
        if (typeof target === 'number') {
            window.scrollBy(0, target);
        } else if (typeof target === 'string') {
            const element = document.querySelector(target);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        return {
            success: true,
            action: 'scroll',
            target: target
        };
    }

    /**
     * Wait for a specific time or element
     */
    async performWait(target) {
        if (typeof target === 'number') {
            await this.wait(target);
        } else if (typeof target === 'string') {
            // Wait for element to appear
            let attempts = 0;
            while (attempts < 20) {
                if (document.querySelector(target)) {
                    break;
                }
                await this.wait(500);
                attempts++;
            }
        }
        
        return {
            success: true,
            action: 'wait',
            target: target
        };
    }
}

// Export for use in content script
if (typeof window !== 'undefined') {
    window.WebPageAgent = WebPageAgent;
}

// Initialize agent when script loads
(() => {
    if (typeof window !== 'undefined' && !window.webPageAgent) {
        window.webPageAgent = new WebPageAgent();
        console.log('WebPageAgent initialized');
    }
})();