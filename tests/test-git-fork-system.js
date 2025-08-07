const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');

describe('Git-like Fork System', () => {
  let browser;
  let page;
  let server;

  beforeAll(async () => {
    // Start the server
    server = spawn('npm', ['run', 'dev'], {
      cwd: path.resolve(__dirname, '..'),
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
    await page.setViewport({ width: 1400, height: 900 });
  });

  afterAll(async () => {
    if (browser) await browser.close();
    if (server) server.kill();
  });

  test('Should display new branch visualization layout', async () => {
    await page.goto('http://localhost:3000/chat');
    
    // Check that all main UI elements are present
    await page.waitForSelector('.sidebar');
    await page.waitForSelector('.branch-panel');
    await page.waitForSelector('.chat-area');
    
    // Check branch tree is visible
    const branchTree = await page.$('.branch-tree');
    expect(branchTree).toBeTruthy();
    
    // Check active branch indicator
    const branchIndicator = await page.$('.active-branch-indicator');
    expect(branchIndicator).toBeTruthy();
    
    const indicatorText = await page.$eval('.active-branch-indicator .branch-name', el => el.textContent);
    expect(indicatorText).toBe('Main Thread');
  });

  test('Should create a new conversation and show main thread', async () => {
    await page.goto('http://localhost:3000/chat');
    
    // Send first message
    await page.type('#chatInput', 'Hello, this is a test conversation for the new fork system.');
    await page.click('#sendBtn');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    
    // Check that branch tree shows main thread
    const mainThreadNode = await page.$('.branch-node.main-thread');
    expect(mainThreadNode).toBeTruthy();
    
    const mainThreadText = await page.$eval('.branch-node.main-thread .branch-name', el => el.textContent);
    expect(mainThreadText).toBe('Main Thread');
    
    // Check message count
    const messageCount = await page.$eval('.branch-node.main-thread .branch-info', el => el.textContent);
    expect(messageCount).toContain('2 msgs'); // User + Assistant
  });

  test('Should create a branch from selected text', async () => {
    await page.goto('http://localhost:3000/chat');
    
    // Send a message first
    await page.type('#chatInput', 'Tell me about artificial intelligence and machine learning.');
    await page.click('#sendBtn');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    
    // Select text from the assistant's response
    const assistantMessage = await page.$('.message.assistant .message-content');
    
    // Simulate text selection
    await page.evaluate((element) => {
      const range = document.createRange();
      const selection = window.getSelection();
      
      // Select first 20 characters of the assistant's response
      const textNode = element.firstChild;
      range.setStart(textNode, 0);
      range.setEnd(textNode, Math.min(20, textNode.textContent.length));
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger mouseup event to show selection popup
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    }, assistantMessage);
    
    // Wait for selection popup
    await page.waitForSelector('.selection-popup:not(.hidden)', { timeout: 2000 });
    
    // Click create branch button
    await page.click('#createBranchBtn');
    
    // Wait for popup input to appear
    await page.waitForSelector('#popupInput:not(.hidden)');
    
    // Type a question for the branch
    await page.type('#popupTextarea', 'Can you explain this in more detail?');
    
    // Confirm branch creation
    await page.click('#confirmPopupBtn');
    
    // Wait for branch to be created and UI to update
    await page.waitForTimeout(1000);
    
    // Check that a new branch appears in the tree
    const branchNodes = await page.$$('.branch-node:not(.main-thread)');
    expect(branchNodes.length).toBe(1);
    
    // Check that the branch is now active
    const activeBranch = await page.$('.branch-node.active:not(.main-thread)');
    expect(activeBranch).toBeTruthy();
    
    // Check active branch indicator updated
    const indicatorText = await page.$eval('.active-branch-indicator .branch-name', el => el.textContent);
    expect(indicatorText).toContain('Fork:');
  });

  test('Should switch between main thread and branch', async () => {
    await page.goto('http://localhost:3000/chat');
    
    // Create a conversation with a branch (reuse previous test logic)
    await page.type('#chatInput', 'What is the weather like today?');
    await page.click('#sendBtn');
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    
    // Create a branch
    const assistantMessage = await page.$('.message.assistant .message-content');
    await page.evaluate((element) => {
      const range = document.createRange();
      const selection = window.getSelection();
      const textNode = element.firstChild;
      range.setStart(textNode, 0);
      range.setEnd(textNode, 15);
      selection.removeAllRanges();
      selection.addRange(range);
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    }, assistantMessage);
    
    await page.waitForSelector('.selection-popup:not(.hidden)');
    await page.click('#createBranchBtn');
    await page.waitForSelector('#popupInput:not(.hidden)');
    await page.type('#popupTextarea', 'Tell me more about weather patterns');
    await page.click('#confirmPopupBtn');
    await page.waitForTimeout(1000);
    
    // Now test switching
    // Click on main thread node
    await page.click('.branch-node.main-thread');
    await page.waitForTimeout(500);
    
    // Check that main thread is now active
    const mainThreadActive = await page.$('.branch-node.main-thread.active');
    expect(mainThreadActive).toBeTruthy();
    
    // Check indicator shows main thread
    let indicatorText = await page.$eval('.active-branch-indicator .branch-name', el => el.textContent);
    expect(indicatorText).toBe('Main Thread');
    
    // Click on branch node
    await page.click('.branch-node:not(.main-thread)');
    await page.waitForTimeout(500);
    
    // Check that branch is now active
    const branchActive = await page.$('.branch-node.active:not(.main-thread)');
    expect(branchActive).toBeTruthy();
    
    // Check indicator shows branch
    indicatorText = await page.$eval('.active-branch-indicator .branch-name', el => el.textContent);
    expect(indicatorText).toContain('Fork:');
  });

  test('Should show context menu on branch right-click', async () => {
    await page.goto('http://localhost:3000/chat');
    
    // Create conversation and branch
    await page.type('#chatInput', 'Explain quantum computing');
    await page.click('#sendBtn');
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    
    // Create branch
    const assistantMessage = await page.$('.message.assistant .message-content');
    await page.evaluate((element) => {
      const range = document.createRange();
      const selection = window.getSelection();
      const textNode = element.firstChild;
      range.setStart(textNode, 0);
      range.setEnd(textNode, 10);
      selection.removeAllRanges();
      selection.addRange(range);
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    }, assistantMessage);
    
    await page.waitForSelector('.selection-popup:not(.hidden)');
    await page.click('#createBranchBtn');
    await page.waitForSelector('#popupInput:not(.hidden)');
    await page.click('#confirmPopupBtn');
    await page.waitForTimeout(1000);
    
    // Right-click on branch node
    const branchNode = await page.$('.branch-node:not(.main-thread)');
    await branchNode.click({ button: 'right' });
    
    // Check context menu appears
    await page.waitForSelector('.context-menu:not(.hidden)');
    
    // Check context menu items
    const switchItem = await page.$('#switchToBranchBtn');
    const mergeItem = await page.$('#mergeBranchBtn');
    const deleteItem = await page.$('#deleteBranchBtn');
    
    expect(switchItem).toBeTruthy();
    expect(mergeItem).toBeTruthy();
    expect(deleteItem).toBeTruthy();
  });

  test('Should merge branch back to main thread', async () => {
    await page.goto('http://localhost:3000/chat');
    
    // Create conversation and branch with messages
    await page.type('#chatInput', 'Tell me about space exploration');
    await page.click('#sendBtn');
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    
    // Create branch
    const assistantMessage = await page.$('.message.assistant .message-content');
    await page.evaluate((element) => {
      const range = document.createRange();
      const selection = window.getSelection();
      const textNode = element.firstChild;
      range.setStart(textNode, 0);
      range.setEnd(textNode, 10);
      selection.removeAllRanges();
      selection.addRange(range);
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    }, assistantMessage);
    
    await page.waitForSelector('.selection-popup:not(.hidden)');
    await page.click('#createBranchBtn');
    await page.waitForSelector('#popupInput:not(.hidden)');
    await page.type('#popupTextarea', 'What about Mars missions specifically?');
    await page.click('#confirmPopupBtn');
    await page.waitForTimeout(1000);
    
    // Send message in branch
    await page.type('#chatInput', 'Focus on recent Mars rover missions');
    await page.click('#sendBtn');
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    
    // Right-click branch and merge
    const branchNode = await page.$('.branch-node:not(.main-thread)');
    await branchNode.click({ button: 'right' });
    await page.waitForSelector('.context-menu:not(.hidden)');
    await page.click('#mergeBranchBtn');
    
    // Wait for merge modal
    await page.waitForSelector('.modal:not(.hidden)');
    
    // Confirm merge
    await page.click('#confirmMergeBtn');
    await page.waitForTimeout(1000);
    
    // Check that branch is gone from tree
    const branchNodes = await page.$$('.branch-node:not(.main-thread)');
    expect(branchNodes.length).toBe(0);
    
    // Check that we're back on main thread
    const indicatorText = await page.$eval('.active-branch-indicator .branch-name', el => el.textContent);
    expect(indicatorText).toBe('Main Thread');
    
    // Check that main thread has more messages now
    const messageCount = await page.$eval('.branch-node.main-thread .branch-info', el => el.textContent);
    expect(messageCount).toContain('msgs'); // Should have merged messages
  });

  test('Should handle inline questions', async () => {
    await page.goto('http://localhost:3000/chat');
    
    // Send message
    await page.type('#chatInput', 'Explain photosynthesis in plants');
    await page.click('#sendBtn');
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    
    // Select text and ask inline question
    const assistantMessage = await page.$('.message.assistant .message-content');
    await page.evaluate((element) => {
      const range = document.createRange();
      const selection = window.getSelection();
      const textNode = element.firstChild;
      range.setStart(textNode, 0);
      range.setEnd(textNode, 15);
      selection.removeAllRanges();
      selection.addRange(range);
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    }, assistantMessage);
    
    await page.waitForSelector('.selection-popup:not(.hidden)');
    await page.click('#askInlineBtn');
    await page.waitForSelector('#popupInput:not(.hidden)');
    await page.type('#popupTextarea', 'What role does chlorophyll play?');
    await page.click('#confirmPopupBtn');
    
    // Wait for inline response
    await page.waitForSelector('.inline-question-container', { timeout: 10000 });
    
    // Check that inline response appears
    const inlineResponse = await page.$('.inline-response-content');
    expect(inlineResponse).toBeTruthy();
    
    const responseText = await page.$eval('.inline-response-content', el => el.textContent);
    expect(responseText.length).toBeGreaterThan(0);
    expect(responseText).not.toContain('Error:');
  });
});
