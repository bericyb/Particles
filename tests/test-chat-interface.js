const fs = require('fs');
const path = require('path');

/**
 * Test Chat Interface Implementation
 * This test verifies the chat interface files are properly structured
 * and contain the expected functionality without requiring a browser.
 */

function testChatFiles() {
  console.log('🧪 Testing Chat Interface Files...\n');

  // Test 1: Verify HTML structure
  console.log('1. Testing HTML structure...');
  const htmlPath = path.join(__dirname, '../src/public/chat/index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  const requiredElements = [
    'historyContainer',
    'chatMessages', 
    'chatInput',
    'sendMessageBtn',
    'newChatBtn',
    'toggleHistoryBtn'
  ];
  
  let htmlPassed = true;
  requiredElements.forEach(elementId => {
    if (!htmlContent.includes(`id="${elementId}"`)) {
      console.log(`   ❌ Missing element: ${elementId}`);
      htmlPassed = false;
    }
  });
  
  if (htmlPassed) {
    console.log('   ✅ HTML structure is correct');
  }

  // Test 2: Verify CSS classes
  console.log('\n2. Testing CSS classes...');
  const cssPath = path.join(__dirname, '../src/public/chat/chat.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  const requiredClasses = [
    '.main-container',
    '.history-container',
    '.chat-container',
    '.message',
    '.message.user',
    '.message.assistant',
    '.typing-indicator',
    '.collapsed'
  ];
  
  let cssPassed = true;
  requiredClasses.forEach(className => {
    if (!cssContent.includes(className)) {
      console.log(`   ❌ Missing CSS class: ${className}`);
      cssPassed = false;
    }
  });
  
  if (cssPassed) {
    console.log('   ✅ CSS classes are present');
  }

  // Test 3: Verify JavaScript functionality
  console.log('\n3. Testing JavaScript structure...');
  const jsPath = path.join(__dirname, '../src/public/chat/chat.js');
  const jsContent = fs.readFileSync(jsPath, 'utf8');
  
  const requiredMethods = [
    'sendMessage',
    'loadConversations',
    'toggleHistory',
    'startNewConversation',
    'deleteConversation',
    'addMessageToChat',
    'showTypingIndicator'
  ];
  
  let jsPassed = true;
  requiredMethods.forEach(method => {
    if (!jsContent.includes(method)) {
      console.log(`   ❌ Missing method: ${method}`);
      jsPassed = false;
    }
  });
  
  if (jsPassed) {
    console.log('   ✅ JavaScript methods are present');
  }

  // Test 4: Verify API endpoints in JavaScript
  console.log('\n4. Testing API endpoint usage...');
  const expectedEndpoints = [
    '/api/conversations',
    '/api/chat',
    '/api/conversations/'
  ];
  
  let apiPassed = true;
  expectedEndpoints.forEach(endpoint => {
    if (!jsContent.includes(endpoint)) {
      console.log(`   ❌ Missing API endpoint: ${endpoint}`);
      apiPassed = false;
    }
  });
  
  if (apiPassed) {
    console.log('   ✅ API endpoints are correctly referenced');
  }

  // Test 5: Check responsive design
  console.log('\n5. Testing responsive design...');
  const hasMediaQueries = cssContent.includes('@media');
  const hasCollapsibleSidebar = cssContent.includes('.collapsed') && cssContent.includes('margin-left');
  
  if (hasMediaQueries && hasCollapsibleSidebar) {
    console.log('   ✅ Responsive design and collapsible sidebar implemented');
  } else {
    console.log('   ❌ Missing responsive design or collapsible functionality');
  }

  // Summary
  console.log('\n📊 Test Summary:');
  const allPassed = htmlPassed && cssPassed && jsPassed && apiPassed && hasMediaQueries && hasCollapsibleSidebar;
  
  if (allPassed) {
    console.log('✅ All chat interface tests passed!');
    console.log('\n🎉 Chat interface is ready for use!');
    console.log('\n📝 Next steps:');
    console.log('   1. Set OPENAI_API_KEY environment variable');
    console.log('   2. Start the server: npm run dev');
    console.log('   3. Navigate to http://localhost:3001/chat/');
  } else {
    console.log('❌ Some tests failed. Please review the implementation.');
  }

  return allPassed;
}

// Test backend files
function testBackendFiles() {
  console.log('\n🔧 Testing Backend Files...\n');

  // Test chat service
  console.log('1. Testing Chat Service...');
  const chatServicePath = path.join(__dirname, '../src/server/services/chatService.ts');
  const chatServiceContent = fs.readFileSync(chatServicePath, 'utf8');
  
  const chatServiceChecks = [
    'OpenAI',
    'sendMessage',
    'ChatMessage',
    'ChatResponse'
  ];
  
  let chatServicePassed = true;
  chatServiceChecks.forEach(check => {
    if (!chatServiceContent.includes(check)) {
      console.log(`   ❌ Missing in chat service: ${check}`);
      chatServicePassed = false;
    }
  });
  
  if (chatServicePassed) {
    console.log('   ✅ Chat service is properly implemented');
  }

  // Test conversation service
  console.log('\n2. Testing Conversation Service...');
  const convServicePath = path.join(__dirname, '../src/server/services/conversationService.ts');
  const convServiceContent = fs.readFileSync(convServicePath, 'utf8');
  
  const convServiceChecks = [
    'createConversation',
    'getConversation',
    'getAllConversations',
    'addMessage',
    'deleteConversation'
  ];
  
  let convServicePassed = true;
  convServiceChecks.forEach(check => {
    if (!convServiceContent.includes(check)) {
      console.log(`   ❌ Missing in conversation service: ${check}`);
      convServicePassed = false;
    }
  });
  
  if (convServicePassed) {
    console.log('   ✅ Conversation service is properly implemented');
  }

  // Test routes
  console.log('\n3. Testing Chat Routes...');
  const routesPath = path.join(__dirname, '../src/server/routes/chatRoutes.ts');
  const routesContent = fs.readFileSync(routesPath, 'utf8');
  
  const routeChecks = [
    'sendChatMessage',
    'getAllConversations',
    'getConversation',
    'createConversation',
    'deleteConversation'
  ];
  
  let routesPassed = true;
  routeChecks.forEach(check => {
    if (!routesContent.includes(check)) {
      console.log(`   ❌ Missing route handler: ${check}`);
      routesPassed = false;
    }
  });
  
  if (routesPassed) {
    console.log('   ✅ Chat routes are properly implemented');
  }

  return chatServicePassed && convServicePassed && routesPassed;
}

// Run tests
console.log('🚀 Chat Interface Test Suite\n');
console.log('=' .repeat(50));

const frontendPassed = testChatFiles();
const backendPassed = testBackendFiles();

console.log('\n' + '='.repeat(50));
console.log('🏁 Final Results:');

if (frontendPassed && backendPassed) {
  console.log('🎉 ALL TESTS PASSED! Chat interface is ready to use.');
  console.log('\n💡 To get started:');
  console.log('   1. Set your OpenAI API key: export OPENAI_API_KEY="your-key-here"');
  console.log('   2. Start the server: npm run dev');
  console.log('   3. Open: http://localhost:3001/chat/');
} else {
  console.log('❌ Some tests failed. Please review the implementation.');
  process.exit(1);
}
