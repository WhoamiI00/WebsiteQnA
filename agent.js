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
     * Implements the core workflow architecture
     */
    async executeTask(task, context, apiKey) {
        this.isRunning = true;
        this.currentTask = task;
        
        try {
            // Phase 1: Enhanced Analysis
            const pageAnalysis = this.analyzeRenderedPage();
            console.log('Page analysis:', pageAnalysis);
            
            // Phase 1: Query Understanding (Gemini API Call #1)
            const analysis = await this.analyzeTaskWithGemini(task, context, apiKey);
            
            // Phase 2: Intelligent Planning
            const actionPlan = await this.createDetailedPlan(analysis, apiKey);
            
            // Phase 3: Smart Execution
            const results = await this.executeWithIntelligence(actionPlan);
            
            // Phase 4: Verification
            const verification = await this.verifyCompletion(task, results, apiKey);
            
            // Phase 5: Reporting
            const report = this.generateComprehensiveReport(verification);
            
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
     * Enhanced context gathering as per workflow
     */
    analyzeRenderedPage() {
        // Collect information about the rendered page using enhanced context gathering
        const contextData = {
            pageContent: {
                text: document.body.innerText,
                url: window.location.href,
                title: document.title,
                siteType: this.detectSiteType()
            },
            availableElements: {
                buttons: this.getClickableElements('button'),
                inputs: this.getInteractiveInputs(),
                forms: this.getFormElements(),
                links: this.getNavigationLinks(),
                customElements: this.getSiteSpecificElements()
            },
            pageState: this.getCurrentPageState()
        };
        
        // Create a summary of the page
        const summary = {
            pageType: contextData.pageContent.siteType,
            url: contextData.pageContent.url,
            title: contextData.pageContent.title,
            buttonCount: contextData.availableElements.buttons.length,
            linkCount: contextData.availableElements.links.length,
            inputCount: contextData.availableElements.inputs.length,
            formCount: contextData.availableElements.forms.length,
            customElementCount: contextData.availableElements.customElements.length
        };
        
        return {
            contextData,
            summary
        };
    }
    
    /**
     * Detect the type of website based on content and structure
     */
    detectSiteType() {
        let siteType = 'generic';
        
        if (window.location.hostname.includes('reddit')) {
            siteType = 'reddit';
        } else if (document.querySelectorAll('.question, .quiz, input[type="radio"]').length > 0) {
            siteType = 'quiz';
        } else if (document.querySelectorAll('form').length > 0) {
            siteType = 'form';
        } else if (document.querySelectorAll('article, .post, .thread').length > 0) {
            siteType = 'content';
        } else if (document.querySelectorAll('table, .table, [role="grid"]').length > 0) {
            siteType = 'data';
        }
        
        return siteType;
    }
    
    /**
     * Get all clickable elements on the page
     */
    getClickableElements(type) {
        let elements = [];
        
        switch(type) {
            case 'button':
                elements = Array.from(document.querySelectorAll('button, .button, [role="button"], input[type="button"], input[type="submit"]'));
                break;
            default:
                elements = Array.from(document.querySelectorAll('button, .button, [role="button"], input[type="button"], input[type="submit"]'));
        }
        
        return elements.map(el => ({
            element: el,
            text: el.innerText || el.value || '',
            selector: this.generateSelector(el),
            visible: this.isElementVisible(el),
            position: el.getBoundingClientRect()
        }));
    }
    
    /**
     * Get all interactive input elements
     */
    getInteractiveInputs() {
        const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
        
        return inputs.map(input => ({
            element: input,
            type: input.type || 'text',
            name: input.name || '',
            id: input.id || '',
            placeholder: input.placeholder || '',
            value: input.value || '',
            selector: this.generateSelector(input),
            required: input.required,
            disabled: input.disabled,
            visible: this.isElementVisible(input)
        }));
    }
    
    /**
     * Get all form elements
     */
    getFormElements() {
        const forms = Array.from(document.querySelectorAll('form'));
        
        return forms.map(form => ({
            element: form,
            id: form.id || '',
            action: form.action || '',
            method: form.method || 'get',
            selector: this.generateSelector(form),
            inputs: Array.from(form.querySelectorAll('input, textarea, select')).map(input => ({
                element: input,
                type: input.type || 'text',
                name: input.name || '',
                id: input.id || '',
                value: input.value || '',
                required: input.required
            }))
        }));
    }
    
    /**
     * Get all navigation links
     */
    getNavigationLinks() {
        const links = Array.from(document.querySelectorAll('a[href]'));
        
        return links.map(link => ({
            element: link,
            text: link.innerText || '',
            href: link.href || '',
            selector: this.generateSelector(link),
            visible: this.isElementVisible(link)
        }));
    }
    
    /**
     * Get site-specific elements based on the detected site type
     */
    getSiteSpecificElements() {
        const siteType = this.detectSiteType();
        let elements = [];
        
        switch(siteType) {
            case 'reddit':
                elements = Array.from(document.querySelectorAll('.Post, .Comment, .vote-arrow, .upvote, .downvote'));
                break;
            case 'quiz':
                elements = Array.from(document.querySelectorAll('.question, .option, .answer, input[type="radio"], input[type="checkbox"]'));
                break;
            case 'form':
                // Already covered by getFormElements()
                break;
            case 'content':
                elements = Array.from(document.querySelectorAll('article, .post, .content, .main-content'));
                break;
            case 'data':
                elements = Array.from(document.querySelectorAll('table, .table, [role="grid"], th, td'));
                break;
            default:
                // No specific elements
        }
        
        return elements.map(el => ({
            element: el,
            text: el.innerText || '',
            selector: this.generateSelector(el),
            visible: this.isElementVisible(el)
        }));
    }
    
    /**
     * Get the current state of the page
     */
    getCurrentPageState() {
        return {
            url: window.location.href,
            title: document.title,
            scrollPosition: {
                x: window.scrollX,
                y: window.scrollY
            },
            viewportSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Generate a unique selector for an element
     */
    generateSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }
        
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\s+/);
            if (classes.length > 0) {
                return `.${classes.join('.')}`;
            }
        }
        
        // Fallback to a more complex selector
        let selector = element.tagName.toLowerCase();
        let parent = element.parentElement;
        let depth = 0;
        
        while (parent && depth < 3) {
            const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
            if (siblings.length > 1) {
                const index = siblings.indexOf(element);
                selector = `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
            }
            
            if (parent.id) {
                return `#${parent.id} > ${selector}`;
            }
            
            if (parent.className && typeof parent.className === 'string') {
                const classes = parent.className.trim().split(/\s+/);
                if (classes.length > 0) {
                    return `.${classes.join('.')} > ${selector}`;
                }
            }
            
            parent = parent.parentElement;
            depth++;
        }
        
        return selector;
    }
    
    /**
     * Check if an element is visible on the page
     */
    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            rect.top < window.innerHeight &&
            rect.left < window.innerWidth &&
            getComputedStyle(element).visibility !== 'hidden' &&
            getComputedStyle(element).display !== 'none'
        );
    }
    
    /**
     * Enhanced Gemini API Integration Methods
     */
    
    /**
     * Analyze task with Gemini API (Phase 1: Query Understanding)
     */
    async analyzeTaskWithGemini(task, context, apiKey) {
        const analysisPrompt = this.buildAnalysisPrompt(task, context);
        const response = await this.callGeminiAPI(analysisPrompt, apiKey);
        return this.parseAnalysisResponse(response);
    }
    
    /**
     * Create detailed action plan with Gemini API (Phase 2: Intelligent Planning)
     */
    async createDetailedPlan(analysis, apiKey) {
        const planningPrompt = this.buildPlanningPrompt(analysis);
        const response = await this.callGeminiAPI(planningPrompt, apiKey);
        return this.parseActionPlan(response);
    }
    
    /**
     * Verify task completion with Gemini API (Phase 4: Verification)
     */
    async verifyCompletion(task, results, apiKey) {
        const verificationPrompt = this.buildVerificationPrompt(task, results);
        const response = await this.callGeminiAPI(verificationPrompt, apiKey);
        return this.parseVerificationResult(response);
    }
    
    /**
     * Build analysis prompt for Gemini API
     */
    buildAnalysisPrompt(task, context) {
        return `
        You are an AI web automation specialist. Analyze this task and webpage:

        TASK: "${task}"
        WEBPAGE: ${JSON.stringify(context)}

        Classify the task type and provide a structured analysis:
        1. Task Category: [quiz, voting, form_filling, navigation, data_extraction, interaction, complex]
        2. Confidence Level: [0-1]
        3. Required Actions: [list of high-level actions]
        4. Prerequisites: [any conditions that must be met]
        5. Success Criteria: [how to determine if task completed successfully]
        6. Risk Assessment: [potential issues or limitations]

        Respond in JSON format.
        `;
    }
    
    /**
     * Build planning prompt for Gemini API
     */
    buildPlanningPrompt(analysis) {
        return `
        Based on the task analysis, create a detailed execution plan:

        TASK: "${analysis.originalTask}"
        ANALYSIS: ${JSON.stringify(analysis)}
        PAGE_ELEMENTS: ${JSON.stringify(analysis.availableElements)}

        Generate a step-by-step action plan with:
        1. Precise element selectors
        2. Action types (click, type, select, scroll, wait)
        3. Values/inputs required
        4. Verification steps
        5. Error handling fallbacks
        6. Timing considerations

        Format as executable JSON with detailed instructions.
        `;
    }
    
    /**
     * Build verification prompt for Gemini API
     */
    buildVerificationPrompt(task, results) {
        return `
        ORIGINAL_TASK: "${task}"
        ACTIONS_TAKEN: ${JSON.stringify(this.actionHistory)}
        CURRENT_PAGE_STATE: ${JSON.stringify(this.getCurrentPageState())}

        Analyze whether the task was completed successfully:
        1. Completion Status: [success/partial/failed]
        2. Actions Effectiveness: Rate each action's success
        3. Unexpected Outcomes: Any unintended results
        4. Recommendations: Suggestions for improvement
        5. User Report: Clear summary for the user

        Provide analysis in structured format.
        `;
    }
    
    /**
     * Call Gemini API with the given prompt
     */
    async callGeminiAPI(prompt, apiKey) {
        try {
            const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
            
            const requestBody = {
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 2048,
                }
            };
            
            const response = await fetch(`${url}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            throw error;
        }
    }
    
    /**
     * Parse the analysis response from Gemini API
     */
    parseAnalysisResponse(response) {
        try {
            if (!response.candidates || response.candidates.length === 0) {
                throw new Error('No response candidates from Gemini API');
            }
            
            const textContent = response.candidates[0].content.parts[0].text;
            
            // Extract JSON from the response
            const jsonMatch = textContent.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Could not extract JSON from response');
            }
            
            const analysisJson = JSON.parse(jsonMatch[0]);
            
            return {
                taskCategory: analysisJson.taskCategory || 'generic',
                confidenceLevel: analysisJson.confidenceLevel || 0.5,
                requiredActions: analysisJson.requiredActions || [],
                prerequisites: analysisJson.prerequisites || [],
                successCriteria: analysisJson.successCriteria || [],
                riskAssessment: analysisJson.riskAssessment || [],
                originalResponse: textContent
            };
            
        } catch (error) {
            console.error('Error parsing analysis response:', error);
            return {
                taskCategory: 'generic',
                confidenceLevel: 0.5,
                requiredActions: [],
                prerequisites: [],
                successCriteria: [],
                riskAssessment: ['Error parsing response'],
                originalResponse: response
            };
        }
    }
    
    /**
     * Parse the action plan from Gemini API response
     */
    parseActionPlan(response) {
        try {
            if (!response.candidates || response.candidates.length === 0) {
                throw new Error('No response candidates from Gemini API');
            }
            
            const textContent = response.candidates[0].content.parts[0].text;
            
            // Extract JSON from the response
            const jsonMatch = textContent.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Could not extract JSON from response');
            }
            
            const planJson = JSON.parse(jsonMatch[0]);
            
            return {
                steps: planJson.steps || [],
                fallbacks: planJson.fallbacks || {},
                verificationSteps: planJson.verificationSteps || [],
                originalResponse: textContent
            };
            
        } catch (error) {
            console.error('Error parsing action plan:', error);
            return {
                steps: [],
                fallbacks: {},
                verificationSteps: [],
                originalResponse: response
            };
        }
    }
    
    /**
     * Parse the verification result from Gemini API response
     */
    parseVerificationResult(response) {
        try {
            if (!response.candidates || response.candidates.length === 0) {
                throw new Error('No response candidates from Gemini API');
            }
            
            const textContent = response.candidates[0].content.parts[0].text;
            
            // Extract JSON from the response
            const jsonMatch = textContent.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Could not extract JSON from response');
            }
            
            const verificationJson = JSON.parse(jsonMatch[0]);
            
            return {
                completionStatus: verificationJson.completionStatus || 'unknown',
                actionsEffectiveness: verificationJson.actionsEffectiveness || {},
                unexpectedOutcomes: verificationJson.unexpectedOutcomes || [],
                recommendations: verificationJson.recommendations || [],
                userReport: verificationJson.userReport || 'Task execution completed',
                originalResponse: textContent
            };
            
        } catch (error) {
            console.error('Error parsing verification result:', error);
            return {
                completionStatus: 'unknown',
                actionsEffectiveness: {},
                unexpectedOutcomes: ['Error parsing response'],
                recommendations: [],
                userReport: 'Task execution completed with unknown result',
                originalResponse: response
            };
        }
    }
    
    /**
     * Generate comprehensive report based on verification
     */
    generateComprehensiveReport(verification) {
        return {
            executionSummary: {
                taskDescription: this.currentTask,
                completionStatus: verification.completionStatus,
                totalActions: this.actionHistory.length,
                successRate: this.calculateSuccessRate(verification),
                executionTime: this.getExecutionDuration()
            },
            
            detailedResults: {
                successfulActions: this.getSuccessfulActions(verification),
                failedActions: this.getFailedActions(verification),
                unexpectedOutcomes: verification.unexpectedOutcomes,
                pageStateChanges: this.getPageStateChanges()
            },
            
            insights: {
                efficiencyScore: this.calculateEfficiency(verification),
                recommendations: verification.recommendations,
                learnings: this.extractLearnings(verification)
            },
            
            userFriendlyReport: verification.userReport || 'Task execution completed'
        };
    }
    
    /**
     * Calculate success rate based on verification
     */
    calculateSuccessRate(verification) {
        if (!verification.actionsEffectiveness || Object.keys(verification.actionsEffectiveness).length === 0) {
            return verification.completionStatus === 'success' ? 1.0 : 0.0;
        }
        
        const effectivenessValues = Object.values(verification.actionsEffectiveness);
        const sum = effectivenessValues.reduce((total, value) => total + value, 0);
        return sum / effectivenessValues.length;
    }
    
    /**
     * Get execution duration
     */
    getExecutionDuration() {
        // Implementation would track start/end time
        return '00:00:00'; // Placeholder
    }
    
    /**
     * Get successful actions based on verification
     */
    getSuccessfulActions(verification) {
        if (!verification.actionsEffectiveness) {
            return [];
        }
        
        return Object.entries(verification.actionsEffectiveness)
            .filter(([_, value]) => value > 0.5)
            .map(([key, _]) => key);
    }
    
    /**
     * Get failed actions based on verification
     */
    getFailedActions(verification) {
        if (!verification.actionsEffectiveness) {
            return [];
        }
        
        return Object.entries(verification.actionsEffectiveness)
            .filter(([_, value]) => value <= 0.5)
            .map(([key, _]) => key);
    }
    
    /**
     * Get page state changes
     */
    getPageStateChanges() {
        // Implementation would compare initial and final page states
        return [];
    }
    
    /**
     * Calculate efficiency score
     */
    calculateEfficiency(verification) {
        // Implementation would calculate efficiency based on actions and time
        return verification.completionStatus === 'success' ? 0.8 : 0.4;
    }
    
    /**
     * Extract learnings from verification
     */
    extractLearnings(verification) {
        return verification.recommendations || [];
    }
    
    /**
     * Smart Execution Engine (Phase 3: Intelligent Action Execution)
     */
    
    /**
     * Execute action plan with intelligence
     */
    async executeWithIntelligence(actionPlan) {
        // Store initial page state
        const initialState = this.capturePageState();
        
        // Setup monitoring
        this.setupActionMonitoring();
        
        // Prepare rollback mechanism
        this.setupRollbackCapability();
        
        const results = [];
        
        for (let step of actionPlan.steps) {
            try {
                // Pre-action validation
                await this.validateStepPreconditions(step);
                
                // Execute action with enhanced error handling
                const result = await this.executeActionSmart(step);
                
                // Post-action verification
                await this.verifyStepCompletion(step, result);
                
                // Adaptive waiting
                await this.intelligentWait(step.waitConditions);
                
                // Progress reporting
                this.reportProgress(step, result);
                
                // Add to results
                results.push({
                    step: step,
                    result: result,
                    success: true
                });
                
            } catch (error) {
                console.error(`Error executing step: ${step.description || JSON.stringify(step)}`, error);
                
                // Intelligent error recovery
                const recovery = await this.attemptErrorRecovery(step, error);
                
                results.push({
                    step: step,
                    error: error.message,
                    recovery: recovery,
                    success: recovery.success
                });
                
                if (!recovery.success && !step.optional) {
                    throw new Error(`Failed to execute step: ${step.description || JSON.stringify(step)}. Error: ${error.message}`);
                }
            }
        }
        
        return results;
    }
    
    /**
     * Capture the current page state
     */
    capturePageState() {
        return {
            url: window.location.href,
            title: document.title,
            html: document.documentElement.outerHTML,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Setup action monitoring
     */
    setupActionMonitoring() {
        // Monitor DOM mutations
        this.mutationObserver = new MutationObserver((mutations) => {
            this.handleDomMutations(mutations);
        });
        
        this.mutationObserver.observe(document.body, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true
        });
        
        // Monitor URL changes
        this.lastUrl = window.location.href;
        this.urlCheckInterval = setInterval(() => {
            if (window.location.href !== this.lastUrl) {
                this.handleUrlChange(this.lastUrl, window.location.href);
                this.lastUrl = window.location.href;
            }
        }, 1000);
        
        // Monitor console errors
        this.originalConsoleError = console.error;
        console.error = (...args) => {
            this.handleConsoleError(args);
            this.originalConsoleError.apply(console, args);
        };
    }
    
    /**
     * Handle DOM mutations
     */
    handleDomMutations(mutations) {
        // Implementation would analyze mutations for relevant changes
        // For now, just log the count
        if (mutations.length > 10) {
            console.log(`Detected ${mutations.length} DOM mutations`);
        }
    }
    
    /**
     * Handle URL changes
     */
    handleUrlChange(oldUrl, newUrl) {
        console.log(`URL changed from ${oldUrl} to ${newUrl}`);
        this.actionHistory.push({
            action: 'navigation',
            from: oldUrl,
            to: newUrl,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Handle console errors
     */
    handleConsoleError(args) {
        // Log errors that might be relevant to our execution
        const errorText = args.join(' ');
        if (this.isRunning && !errorText.includes('Gemini API')) {
            this.actionHistory.push({
                action: 'error',
                message: errorText,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Setup rollback capability
     */
    setupRollbackCapability() {
        // Store the initial state for potential rollback
        this.initialState = this.capturePageState();
        this.stateHistory = [this.initialState];
    }
    
    /**
     * Validate step preconditions
     */
    async validateStepPreconditions(step) {
        if (!step) {
            throw new Error('Invalid step: step is undefined');
        }
        
        if (!step.action) {
            throw new Error('Invalid step: action is required');
        }
        
        // Check if required elements exist
        if (step.selector) {
            const element = await this.findElementIntelligently(step.selector, step.description, step.context);
            if (!element && !step.optional) {
                throw new Error(`Element not found: ${step.selector}`);
            }
        }
        
        return true;
    }
    
    /**
     * Execute action with smart handling
     */
    async executeActionSmart(step) {
        const result = {
            success: false,
            message: '',
            data: null
        };
        
        try {
            switch (step.action) {
                case 'click':
                    result.data = await this.performClick(step);
                    break;
                case 'type':
                    result.data = await this.performType(step);
                    break;
                case 'select':
                    result.data = await this.performSelect(step);
                    break;
                case 'scroll':
                    result.data = await this.performScroll(step);
                    break;
                case 'wait':
                    result.data = await this.performWait(step);
                    break;
                case 'extract':
                    result.data = await this.performExtract(step);
                    break;
                case 'navigate':
                    result.data = await this.performNavigate(step);
                    break;
                default:
                    throw new Error(`Unknown action type: ${step.action}`);
            }
            
            result.success = true;
            result.message = `Successfully performed ${step.action}`;
            
            // Add to action history
            this.actionHistory.push({
                ...step,
                result: result,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            result.success = false;
            result.message = error.message;
            throw error;
        }
        
        return result;
    }
    
    /**
     * Perform click action
     */
    async performClick(step) {
        const element = await this.findElementIntelligently(step.selector, step.description, step.context);
        
        if (!element) {
            throw new Error(`Element not found for click: ${step.selector}`);
        }
        
        // Scroll element into view if needed
        if (!this.isElementInViewport(element)) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.sleep(500); // Wait for scroll to complete
        }
        
        // Highlight element before clicking (visual feedback)
        this.highlightElement(element);
        
        // Perform the click
        try {
            element.click();
        } catch (error) {
            // Try alternative clicking methods
            try {
                const rect = element.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                // Create and dispatch mouse events
                const mouseDown = new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: centerX,
                    clientY: centerY
                });
                
                const mouseUp = new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: centerX,
                    clientY: centerY
                });
                
                element.dispatchEvent(mouseDown);
                element.dispatchEvent(mouseUp);
                
            } catch (innerError) {
                throw new Error(`Failed to click element: ${innerError.message}`);
            }
        }
        
        return { element, action: 'click' };
    }
    
    /**
     * Perform type action
     */
    async performType(step) {
        const element = await this.findElementIntelligently(step.selector, step.description, step.context);
        
        if (!element) {
            throw new Error(`Element not found for typing: ${step.selector}`);
        }
        
        // Check if element is an input or has contentEditable
        if (!this.isInputElement(element) && !element.isContentEditable) {
            throw new Error('Element is not suitable for typing');
        }
        
        // Scroll element into view if needed
        if (!this.isElementInViewport(element)) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.sleep(500); // Wait for scroll to complete
        }
        
        // Focus the element
        element.focus();
        
        // Clear existing value if specified
        if (step.clear) {
            if (this.isInputElement(element)) {
                element.value = '';
            } else if (element.isContentEditable) {
                element.textContent = '';
            }
        }
        
        // Type the text with realistic timing
        if (this.isInputElement(element)) {
            // For input elements, set the value directly
            element.value = step.text;
            
            // Dispatch input and change events
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            
        } else if (element.isContentEditable) {
            // For contentEditable elements, insert text at cursor position
            document.execCommand('insertText', false, step.text);
        }
        
        return { element, action: 'type', text: step.text };
    }
    
    /**
     * Perform select action
     */
    async performSelect(step) {
        const element = await this.findElementIntelligently(step.selector, step.description, step.context);
        
        if (!element) {
            throw new Error(`Element not found for select: ${step.selector}`);
        }
        
        // Check if element is a select element
        if (element.tagName.toLowerCase() !== 'select') {
            throw new Error('Element is not a select element');
        }
        
        // Scroll element into view if needed
        if (!this.isElementInViewport(element)) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.sleep(500); // Wait for scroll to complete
        }
        
        // Focus the element
        element.focus();
        
        // Select the option
        if (step.value) {
            element.value = step.value;
        } else if (step.text) {
            // Find option by text
            const options = Array.from(element.options);
            const option = options.find(opt => opt.text === step.text);
            if (option) {
                element.value = option.value;
            } else {
                throw new Error(`Option with text "${step.text}" not found`);
            }
        } else if (step.index !== undefined) {
            // Select by index
            if (step.index >= 0 && step.index < element.options.length) {
                element.selectedIndex = step.index;
            } else {
                throw new Error(`Invalid option index: ${step.index}`);
            }
        }
        
        // Dispatch change event
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        return { element, action: 'select', value: element.value };
    }
    
    /**
     * Perform scroll action
     */
    async performScroll(step) {
        if (step.selector) {
            // Scroll to element
            const element = await this.findElementIntelligently(step.selector, step.description, step.context);
            
            if (!element) {
                throw new Error(`Element not found for scroll: ${step.selector}`);
            }
            
            element.scrollIntoView({
                behavior: step.smooth ? 'smooth' : 'auto',
                block: step.block || 'center'
            });
            
            return { action: 'scroll', target: 'element', selector: step.selector };
            
        } else if (step.position) {
            // Scroll to position
            window.scrollTo({
                top: step.position.y || 0,
                left: step.position.x || 0,
                behavior: step.smooth ? 'smooth' : 'auto'
            });
            
            return { action: 'scroll', target: 'position', position: step.position };
            
        } else if (step.direction) {
            // Scroll in direction
            const distance = step.distance || 300;
            
            switch (step.direction) {
                case 'up':
                    window.scrollBy({ top: -distance, behavior: step.smooth ? 'smooth' : 'auto' });
                    break;
                case 'down':
                    window.scrollBy({ top: distance, behavior: step.smooth ? 'smooth' : 'auto' });
                    break;
                case 'left':
                    window.scrollBy({ left: -distance, behavior: step.smooth ? 'smooth' : 'auto' });
                    break;
                case 'right':
                    window.scrollBy({ left: distance, behavior: step.smooth ? 'smooth' : 'auto' });
                    break;
            }
            
            return { action: 'scroll', target: 'direction', direction: step.direction, distance };
        }
        
        throw new Error('Invalid scroll parameters');
    }
    
    /**
     * Perform wait action
     */
    async performWait(step) {
        if (step.duration) {
            // Wait for specified duration
            await this.sleep(step.duration);
            return { action: 'wait', type: 'duration', duration: step.duration };
            
        } else if (step.selector) {
            // Wait for element to appear
            const startTime = Date.now();
            const timeout = step.timeout || 10000;
            
            while (Date.now() - startTime < timeout) {
                const element = document.querySelector(step.selector);
                if (element && this.isElementVisible(element)) {
                    return { action: 'wait', type: 'element', selector: step.selector, duration: Date.now() - startTime };
                }
                await this.sleep(100);
            }
            
            if (step.optional) {
                return { action: 'wait', type: 'element', selector: step.selector, result: 'timeout', optional: true };
            }
            
            throw new Error(`Timeout waiting for element: ${step.selector}`);
            
        } else if (step.condition) {
            // Wait for custom condition
            // This would require a function, which is not possible to pass directly
            // For now, we'll just wait a fixed duration
            await this.sleep(1000);
            return { action: 'wait', type: 'condition' };
        }
        
        // Default wait
        await this.sleep(1000);
        return { action: 'wait', type: 'default', duration: 1000 };
    }
    
    /**
     * Perform extract action
     */
    async performExtract(step) {
        if (step.selector) {
            // Extract from specific element
            const element = await this.findElementIntelligently(step.selector, step.description, step.context);
            
            if (!element) {
                throw new Error(`Element not found for extraction: ${step.selector}`);
            }
            
            let extractedData;
            
            switch (step.attribute) {
                case 'text':
                    extractedData = element.innerText || element.textContent;
                    break;
                case 'html':
                    extractedData = element.innerHTML;
                    break;
                case 'value':
                    extractedData = element.value;
                    break;
                default:
                    // Extract specific attribute
                    extractedData = element.getAttribute(step.attribute || 'textContent');
            }
            
            return { action: 'extract', source: 'element', data: extractedData };
            
        } else if (step.pattern) {
            // Extract using regex pattern
            const text = document.body.innerText;
            const regex = new RegExp(step.pattern, step.flags || 'g');
            const matches = text.match(regex) || [];
            
            return { action: 'extract', source: 'pattern', data: matches };
            
        } else if (step.xpath) {
            // Extract using XPath
            const result = document.evaluate(
                step.xpath,
                document,
                null,
                XPathResult.ANY_TYPE,
                null
            );
            
            const nodes = [];
            let node = result.iterateNext();
            
            while (node) {
                nodes.push(node.textContent);
                node = result.iterateNext();
            }
            
            return { action: 'extract', source: 'xpath', data: nodes };
        }
        
        throw new Error('Invalid extract parameters');
    }
    
    /**
     * Perform navigate action
     */
    async performNavigate(step) {
        if (!step.url) {
            throw new Error('URL is required for navigation');
        }
        
        // Store current URL for history
        const fromUrl = window.location.href;
        
        // Perform navigation
        window.location.href = step.url;
        
        // Wait for navigation to complete
        await this.sleep(step.timeout || 5000);
        
        return { action: 'navigate', from: fromUrl, to: step.url };
    }
    
    /**
     * Verify step completion
     */
    async verifyStepCompletion(step, result) {
        if (!step.verification) {
            return true; // No verification needed
        }
        
        try {
            if (step.verification.selector) {
                // Verify element exists
                const element = await this.findElementIntelligently(
                    step.verification.selector,
                    step.verification.description,
                    step.verification.context
                );
                
                if (!element) {
                    throw new Error(`Verification failed: Element not found ${step.verification.selector}`);
                }
                
                // Check for specific text if provided
                if (step.verification.text && element.innerText.indexOf(step.verification.text) === -1) {
                    throw new Error(`Verification failed: Text "${step.verification.text}" not found in element`);
                }
                
            } else if (step.verification.condition) {
                // This would require a function, which is not possible to pass directly
                // For now, we'll just return true
            }
            
            return true;
            
        } catch (error) {
            if (step.verification.optional) {
                console.warn(`Optional verification failed: ${error.message}`);
                return true;
            }
            
            throw error;
        }
    }
    
    /**
     * Intelligent waiting based on conditions
     */
    async intelligentWait(waitConditions) {
        if (!waitConditions) {
            // Default wait time
            await this.sleep(500);
            return;
        }
        
        if (waitConditions.duration) {
            // Fixed duration wait
            await this.sleep(waitConditions.duration);
            return;
        }
        
        if (waitConditions.selector) {
            // Wait for element to appear/disappear
            const startTime = Date.now();
            const timeout = waitConditions.timeout || 10000;
            const checkInterval = waitConditions.interval || 100;
            
            while (Date.now() - startTime < timeout) {
                const element = document.querySelector(waitConditions.selector);
                const exists = !!element;
                
                if (waitConditions.exists === false && !exists) {
                    // Element should not exist and doesn't exist
                    return;
                }
                
                if (waitConditions.exists !== false && exists) {
                    // Element should exist and does exist
                    if (!waitConditions.visible || this.isElementVisible(element)) {
                        return;
                    }
                }
                
                await this.sleep(checkInterval);
            }
            
            if (waitConditions.optional) {
                console.warn(`Optional wait condition timed out: ${waitConditions.selector}`);
                return;
            }
            
            throw new Error(`Wait condition timed out: ${waitConditions.selector}`);
        }
        
        // Default wait if no specific conditions
        await this.sleep(500);
    }
    
    /**
     * Report progress of execution
     */
    reportProgress(step, result) {
        console.log(`Executed step: ${step.description || step.action}`, {
            success: result.success,
            details: result
        });
    }
    
    /**
     * Attempt to recover from errors
     */
    async attemptErrorRecovery(step, error) {
        console.log(`Attempting to recover from error: ${error.message}`);
        
        // Classify error type
        const errorType = this.classifyError(error);
        
        // Get recovery strategy based on error type
        const recoveryStrategy = this.getRecoveryStrategy(errorType);
        
        // Execute recovery strategy
        return await this.executeRecovery(recoveryStrategy, { step, error });
    }
    
    /**
     * Classify error type
     */
    classifyError(error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('not found') || errorMessage.includes('no element')) {
            return 'element_missing';
        }
        
        if (errorMessage.includes('timeout')) {
            return 'timeout';
        }
        
        if (errorMessage.includes('permission') || errorMessage.includes('access')) {
            return 'permission_denied';
        }
        
        if (errorMessage.includes('network') || errorMessage.includes('connection')) {
            return 'network_error';
        }
        
        return 'unknown_error';
    }
    
    /**
     * Get recovery strategy based on error type
     */
    getRecoveryStrategy(errorType) {
        const strategies = {
            element_missing: async (context) => {
                // Try alternative selectors
                if (context.step.alternativeSelectors && context.step.alternativeSelectors.length > 0) {
                    for (const selector of context.step.alternativeSelectors) {
                        const element = document.querySelector(selector);
                        if (element) {
                            return {
                                success: true,
                                message: `Found element using alternative selector: ${selector}`,
                                element
                            };
                        }
                    }
                }
                
                // Wait for dynamic content
                await this.sleep(2000);
                const element = document.querySelector(context.step.selector);
                if (element) {
                    return {
                        success: true,
                        message: 'Element appeared after waiting',
                        element
                    };
                }
                
                return {
                    success: false,
                    message: 'Could not find element with any strategy'
                };
            },
            
            timeout: async (context) => {
                // Increase timeout and retry
                await this.sleep(2000);
                
                return {
                    success: false,
                    message: 'Timeout recovery failed'
                };
            },
            
            permission_denied: async (context) => {
                return {
                    success: false,
                    message: 'Permission issues cannot be automatically resolved'
                };
            },
            
            network_error: async (context) => {
                // Wait and retry
                await this.sleep(2000);
                
                return {
                    success: false,
                    message: 'Network error recovery failed'
                };
            },
            
            unknown_error: async (context) => {
                // Generic recovery: wait and retry
                await this.sleep(1000);
                
                return {
                    success: false,
                    message: 'Unknown error recovery failed'
                };
            }
        };
        
        return strategies[errorType] || strategies.unknown_error;
    }
    
    /**
     * Execute recovery strategy
     */
    async executeRecovery(recoveryStrategy, context) {
        try {
            return await recoveryStrategy(context);
        } catch (error) {
            console.error('Error during recovery attempt:', error);
            return {
                success: false,
                message: `Recovery failed: ${error.message}`
            };
        }
    }
    
    /**
     * Find element intelligently using multiple strategies
     */
    async findElementIntelligently(selector, description, context) {
        // Try direct selector first
        let element = document.querySelector(selector);
        if (element && this.isElementInteractable(element)) {
            return element;
        }
        
        // Try by description (text content)
        if (description) {
            element = this.findByDescription(description);
            if (element && this.isElementInteractable(element)) {
                return element;
            }
        }
        
        // Try by semantic context
        if (context) {
            element = this.findBySemanticContext(context);
            if (element && this.isElementInteractable(element)) {
                return element;
            }
        }
        
        // Try by similarity
        element = this.findBySimilarity(selector);
        if (element && this.isElementInteractable(element)) {
            return element;
        }
        
        // No element found with any strategy
        return null;
    }
    
    /**
     * Find element by description (text content)
     */
    findByDescription(description) {
        // Try to find elements containing the description text
        const elements = Array.from(document.querySelectorAll('*'));
        
        return elements.find(el => {
            const text = el.innerText || el.textContent || '';
            return text.includes(description) && this.isElementVisible(el);
        });
    }
    
    /**
     * Find element by semantic context
     */
    findBySemanticContext(context) {
        // This would be a more complex implementation
        // For now, return null
        return null;
    }
    
    /**
     * Find element by similarity to selector
     */
    findBySimilarity(selector) {
        // Handle ID selectors
        if (selector.startsWith('#')) {
            const id = selector.substring(1);
            
            // Try partial ID match
            const elements = Array.from(document.querySelectorAll(`[id*="${id}"]`));
            if (elements.length > 0) {
                return elements[0];
            }
        }
        
        // Handle class selectors
        if (selector.startsWith('.')) {
            const className = selector.substring(1);
            
            // Try partial class match
            const elements = Array.from(document.querySelectorAll(`[class*="${className}"]`));
            if (elements.length > 0) {
                return elements[0];
            }
        }
        
        return null;
    }
    
    /**
     * Check if element is interactable
     */
    isElementInteractable(element) {
        return this.isElementVisible(element) && !element.disabled;
    }
    
    /**
     * Check if element is in viewport
     */
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
    }
    
    /**
     * Check if element is an input element
     */
    isInputElement(element) {
        const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
        return inputTags.includes(element.tagName);
    }
    
    /**
     * Highlight element for visual feedback
     */
    highlightElement(element) {
        const originalOutline = element.style.outline;
        const originalBoxShadow = element.style.boxShadow;
        
        element.style.outline = '2px solid red';
        element.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
        
        setTimeout(() => {
            element.style.outline = originalOutline;
            element.style.boxShadow = originalBoxShadow;
        }, 1000);
    }
    
    /**
     * Sleep for specified duration
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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