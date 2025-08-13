# Interactive Web Agent Workflow

## Overview
This workflow describes how your Chrome extension's agent mode should operate to intelligently analyze user queries, plan actions, and execute tasks on webpages.

## Core Architecture

```
User Input → Query Analysis → Task Planning → Action Execution → Result Verification → Report Generation
```

## Detailed Workflow

### Phase 1: Query Reception & Initial Analysis

#### 1.1 Input Processing
- **Trigger**: User enters task in Agent Mode and clicks "Execute Agent"
- **Input Sources**:
  - User's natural language query/task
  - Current webpage content (DOM, text, images)
  - Page metadata (URL, title, site type)
  - Available interactive elements

#### 1.2 Context Gathering
```javascript
// Enhanced context gathering
const contextData = {
  userQuery: task,
  pageContent: {
    text: document.body.innerText,
    url: window.location.href,
    title: document.title,
    siteType: detectSiteType(), // reddit, quiz, form, etc.
  },
  availableElements: {
    buttons: getClickableElements('button'),
    inputs: getInteractiveInputs(),
    forms: getFormElements(),
    links: getNavigationLinks(),
    customElements: getSiteSpecificElements()
  },
  pageState: getCurrentPageState()
}
```

### Phase 2: Intelligent Task Analysis

#### 2.1 Query Understanding (Gemini API Call #1)
**Purpose**: Understand what the user wants to accomplish

**Prompt Structure**:
```
You are an AI web automation specialist. Analyze this task and webpage:

TASK: "${userQuery}"
WEBPAGE: ${pageContext}

Classify the task type and provide a structured analysis:
1. Task Category: [quiz, voting, form_filling, navigation, data_extraction, interaction, complex]
2. Confidence Level: [0-1]
3. Required Actions: [list of high-level actions]
4. Prerequisites: [any conditions that must be met]
5. Success Criteria: [how to determine if task completed successfully]
6. Risk Assessment: [potential issues or limitations]

Respond in JSON format.
```

#### 2.2 Decision Tree Logic
```javascript
const analyzeTask = (analysis) => {
  switch(analysis.taskCategory) {
    case 'quiz':
      return planQuizStrategy(analysis);
    case 'voting':
      return planVotingStrategy(analysis);
    case 'form_filling':
      return planFormStrategy(analysis);
    case 'navigation':
      return planNavigationStrategy(analysis);
    case 'complex':
      return planComplexStrategy(analysis);
    default:
      return planGenericStrategy(analysis);
  }
}
```

### Phase 3: Dynamic Action Planning

#### 3.1 Detailed Action Plan Generation (Gemini API Call #2)
**Purpose**: Create specific, executable action steps

**Enhanced Prompt**:
```
Based on the task analysis, create a detailed execution plan:

TASK: "${userQuery}"
ANALYSIS: ${taskAnalysis}
PAGE_ELEMENTS: ${availableElements}

Generate a step-by-step action plan with:
1. Precise element selectors
2. Action types (click, type, select, scroll, wait)
3. Values/inputs required
4. Verification steps
5. Error handling fallbacks
6. Timing considerations

Format as executable JSON with detailed instructions.
```

#### 3.2 Plan Validation & Safety Checks
```javascript
const validatePlan = (actionPlan) => {
  // Safety checks
  if (containsDestructiveActions(actionPlan)) {
    return { valid: false, reason: 'Contains potentially harmful actions' };
  }
  
  // Feasibility checks
  if (!elementsExistOnPage(actionPlan.requiredElements)) {
    return { valid: false, reason: 'Required elements not found' };
  }
  
  // Logic validation
  if (!logicalActionSequence(actionPlan.steps)) {
    return { valid: false, reason: 'Action sequence is illogical' };
  }
  
  return { valid: true };
}
```

### Phase 4: Intelligent Action Execution

#### 4.1 Pre-Execution Setup
```javascript
const prepareExecution = async (actionPlan) => {
  // Store initial page state
  const initialState = capturePageState();
  
  // Setup monitoring
  setupActionMonitoring();
  
  // Prepare rollback mechanism
  setupRollbackCapability();
  
  return { initialState, monitors: true, rollback: true };
}
```

#### 4.2 Smart Execution Engine
```javascript
const executeWithIntelligence = async (actionPlan) => {
  for (let step of actionPlan.steps) {
    try {
      // Pre-action validation
      await validateStepPreconditions(step);
      
      // Execute action with enhanced error handling
      const result = await executeActionSmart(step);
      
      // Post-action verification
      await verifyStepCompletion(step, result);
      
      // Adaptive waiting
      await intelligentWait(step.waitConditions);
      
      // Progress reporting
      reportProgress(step, result);
      
    } catch (error) {
      // Intelligent error recovery
      const recovery = await attemptErrorRecovery(step, error);
      if (!recovery.success) {
        throw new AgentExecutionError(step, error, recovery);
      }
    }
  }
}
```

#### 4.3 Enhanced Element Finding Strategy
```javascript
const findElementIntelligently = (selector, description, context) => {
  // Multi-strategy approach
  const strategies = [
    () => document.querySelector(selector), // Direct selector
    () => findByDescription(description), // Text-based search
    () => findByVisualPattern(context), // Visual analysis
    () => findBySemanticContext(context), // Context-aware search
    () => findBySimilarity(selector), // Similar elements
    () => findByAIAssistance(description) // AI-powered search
  ];
  
  for (let strategy of strategies) {
    const element = strategy();
    if (element && isElementInteractable(element)) {
      return element;
    }
  }
  
  return null;
}
```

### Phase 5: Real-time Monitoring & Adaptation

#### 5.1 Action Monitoring
```javascript
const monitorExecution = {
  trackPageChanges: () => {
    // Monitor DOM mutations
    // Track URL changes
    // Watch for loading states
  },
  
  detectErrors: () => {
    // Watch for error messages
    // Monitor console errors
    // Detect failed actions
  },
  
  assessProgress: () => {
    // Measure completion percentage
    // Validate intermediate results
    // Check success criteria
  }
}
```

#### 5.2 Adaptive Behavior
```javascript
const adaptToChanges = async (currentState, expectedState) => {
  if (pageChangedUnexpectedly(currentState, expectedState)) {
    // Re-analyze the page
    const newAnalysis = await reanalyzePageState();
    
    // Adjust action plan
    const adjustedPlan = await adaptActionPlan(newAnalysis);
    
    // Continue execution
    return adjustedPlan;
  }
}
```

### Phase 6: Verification & Reporting

#### 6.1 Success Verification (Gemini API Call #3)
**Purpose**: Verify task completion and generate insights

**Verification Prompt**:
```
ORIGINAL_TASK: "${originalTask}"
ACTIONS_TAKEN: ${executionHistory}
CURRENT_PAGE_STATE: ${finalPageState}

Analyze whether the task was completed successfully:
1. Completion Status: [success/partial/failed]
2. Actions Effectiveness: Rate each action's success
3. Unexpected Outcomes: Any unintended results
4. Recommendations: Suggestions for improvement
5. User Report: Clear summary for the user

Provide analysis in structured format.
```

#### 6.2 Comprehensive Reporting
```javascript
const generateAgentReport = (taskResults, verification) => {
  return {
    executionSummary: {
      taskDescription: originalTask,
      completionStatus: verification.status,
      totalActions: actionHistory.length,
      successRate: calculateSuccessRate(),
      executionTime: getExecutionDuration()
    },
    
    detailedResults: {
      successfulActions: getSuccessfulActions(),
      failedActions: getFailedActions(),
      unexpectedOutcomes: verification.unexpected,
      pageStateChanges: getPageStateChanges()
    },
    
    insights: {
      efficiencyScore: calculateEfficiency(),
      recommendations: verification.recommendations,
      learnings: extractLearnings()
    },
    
    userFriendlyReport: generateUserReport(verification)
  }
}
```

## Enhanced Error Handling & Recovery

### Error Classification System
```javascript
const ERROR_TYPES = {
  ELEMENT_NOT_FOUND: 'element_missing',
  ACTION_FAILED: 'action_execution_failed',
  PAGE_CHANGED: 'unexpected_page_change',
  PERMISSION_DENIED: 'insufficient_permissions',
  NETWORK_ERROR: 'network_connectivity',
  RATE_LIMITED: 'api_rate_limit'
}

const handleError = async (error, context) => {
  const errorType = classifyError(error);
  const recoveryStrategy = getRecoveryStrategy(errorType);
  
  return await executeRecovery(recoveryStrategy, context);
}
```

### Smart Recovery Mechanisms
```javascript
const recoveryStrategies = {
  element_missing: async (context) => {
    // Try alternative selectors
    // Wait for dynamic content
    // Re-analyze page structure
    return await findAlternativeElement(context);
  },
  
  action_execution_failed: async (context) => {
    // Try different interaction methods
    // Check element state changes
    // Simulate user behavior
    return await retryWithAlternativeMethod(context);
  },
  
  unexpected_page_change: async (context) => {
    // Re-analyze current page
    // Adjust action plan
    // Continue from current state
    return await adaptToNewPageState(context);
  }
}
```

## Implementation Priorities

### Phase 1 (Core): Basic Agent Loop
1. Enhanced query analysis with Gemini
2. Simple action planning and execution
3. Basic error handling and reporting

### Phase 2 (Intelligence): Smart Execution
1. Advanced element finding strategies
2. Adaptive behavior and error recovery
3. Real-time monitoring and adjustment

### Phase 3 (Optimization): Advanced Features
1. Learning from previous executions
2. Site-specific optimization
3. Complex task decomposition

## Integration Points with Your Current Code

### Modify `executeTask` Method
```javascript
async executeTask(task, context, apiKey) {
  // Phase 1: Enhanced Analysis
  const analysis = await this.analyzeTaskWithGemini(task, context, apiKey);
  
  // Phase 2: Intelligent Planning
  const actionPlan = await this.createDetailedPlan(analysis, apiKey);
  
  // Phase 3: Smart Execution
  const results = await this.executeWithIntelligence(actionPlan);
  
  // Phase 4: Verification
  const verification = await this.verifyCompletion(task, results, apiKey);
  
  // Phase 5: Reporting
  return this.generateComprehensiveReport(verification);
}
```

### Enhanced Gemini Integration
```javascript
async analyzeTaskWithGemini(task, context, apiKey) {
  const analysisPrompt = this.buildAnalysisPrompt(task, context);
  const response = await this.callGeminiAPI(analysisPrompt, apiKey);
  return this.parseAnalysisResponse(response);
}

async createDetailedPlan(analysis, apiKey) {
  const planningPrompt = this.buildPlanningPrompt(analysis);
  const response = await this.callGeminiAPI(planningPrompt, apiKey);
  return this.parseActionPlan(response);
}

async verifyCompletion(task, results, apiKey) {
  const verificationPrompt = this.buildVerificationPrompt(task, results);
  const response = await this.callGeminiAPI(verificationPrompt, apiKey);
  return this.parseVerificationResult(response);
}
```

This workflow transforms your agent from a simple task executor into an intelligent, adaptive system that can handle complex web interactions with high reliability and user satisfaction.