# AI Agent Chrome Extension

An advanced Chrome extension that combines traditional Q&A capabilities with intelligent automation. The AI agent can analyze webpages, answer questions, and perform automated actions like filling forms, answering quizzes, voting on posts, and interacting with various page elements.

## 🚀 Features

### Standard Q&A Mode
- Ask questions about webpage content
- Analyze images on the page
- Support for multiple Gemini models
- Intelligent content extraction

### 🤖 Agent Mode (NEW!)
- **Automated Quiz Solving**: "Answer all the quiz questions on this page"
- **Social Media Interaction**: "Upvote the first 5 posts on this Reddit page"
- **Form Filling**: "Fill out this contact form with test data"
- **Generic Interactions**: "Click all the 'Read More' buttons"
- **Smart Element Detection**: Automatically finds and interacts with relevant page elements
- **Action Reporting**: Detailed reports of all actions performed

## 📋 Supported Agent Tasks

### Quiz & Survey Automation
```
"Choose the correct answers for all these questions"
"Complete this quiz with the best answers"
"Select all checkboxes in this survey"
```

### Social Media Automation
```
"Upvote the first 10 posts"
"Like all posts on this page"
"Follow the first 5 suggested users"
```

### Form Automation
```
"Fill out this registration form"
"Complete the contact form with test data"
"Submit this application with sample information"
```

### Generic Interactions
```
"Click all 'Show More' buttons"
"Expand all collapsed sections"
"Select all items in the list"
```

## 🛠️ Installation

1. **Download the extension files**:
   - `manifest.json`
   - `popup.html`
   - `popup.js` (updated version)
   - `content.js` (enhanced with agent capabilities)

2. **Get a Gemini API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Replace `YOUR_API_KEY_HERE` in `popup.js` with your actual API key

3. **Load the extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the folder containing your extension files
   - The extension icon should appear in your browser toolbar

## 🎯 Usage

### Standard Mode
1. Navigate to any webpage
2. Click the extension icon
3. Leave Agent Mode OFF
4. Type your question about the page
5. Optionally select images to analyze
6. Click "Ask Gemini"

### Agent Mode
1. Navigate to any webpage with interactive elements
2. Click the extension icon
3. Toggle Agent Mode ON
4. Enter a task (see examples above)
5. Click "Execute Agent"
6. Watch as the AI performs actions automatically
7. Review the detailed report of actions taken

## 📊 Agent Capabilities

### Intelligent Element Detection
The agent can automatically find and interact with:

- **Quiz Elements**: Radio buttons, checkboxes, dropdown menus
- **Social Media Elements**: Upvote/downvote buttons, like buttons, follow buttons
- **Form Elements**: Text inputs, email fields, phone numbers, text areas
- **Navigation Elements**: Buttons, links, menu items
- **Interactive Elements**: Expandable sections, tabs, modals

### Smart Task Analysis
The agent analyzes your task description and:

1. **Identifies Task Type**: Quiz, voting, form-filling, or generic interaction
2. **Locates Relevant Elements**: Uses multiple strategies to find target elements
3. **Executes Actions Safely**: Performs actions with proper delays and error handling
4. **Provides Detailed Reports**: Shows exactly what was accomplished

### Website-Specific Optimizations
- **Reddit**: Optimized selectors for posts, upvote buttons, comments
- **Quiz Platforms**: Enhanced detection for question formats
- **Form Sites**: Intelligent form field recognition and filling
- **E-commerce**: Product interaction, cart management
- **Social Networks**: Post interactions, user following

## 🔧 Configuration

### Model Selection
Choose from multiple Gemini models based on your needs:
- **Gemini 2.5 Pro**: Best quality, largest context
- **Gemini 2.5 Flash**: Balanced performance
- **Gemini 2.5 Flash-Lite**: Fastest execution
- **Gemini 2.0 Flash**: Legacy support

### Agent Settings
- **Safety Mode**: Built-in delays and error handling
- **Element Limits**: Prevents overwhelming interactions
- **Action History**: Complete log of performed actions
- **Smart Fallbacks**: Multiple strategies for element detection

## 🛡️ Safety Features

### Built-in Protections
- **Rate Limiting**: Delays between actions to prevent overwhelming websites
- **Element Validation**: Checks if elements are clickable and visible
- **Error Handling**: Graceful failure recovery
- **Action Limits**: Maximum number of actions per task
- **Website Respect**: Follows website interaction patterns

### User Control
- **Preview Mode**: See what actions will be performed (future feature)
- **Action Confirmation**: Option to confirm before execution (future feature)
- **Stop Button**: Ability to halt agent execution (future feature)
- **Detailed Logging**: Complete record of all actions

## 🔍 Examples

### Example 1: Quiz Automation
**Task**: "Answer all questions on this quiz page"
**Result**: 
- Found 15 quiz questions
- Selected optimal answers for each
- Submitted 12 successful responses
- Skipped 3 already answered questions

### Example 2: Reddit Interaction
**Task**: "Upvote the first 5 posts on this subreddit"
**Result**:
- Located 8 posts on the page
- Successfully upvoted first 5 posts
- Avoided already upvoted posts
- Completed task in 12 seconds

### Example 3: Form Filling
**Task**: "Fill out the contact form with test data"
**Result**:
- Found contact form with 6 fields
- Filled name, email, phone, address fields
- Selected appropriate dropdown options
- Ready for manual review before submission

## 🚨 Important Notes

### Ethical Usage
- Only use on websites you own or have permission to interact with
- Respect website terms of service
- Don't use for spamming or malicious activities
- Be mindful of rate limits and website performance

### Limitations
- Cannot solve CAPTCHAs or other anti-bot measures
- May not work on heavily JavaScript-dependent sites
- Performance varies based on website structure
- Some actions may require manual verification

### Privacy
- All processing happens locally in your browser
- API calls only go to Google's Gemini service
- No data is stored or transmitted to third parties
- Extension only accesses current active tab

## 🔧 Troubleshooting

### Common Issues

**Agent not working**: 
- Check if the webpage has loaded completely
- Try refreshing the page and re-opening the extension
- Verify Agent Mode is toggled ON

**No elements found**:
- The website might use non-standard element structures
- Try more specific task descriptions
- Some sites block automated interactions

**API errors**:
- Verify your Gemini API key is correct
- Check your internet connection
- Ensure you haven't exceeded API quotas

**Actions not performing**:
- Some elements might be protected against automation
- Website might require user interaction first
- Try breaking complex tasks into smaller steps

## 📈 Future Enhancements

### Planned Features
- **Visual Task Designer**: Drag-and-drop task creation
- **Custom Scripts**: User-defined automation sequences
- **Scheduling**: Timed execution of tasks
- **Multi-page Workflows**: Tasks spanning multiple pages
- **Advanced AI Models**: Integration with newer AI capabilities

### Community Features
- **Task Sharing**: Share successful automation scripts
- **Website Templates**: Pre-configured setups for popular sites
- **Plugin System**: Community-developed extensions
- **Advanced Analytics**: Detailed performance metrics

## 📝 Contributing

This project is open for contributions:
- Report bugs and issues
- Suggest new features
- Submit website-specific optimizations
- Improve documentation
- Add new automation patterns

## ⚖️ License

Use responsibly and in accordance with website terms of service and applicable laws.

---

**Version**: 2.0  
**Last Updated**: January 2025  
**Compatibility**: Chrome 88+, Manifest V3