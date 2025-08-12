/**
 * Enhanced content.js - Combines content extraction with agent execution
 * This script is injected into the active webpage and can perform actions
 */
(() => {
    // Inject the agent system if not already present
    if (!window.webPageAgent) {
        // Agent system code would be injected here or imported
        // For now, we'll include a simplified version
        
        class WebPageAgent {
            constructor() {
                this.actionHistory = [];
                this.isRunning = false;
            }

            async executeTask(task, context, apiKey) {
                this.isRunning = true;
                console.log('Agent executing task:', task);
                
                try {
                    // Analyze task type
                    const taskType = this.analyzeTaskType(task);
                    console.log('Task type detected:', taskType);
                    
                    let results = [];
                    
                    switch (taskType) {
                        case 'quiz':
                            results = await this.handleQuizTask(task);
                            break;
                        case 'voting':
                            results = await this.handleVotingTask(task);
                            break;
                        case 'form':
                            results = await this.handleFormTask(task);
                            break;
                        case 'interaction':
                            results = await this.handleInteractionTask(task);
                            break;
                        default:
                            results = await this.handleGenericTask(task);
                    }
                    
                    return {
                        success: true,
                        taskType: taskType,
                        results: results,
                        actionsPerformed: this.actionHistory.length,
                        report: this.generateSimpleReport(task, results)
                    };
                    
                } catch (error) {
                    console.error('Agent execution error:', error);
                    return {
                        success: false,
                        error: error.message,
                        actionsPerformed: this.actionHistory.length
                    };
                } finally {
                    this.isRunning = false;
                }
            }

            analyzeTaskType(task) {
                const taskLower = task.toLowerCase();
                
                if (taskLower.includes('question') || taskLower.includes('quiz') || taskLower.includes('answer')) {
                    return 'quiz';
                }
                if (taskLower.includes('upvote') || taskLower.includes('vote') || taskLower.includes('like')) {
                    return 'voting';
                }
                if (taskLower.includes('form') || taskLower.includes('fill') || taskLower.includes('submit')) {
                    return 'form';
                }
                if (taskLower.includes('click') || taskLower.includes('select') || taskLower.includes('choose')) {
                    return 'interaction';
                }
                
                return 'generic';
            }

            async handleQuizTask(task) {
                const results = [];
                console.log('Handling quiz task...');
                
                // Find all question elements
                const questionSelectors = [
                    'input[type="radio"]',
                    'input[type="checkbox"]', 
                    '.question-option',
                    '.quiz-option',
                    '.answer-choice',
                    '[data-answer]',
                    '.option',
                    '.choice'
                ];
                
                let allOptions = [];
                for (let selector of questionSelectors) {
                    const elements = document.querySelectorAll(selector);
                    allOptions = allOptions.concat(Array.from(elements));
                }
                
                console.log(`Found ${allOptions.length} quiz options`);
                
                // Group by question (for radio buttons)
                const questionGroups = {};
                
                allOptions.forEach((option, index) => {
                    let groupKey = option.name || option.closest('.question')?.id || option.closest('[data-question]')?.dataset.question || `group_${Math.floor(index / 4)}`;
                    
                    if (!questionGroups[groupKey]) {
                        questionGroups[groupKey] = [];
                    }
                    questionGroups[groupKey].push(option);
                });
                
                // Select answers (first option for each group for now)
                let selectedCount = 0;
                for (let [groupKey, options] of Object.entries(questionGroups)) {
                    try {
                        const option = options[0]; // Select first option
                        if (option && !option.checked && !option.disabled) {
                            option.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            await this.wait(300);
                            option.click();
                            selectedCount++;
                            
                            this.actionHistory.push({
                                action: 'select_answer',
                                element: this.getElementInfo(option),
                                timestamp: new Date().toISOString()
                            });
                            
                            await this.wait(200);
                        }
                    } catch (error) {
                        console.warn('Failed to select option:', error);
                    }
                }
                
                results.push({
                    action: 'quiz_completion',
                    questionsFound: Object.keys(questionGroups).length,
                    optionsFound: allOptions.length,
                    answersSelected: selectedCount
                });
                
                return results;
            }

            async handleVotingTask(task) {
                const results = [];
                console.log('Handling voting task...');
                
                // Extract target count from task description
                const targetCountMatch = task.match(/\b(\d+)\s+(post|posts)\b/);
                const targetCount = targetCountMatch ? parseInt(targetCountMatch[1]) : 5;
                
                // Find upvote buttons with enhanced detection
                let voteButtons = [];
                
                // Check if we're on Reddit
                if (window.location.hostname.includes('reddit')) {
                    // Enhanced Reddit upvote button detection
                    voteButtons = document.querySelectorAll(
                        '[aria-label*="upvote"], .upvote, .upvote-button, ' +
                        'button[aria-label*="upvote"], div[aria-label*="upvote"], ' +
                        'button[data-click-id*="upvote"], [data-testid*="upvote"], ' +
                        'svg[aria-label*="upvote"]'
                    );
                    
                    // If still not found, try more generic approach for Reddit
                    if (voteButtons.length === 0) {
                        // Look for SVG icons that might be upvote buttons
                        const svgElements = document.querySelectorAll('svg');
                        for (const svg of svgElements) {
                            // Check if it's within a post container
                            const postContainer = svg.closest('.Post') || svg.closest('[data-testid="post"]');
                            if (postContainer) {
                                // Check if it looks like an upvote icon (usually at the left side of posts)
                                const rect = svg.getBoundingClientRect();
                                const postRect = postContainer.getBoundingClientRect();
                                if (rect.left < postRect.left + 50) { // Usually upvote buttons are on the left
                                    voteButtons = [...voteButtons, svg];
                                }
                            }
                        }
                    }
                } else {
                    // Enhanced generic voting buttons detection
                    const voteSelectors = [
                        '.upvote', '.vote-up', '.arrow-up',
                        '[aria-label*="upvote"]', '[title*="upvote"]',
                        '.fa-arrow-up', '.icon-up',
                        'button[data-action="upvote"]',
                        '.vote.up', '.arrow.up',
                        'button[title*="like"]', '.like-button',
                        'svg[aria-label*="like"]', 'svg[aria-label*="upvote"]',
                        'i.fa-thumbs-up', '[data-testid*="like"]', '[data-testid*="upvote"]'
                    ];
                    
                    for (let selector of voteSelectors) {
                        const elements = document.querySelectorAll(selector);
                        voteButtons = voteButtons.concat(Array.from(elements));
                    }
                    
                    // If still not found, try XPath to find elements with text containing 'like' or 'upvote'
                    if (voteButtons.length === 0) {
                        const xpathResult = document.evaluate(
                            '//*[contains(text(), "like") or contains(text(), "upvote")]',
                            document,
                            null,
                            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                            null
                        );
                        
                        for (let i = 0; i < xpathResult.snapshotLength; i++) {
                            voteButtons = [...voteButtons, xpathResult.snapshotItem(i)];
                        }
                    }
                }
                
                // Remove duplicates and get first N
                voteButtons = [...new Set(voteButtons)].slice(0, targetCount);
                
                console.log(`Found ${voteButtons.length} vote buttons, targeting ${targetCount}`);
                
                let votedCount = 0;
                for (let button of voteButtons) {
                    try {
                        if (this.isElementClickable(button)) {
                            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            await this.wait(500);
                            
                            // Highlight the button before clicking
                            const originalStyle = button.style.cssText;
                            button.style.cssText += 'outline: 3px solid red !important; background-color: rgba(255, 0, 0, 0.2) !important;';
                            await this.wait(300);
                            
                            button.click();
                            votedCount++;
                            
                            // Restore original style
                            await this.wait(300);
                            button.style.cssText = originalStyle;
                            
                            this.actionHistory.push({
                                action: 'upvote',
                                element: this.getElementInfo(button),
                                timestamp: new Date().toISOString()
                            });
                            
                            await this.wait(700); // Wait longer for vote animations
                        }
                    } catch (error) {
                        console.warn('Failed to upvote:', error);
                    }
                }
                
                results.push({
                    action: 'voting_completed',
                    buttonsFound: voteButtons.length,
                    votesPlaced: votedCount,
                    targetCount: targetCount
                });
                
                return results;
            }

            async handleFormTask(task) {
                const results = [];
                console.log('Handling form task...');
                
                // Find form elements
                const forms = document.querySelectorAll('form');
                const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');
                const selects = document.querySelectorAll('select');
                const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"], .submit-btn');
                
                let filledCount = 0;
                
                // Fill text inputs with placeholder or intelligent values
                for (let input of inputs) {
                    try {
                        if (!input.value && !input.disabled) {
                            let value = this.generateInputValue(input);
                            if (value) {
                                input.focus();
                                input.value = value;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                                filledCount++;
                                
                                this.actionHistory.push({
                                    action: 'fill_input',
                                    element: this.getElementInfo(input),
                                    value: value,
                                    timestamp: new Date().toISOString()
                                });
                                
                                await this.wait(200);
                            }
                        }
                    } catch (error) {
                        console.warn('Failed to fill input:', error);
                    }
                }
                
                // Handle select dropdowns
                for (let select of selects) {
                    try {
                        if (select.options.length > 1 && !select.value) {
                            // Select the first non-empty option
                            select.selectedIndex = 1;
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                            filledCount++;
                            
                            this.actionHistory.push({
                                action: 'select_option',
                                element: this.getElementInfo(select),
                                value: select.value,
                                timestamp: new Date().toISOString()
                            });
                            
                            await this.wait(200);
                        }
                    } catch (error) {
                        console.warn('Failed to select option:', error);
                    }
                }
                
                results.push({
                    action: 'form_filling',
                    formsFound: forms.length,
                    inputsFound: inputs.length,
                    selectsFound: selects.length,
                    fieldsFilled: filledCount
                });
                
                return results;
            }

            generateInputValue(input) {
                const name = (input.name || input.id || input.placeholder || '').toLowerCase();
                const type = input.type.toLowerCase();
                
                if (type === 'email' || name.includes('email')) {
                    return 'test@example.com';
                }
                if (name.includes('name') && !name.includes('user')) {
                    return 'John Doe';
                }
                if (name.includes('phone') || name.includes('tel')) {
                    return '+1234567890';
                }
                if (name.includes('address')) {
                    return '123 Main St';
                }
                if (name.includes('city')) {
                    return 'New York';
                }
                if (name.includes('zip') || name.includes('postal')) {
                    return '10001';
                }
                if (type === 'password') {
                    return 'TestPassword123!';
                }
                if (input.tagName === 'TEXTAREA' || name.includes('message') || name.includes('comment')) {
                    return 'This is a test message generated by the AI agent.';
                }
                
                // Generic text for other fields
                return 'Test Value';
            }

            async handleInteractionTask(task) {
                const results = [];
                console.log('Handling interaction task...');
                
                const taskLower = task.toLowerCase();
                let elements = [];
                
                // Find elements based on task description
                if (taskLower.includes('button')) {
                    elements = document.querySelectorAll('button, .button, [role="button"]');
                } else if (taskLower.includes('link')) {
                    elements = document.querySelectorAll('a[href]');
                } else if (taskLower.includes('menu') || taskLower.includes('dropdown')) {
                    elements = document.querySelectorAll('.menu, .dropdown, select');
                } else {
                    // Generic clickable elements
                    elements = document.querySelectorAll('button, a[href], [role="button"], .clickable');
                }
                
                // Filter to get the most relevant elements
                const relevantElements = Array.from(elements).filter(el => {
                    const text = el.textContent?.toLowerCase() || '';
                    const className = el.className?.toLowerCase() || '';
                    const id = el.id?.toLowerCase() || '';
                    
                    // Look for keywords from the task
                    const keywords = taskLower.match(/\b\w+\b/g) || [];
                    return keywords.some(keyword => 
                        text.includes(keyword) || className.includes(keyword) || id.includes(keyword)
                    );
                }).slice(0, 5); // Limit to first 5 relevant elements
                
                let interactionCount = 0;
                
                for (let element of relevantElements) {
                    try {
                        if (this.isElementClickable(element)) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            await this.wait(500);
                            
                            element.click();
                            interactionCount++;
                            
                            this.actionHistory.push({
                                action: 'interact',
                                element: this.getElementInfo(element),
                                timestamp: new Date().toISOString()
                            });
                            
                            await this.wait(700);
                        }
                    } catch (error) {
                        console.warn('Failed to interact with element:', error);
                    }
                }
                
                results.push({
                    action: 'interaction_completed',
                    elementsFound: elements.length,
                    relevantElements: relevantElements.length,
                    interactionsPerformed: interactionCount
                });
                
                return results;
            }

            async handleGenericTask(task) {
                const results = [];
                console.log('Handling generic task...');
                
                // Try to find elements based on common patterns in the task
                const taskWords = task.toLowerCase().split(/\s+/);
                let elements = [];
                
                // Look for elements with text matching task words
                const allElements = document.querySelectorAll('*');
                
                for (let element of allElements) {
                    if (element.children.length === 0) { // Only leaf elements
                        const text = element.textContent?.toLowerCase() || '';
                        const hasMatchingText = taskWords.some(word => 
                            word.length > 3 && text.includes(word)
                        );
                        
                        if (hasMatchingText && this.isElementClickable(element)) {
                            elements.push(element);
                        }
                    }
                }
                
                // Limit to prevent overwhelming the page
                elements = elements.slice(0, 10);
                
                let actionCount = 0;
                
                for (let element of elements) {
                    try {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        await this.wait(300);
                        
                        // Highlight the element briefly
                        const originalStyle = element.style.cssText;
                        element.style.cssText += 'border: 3px solid red !important; background-color: yellow !important;';
                        
                        await this.wait(500);
                        
                        element.click();
                        actionCount++;
                        
                        this.actionHistory.push({
                            action: 'generic_click',
                            element: this.getElementInfo(element),
                            timestamp: new Date().toISOString()
                        });
                        
                        // Restore original style
                        element.style.cssText = originalStyle;
                        
                        await this.wait(500);
                    } catch (error) {
                        console.warn('Failed generic action:', error);
                    }
                }
                
                results.push({
                    action: 'generic_task_completed',
                    elementsFound: elements.length,
                    actionsPerformed: actionCount
                });
                
                return results;
            }

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

            getElementInfo(element) {
                return {
                    tagName: element.tagName,
                    id: element.id,
                    className: element.className,
                    text: element.textContent?.trim().substring(0, 100),
                    type: element.type,
                    name: element.name
                };
            }

            async wait(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            generateSimpleReport(task, results) {
                let report = `Task: "${task}"\n\n`;
                
                for (let result of results) {
                    report += `Action: ${result.action}\n`;
                    
                    Object.keys(result).forEach(key => {
                        if (key !== 'action') {
                            report += `  ${key}: ${result[key]}\n`;
                        }
                    });
                    
                    report += '\n';
                }
                
                report += `Total actions performed: ${this.actionHistory.length}\n`;
                report += `Task completed at: ${new Date().toLocaleString()}`;
                
                return report;
            }
        }
        
        // Initialize agent
        window.webPageAgent = new WebPageAgent();
        console.log('WebPageAgent initialized in content script');
    }

    // Function to get all visible images on the page
    function getVisibleImages() {
        const images = Array.from(document.querySelectorAll('img'));
        return images
            .filter(img => {
                const rect = img.getBoundingClientRect();
                const style = window.getComputedStyle(img);
                const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 50 && rect.height > 50;
                return isVisible && img.src && (img.src.startsWith('http') || img.src.startsWith('data:'));
            })
            .map(img => {
                return {
                    src: img.src,
                    alt: img.alt || '',
                    width: img.width,
                    height: img.height
                };
            });
    }

    // Function to get enhanced page content including interactive elements
    function getPageContent() {
        const content = {
            text: document.body.innerText,
            images: getVisibleImages(),
            url: window.location.href,
            title: document.title
        };

        // Add interactive elements info for agent mode
        content.interactiveElements = {
            buttons: document.querySelectorAll('button, .button, [role="button"]').length,
            links: document.querySelectorAll('a[href]').length,
            inputs: document.querySelectorAll('input, textarea, select').length,
            forms: document.querySelectorAll('form').length,
            questions: document.querySelectorAll('input[type="radio"], input[type="checkbox"], .question').length
        };

        // Add website-specific info
        if (window.location.hostname.includes('reddit')) {
            content.siteType = 'reddit';
            content.posts = document.querySelectorAll('.Post, [data-testid="post"]').length;
            content.upvoteButtons = document.querySelectorAll('.upvote, [aria-label*="upvote"]').length;
        } else if (window.location.hostname.includes('quiz') || document.querySelectorAll('.question, .quiz').length > 0) {
            content.siteType = 'quiz';
        } else if (document.querySelectorAll('form').length > 0) {
            content.siteType = 'form';
        }

        return content;
    }

    // Return the page content and make agent available
    return {
        ...getPageContent(),
        agentAvailable: !!window.webPageAgent
    };
})();