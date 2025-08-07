const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');

describe('Multi-Level Branching System', () => {
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

  test('Should create a basic conversation with main thread', async () => {
    await page.goto('http://localhost:3000/chat');
    
    // Send first message
    await page.type('#chatInput', 'Tell me about artificial intelligence and its applications.');
    await page.click('#sendBtn');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    
    // Check that main thread is shown
    const mainThreadNode = await page.$('.branch-node.main-thread');
    expect(mainThreadNode).toBeTruthy();
    
    const mainThreadText = await page.$eval('.branch-node.main-thread .branch-name', el => el.textContent);
    expect(mainThreadText).toBe('Main Thread');
    
    // Check message count
    const messageCount = await page.$eval('.branch-node.main-thread .branch-info', el => el.textContent);
    expect(messageCount).toContain('2 msgs'); // User + Assistant
  });

  test('Should create first-level branch from main thread', async () => {
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
    await page.type('#popupTextarea', 'Can you focus specifically on machine learning applications?');
    
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
    
    // Check that branch has proper indentation (nested-branch class)
    const nestedBranch = await page.$('.branch-node.nested-branch');
    expect(nestedBranch).toBeTruthy();
    
    // Check depth indicator
    const depthIndicator = await page.$('.depth-indicator');
    expect(depthIndicator).toBeTruthy();
    const depthText = await page.$eval('.depth-indicator', el => el.textContent);
    expect(depthText).toBe('L1');
  });

  test('Should send message in first-level branch', async () => {
    // Send a message in the branch
    await page.type('#chatInput', 'What are some specific examples of machine learning in healthcare?');
    await page.click('#sendBtn');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    
    // Check that we now have more messages in the branch
    const branchInfo = await page.$eval('.branch-node.active .branch-info', el => el.textContent);
    expect(branchInfo).toContain('2 msgs'); // Initial branch message + new message pair
  });

  test('Should create second-level branch from first-level branch', async () => {
    // Select text from the latest assistant response
    const assistantMessages = await page.$$('.message.assistant .message-content');
    const latestMessage = assistantMessages[assistantMessages.length - 1];
    
    // Simulate text selection
    await page.evaluate((element) => {
      const range = document.createRange();
      const selection = window.getSelection();
      
      // Select first 15 characters
      const textNode = element.firstChild;
      range.setStart(textNode, 0);
      range.setEnd(textNode, Math.min(15, textNode.textContent.length));
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    }, latestMessage);
    
    // Wait for selection popup
    await page.waitForSelector('.selection-popup:not(.hidden)', { timeout: 2000 });
    
    // Click create branch button
    await page.click('#createBranchBtn');
    
    // Wait for popup input to appear
    await page.waitForSelector('#popupInput:not(.hidden)');
    
    // Type a question for the second-level branch
    await page.type('#popupTextarea', 'Tell me more about AI in medical imaging specifically.');
    
    // Confirm branch creation
    await page.click('#confirmPopupBtn');
    
    // Wait for branch to be created
    await page.waitForTimeout(1000);
    
    // Check that we now have 2 branches total
    const branchNodes = await page.$$('.branch-node:not(.main-thread)');
    expect(branchNodes.length).toBe(2);
    
    // Check that the new branch has L2 depth indicator
    const depthIndicators = await page.$$('.depth-indicator');
    expect(depthIndicators.length).toBe(2);
    
    // Find the L2 indicator
    const l2Indicator = await page.$eval('.branch-node.active .depth-indicator', el => el.textContent);
    expect(l2Indicator).toBe('L2');
    
    // Check that the second-level branch has more indentation
    const activeBranch = await page.$('.branch-node.active');
    const paddingLeft = await page.evaluate(el => {
      return window.getComputedStyle(el).paddingLeft;
    }, activeBranch);
    
    // Should have more padding than first level (20 + 16 + 16*2 = 52px)
    expect(parseInt(paddingLeft)).toBeGreaterThan(40);
  });

  test('Should send message in second-level branch', async () => {
    // Send a message in the second-level branch
    await page.type('#chatInput', 'How accurate are AI systems for detecting cancer in medical scans?');
    await page.click('#sendBtn');
    
    // Wait for response
    await page.waitForSelector('.message.assistant', { timeout: 10000 });
    
    // Check that the second-level branch now has messages
    const branchInfo = await page.$eval('.branch-node.active .branch-info', el => el.textContent);
    expect(branchInfo).toContain('2 msgs');
  });

  test('Should switch between different branch levels', async () => {
    // Click on main thread
    await page.click('.branch-node.main-thread');
    await page.waitForTimeout(500);
    
    // Check that main thread is now active
    const mainThreadActive = await page.$('.branch-node.main-thread.active');
    expect(mainThreadActive).toBeTruthy();
    
    // Check active branch indicator
    let indicatorText = await page.$eval('.active-branch-indicator .branch-name', el => el.textContent);
    expect(indicatorText).toBe('Main Thread');
    
    // Click on first-level branch (should be the first non-main branch)
    const firstLevelBranch = await page.$('.branch-node:not(.main-thread):not(.active)');
    await firstLevelBranch.click();
    await page.waitForTimeout(500);
    
    // Check that first-level branch is now active
    const firstLevelActive = await page.$('.branch-node.active .depth-indicator');
    const firstLevelDepth = await page.evaluate(el => el.textContent, firstLevelActive);
    expect(firstLevelDepth).toBe('L1');
    
    // Click on second-level branch
    const secondLevelBranch = await page.$('.branch-node:not(.active) .depth-indicator');
    if (secondLevelBranch) {
      const parentNode = await page.evaluateHandle(el => el.closest('.branch-node'), secondLevelBranch);
      await parentNode.click();
      await page.waitForTimeout(500);
      
      // Check that second-level branch is now active
      const secondLevelActive = await page.$('.branch-node.active .depth-indicator');
      const secondLevelDepth = await page.evaluate(el => el.textContent, secondLevelActive);
      expect(secondLevelDepth).toBe('L2');
    }
  });

  test('Should display correct message context for each branch level', async () => {
    // Switch to main thread and count messages
    await page.click('.branch-node.main-thread');
    await page.waitForTimeout(500);
    
    let messages = await page.$$('.message');
    const mainThreadMessageCount = messages.length;
    expect(mainThreadMessageCount).toBe(2); // Original user + assistant
    
    // Switch to first-level branch and count messages
    const firstLevelBranch = await page.$('.branch-node .depth-indicator');
    if (firstLevelBranch) {
      const parentNode = await page.evaluateHandle(el => el.closest('.branch-node'), firstLevelBranch);
      const depthText = await page.evaluate(el => el.textContent, firstLevelBranch);
      
      if (depthText === 'L1') {
        await parentNode.click();
        await page.waitForTimeout(500);
        
        messages = await page.$$('.message');
        const firstLevelMessageCount = messages.length;
        expect(firstLevelMessageCount).toBeGreaterThan(mainThreadMessageCount);
      }
    }
    
    // Switch to second-level branch and count messages
    const allDepthIndicators = await page.$$('.depth-indicator');
    for (let indicator of allDepthIndicators) {
      const depthText = await page.evaluate(el => el.textContent, indicator);
      if (depthText === 'L2') {
        const parentNode = await page.evaluateHandle(el => el.closest('.branch-node'), indicator);
        await parentNode.click();
        await page.waitForTimeout(500);
        
        messages = await page.$$('.message');
        const secondLevelMessageCount = messages.length;
        expect(secondLevelMessageCount).toBeGreaterThan(mainThreadMessageCount);
        break;
      }
    }
  });

  test('Should handle branch context menu for nested branches', async () => {
    // Right-click on a nested branch
    const nestedBranch = await page.$('.branch-node.nested-branch');
    await nestedBranch.click({ button: 'right' });
    
    // Check context menu appears
    await page.waitForSelector('.context-menu:not(.hidden)');
    
    // Check context menu items
    const switchItem = await page.$('#switchToBranchBtn');
    const mergeItem = await page.$('#mergeBranchBtn');
    const deleteItem = await page.$('#deleteBranchBtn');
    
    expect(switchItem).toBeTruthy();
    expect(mergeItem).toBeTruthy();
    expect(deleteItem).toBeTruthy();
    
    // Close context menu by clicking elsewhere
    await page.click('.messages-container');
    await page.waitForTimeout(500);
  });

  test('Should create third-level branch to test deep nesting', async () => {
    // Make sure we're on the second-level branch
    const allDepthIndicators = await page.$$('.depth-indicator');
    for (let indicator of allDepthIndicators) {
      const depthText = await page.evaluate(el => el.textContent, indicator);
      if (depthText === 'L2') {
        const parentNode = await page.evaluateHandle(el => el.closest('.branch-node'), indicator);
        await parentNode.click();
        await page.waitForTimeout(500);
        break;
      }
    }
    
    // Select text from a message in the second-level branch
    const assistantMessages = await page.$$('.message.assistant .message-content');
    const latestMessage = assistantMessages[assistantMessages.length - 1];
    
    await page.evaluate((element) => {
      const range = document.createRange();
      const selection = window.getSelection();
      
      const textNode = element.firstChild;
      range.setStart(textNode, 0);
      range.setEnd(textNode, Math.min(10, textNode.textContent.length));
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    }, latestMessage);
    
    // Wait for selection popup
    await page.waitForSelector('.selection-popup:not(.hidden)', { timeout: 2000 });
    
    // Click create branch button
    await page.click('#createBranchBtn');
    
    // Wait for popup input to appear
    await page.waitForSelector('#popupInput:not(.hidden)');
    
    // Type a question for the third-level branch
    await page.type('#popupTextarea', 'What about AI in radiology specifically?');
    
    // Confirm branch creation
    await page.click('#confirmPopupBtn');
    
    // Wait for branch to be created
    await page.waitForTimeout(1000);
    
    // Check that we now have 3 branches total
    const branchNodes = await page.$$('.branch-node:not(.main-thread)');
    expect(branchNodes.length).toBe(3);
    
    // Check that the new branch has L3 depth indicator
    const l3Indicator = await page.$eval('.branch-node.active .depth-indicator', el => el.textContent);
    expect(l3Indicator).toBe('L3');
    
    // Check that the third-level branch has even more indentation
    const activeBranch = await page.$('.branch-node.active');
    const paddingLeft = await page.evaluate(el => {
      return window.getComputedStyle(el).paddingLeft;
    }, activeBranch);
    
    // Should have even more padding (20 + 16 + 16*3 = 84px)
    expect(parseInt(paddingLeft)).toBeGreaterThan(60);
  });

  test('Should maintain proper tree structure visualization', async () => {
    // Check that all branches are properly nested visually
    const allBranches = await page.$$('.branch-node:not(.main-thread)');
    expect(allBranches.length).toBe(3);
    
    // Check depth indicators are correct
    const depthIndicators = await page.$$('.depth-indicator');
    const depths = [];
    
    for (let indicator of depthIndicators) {
      const depth = await page.evaluate(el => el.textContent, indicator);
      depths.push(depth);
    }
    
    expect(depths).toContain('L1');
    expect(depths).toContain('L2');
    expect(depths).toContain('L3');
    
    // Check that nested branches have the nested-branch class
    const nestedBranches = await page.$$('.branch-node.nested-branch');
    expect(nestedBranches.length).toBe(3); // All non-main branches should be nested
  });
});
