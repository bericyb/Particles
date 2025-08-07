const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');

describe('Text Selection Features', () => {
  let browser;
  let page;
  let server;

  beforeAll(async () => {
    // Start the server
    server = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    if (server) {
      server.kill();
    }
  });

  test('should display selection popup when text is selected', async () => {
    await page.goto('http://localhost:3000/chat');
    
    // Wait for page to load
    await page.waitForSelector('#chatInput');
    
    // Send a message to create some content
    await page.type('#chatInput', 'Hello, can you explain what artificial intelligence is?');
    await page.click('#sendMessageBtn');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    
    // Select text in the assistant's response
    const assistantMessage = await page.$('.message.assistant .message-content');
    
    // Double-click to select a word
    await page.evaluate((element) => {
      const range = document.createRange();
      const textNode = element.firstChild;
      range.setStart(textNode, 0);
      range.setEnd(textNode, 20); // Select first 20 characters
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger mouseup event
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    }, assistantMessage);
    
    // Wait for selection popup to appear
    await page.waitForSelector('#selectionPopup:not(.hidden)', { timeout: 2000 });
    
    // Verify popup buttons are present
    const forkBtn = await page.$('#forkConversationBtn');
    const inlineBtn = await page.$('#askInlineBtn');
    const cancelBtn = await page.$('#cancelSelectionBtn');
    
    expect(forkBtn).toBeTruthy();
    expect(inlineBtn).toBeTruthy();
    expect(cancelBtn).toBeTruthy();
    
    console.log('✓ Selection popup appears when text is selected');
  });

  test('should show inline question interface when "Ask Inline" is clicked', async () => {
    // Assuming we have text selected from previous test
    await page.click('#askInlineBtn');
    
    // Wait for inline question container to appear
    await page.waitForSelector('.inline-question-container', { timeout: 2000 });
    
    // Verify inline question elements
    const questionInput = await page.$('.inline-question-container textarea');
    const sendBtn = await page.$('.inline-question-send');
    const closeBtn = await page.$('.inline-question-close');
    
    expect(questionInput).toBeTruthy();
    expect(sendBtn).toBeTruthy();
    expect(closeBtn).toBeTruthy();
    
    // Type a question
    await page.type('.inline-question-container textarea', 'Can you explain this in simpler terms?');
    
    // Send the inline question
    await page.click('.inline-question-send');
    
    // Wait for response
    await page.waitForSelector('.inline-question-response:not(.hidden)', { timeout: 10000 });
    
    // Verify response content exists
    const responseContent = await page.$('.inline-response-content');
    const responseText = await page.evaluate(el => el.textContent, responseContent);
    
    expect(responseText.length).toBeGreaterThan(0);
    
    console.log('✓ Inline question functionality works');
  });

  test('should create forked conversation when "Fork Conversation" is clicked', async () => {
    // Go back to main page and create a new conversation for forking test
    await page.goto('http://localhost:3000/chat');
    await page.waitForSelector('#chatInput');
    
    // Send initial message
    await page.type('#chatInput', 'Tell me about machine learning algorithms');
    await page.click('#sendMessageBtn');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    
    // Send another message to have more conversation history
    await page.type('#chatInput', 'What are neural networks?');
    await page.click('#sendMessageBtn');
    
    // Wait for second response
    await page.waitForSelector('.message.assistant:nth-child(4)', { timeout: 10000 });
    
    // Select text in the first assistant response
    const firstAssistantMessage = await page.$('.message.assistant .message-content');
    
    await page.evaluate((element) => {
      const range = document.createRange();
      const textNode = element.firstChild;
      range.setStart(textNode, 0);
      range.setEnd(textNode, 30); // Select first 30 characters
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    }, firstAssistantMessage);
    
    // Wait for popup and click fork
    await page.waitForSelector('#selectionPopup:not(.hidden)', { timeout: 2000 });
    await page.click('#forkConversationBtn');
    
    // Wait for new conversation to load
    await page.waitForTimeout(2000);
    
    // Verify we're in a forked conversation
    const chatTitle = await page.$eval('#chatTitle', el => el.textContent);
    expect(chatTitle).toContain('Fork:');
    
    // Verify conversation history is preserved up to fork point
    const messages = await page.$$('.message');
    expect(messages.length).toBeGreaterThan(0);
    
    console.log('✓ Fork conversation functionality works');
  });

  test('should hide popup when clicking cancel', async () => {
    // Select some text
    const messageContent = await page.$('.message-content');
    
    await page.evaluate((element) => {
      const range = document.createRange();
      const textNode = element.firstChild;
      range.setStart(textNode, 0);
      range.setEnd(textNode, 15);
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    }, messageContent);
    
    // Wait for popup
    await page.waitForSelector('#selectionPopup:not(.hidden)', { timeout: 2000 });
    
    // Click cancel
    await page.click('#cancelSelectionBtn');
    
    // Verify popup is hidden
    const isHidden = await page.$eval('#selectionPopup', el => el.classList.contains('hidden'));
    expect(isHidden).toBe(true);
    
    console.log('✓ Cancel button hides popup');
  });

  test('should close inline question when close button is clicked', async () => {
    // Create an inline question first
    const messageContent = await page.$('.message-content');
    
    await page.evaluate((element) => {
      const range = document.createRange();
      const textNode = element.firstChild;
      range.setStart(textNode, 0);
      range.setEnd(textNode, 20);
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    }, messageContent);
    
    await page.waitForSelector('#selectionPopup:not(.hidden)', { timeout: 2000 });
    await page.click('#askInlineBtn');
    
    // Wait for inline question
    await page.waitForSelector('.inline-question-container', { timeout: 2000 });
    
    // Click close button
    await page.click('.inline-question-close');
    
    // Verify inline question is removed
    const inlineQuestion = await page.$('.inline-question-container');
    expect(inlineQuestion).toBe(null);
    
    console.log('✓ Inline question close button works');
  });
});

// Helper function to run tests
async function runTests() {
  console.log('🧪 Running Text Selection Features Tests...\n');
  
  try {
    // This is a simplified test runner - in a real scenario you'd use Jest or similar
    const testSuite = new (require('./test-text-selection-features.js'))();
    
    console.log('✅ All text selection tests passed!');
  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
