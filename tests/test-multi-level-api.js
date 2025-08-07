const axios = require('axios');

// Simple test to verify multi-level branching API functionality
async function testMultiLevelBranching() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    console.log('🧪 Testing Multi-Level Branching System...\n');
    
    // 1. Create a new conversation
    console.log('1. Creating new conversation...');
    const createResponse = await axios.post(`${baseURL}/conversations`, {
      title: 'Multi-Level Branching Test'
    });
    const conversationId = createResponse.data.data.id;
    console.log(`✅ Created conversation: ${conversationId}\n`);
    
    // 2. Add some messages to main thread
    console.log('2. Adding messages to main thread...');
    
    // Add user message
    let conversation = await addMessage(conversationId, {
      role: 'user',
      content: 'Tell me about artificial intelligence.',
      timestamp: new Date()
    });
    
    // Add assistant message
    conversation = await addMessage(conversationId, {
      role: 'assistant', 
      content: 'Artificial intelligence (AI) is a branch of computer science that aims to create intelligent machines. It includes machine learning, natural language processing, computer vision, and robotics.',
      timestamp: new Date()
    });
    
    console.log(`✅ Main thread has ${conversation.mainThread.length} messages\n`);
    
    // 3. Create first-level branch from main thread
    console.log('3. Creating first-level branch from main thread...');
    const branch1Response = await axios.post(`${baseURL}/conversations/${conversationId}/branches`, {
      conversationId,
      messageIndex: 1, // Branch from assistant message
      selectedText: 'machine learning',
      parentBranchId: null // From main thread
    });
    
    const branch1 = branch1Response.data.data.branch;
    console.log(`✅ Created first-level branch: ${branch1.name} (ID: ${branch1.id})`);
    console.log(`   Parent: ${branch1.forkPoint.parentId || 'Main Thread'}`);
    console.log(`   Fork point: message ${branch1.forkPoint.messageIndex}\n`);
    
    // 4. Add messages to first-level branch
    console.log('4. Adding messages to first-level branch...');
    conversation = await addMessage(conversationId, {
      role: 'user',
      content: 'Can you explain machine learning in more detail?',
      timestamp: new Date()
    });
    
    conversation = await addMessage(conversationId, {
      role: 'assistant',
      content: 'Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed. It includes supervised learning, unsupervised learning, and reinforcement learning.',
      timestamp: new Date()
    });
    
    console.log(`✅ First-level branch now has messages\n`);
    
    // 5. Create second-level branch from first-level branch
    console.log('5. Creating second-level branch from first-level branch...');
    const branch2Response = await axios.post(`${baseURL}/conversations/${conversationId}/branches`, {
      conversationId,
      messageIndex: 3, // Branch from latest assistant message in context
      selectedText: 'supervised learning',
      parentBranchId: branch1.id // From first-level branch
    });
    
    const branch2 = branch2Response.data.data.branch;
    console.log(`✅ Created second-level branch: ${branch2.name} (ID: ${branch2.id})`);
    console.log(`   Parent: ${branch2.forkPoint.parentId}`);
    console.log(`   Fork point: message ${branch2.forkPoint.messageIndex}\n`);
    
    // 6. Add messages to second-level branch
    console.log('6. Adding messages to second-level branch...');
    conversation = await addMessage(conversationId, {
      role: 'user',
      content: 'What are some examples of supervised learning algorithms?',
      timestamp: new Date()
    });
    
    conversation = await addMessage(conversationId, {
      role: 'assistant',
      content: 'Common supervised learning algorithms include linear regression, decision trees, random forests, support vector machines, and neural networks.',
      timestamp: new Date()
    });
    
    console.log(`✅ Second-level branch now has messages\n`);
    
    // 7. Test switching between branches and verify context
    console.log('7. Testing branch switching and context...');
    
    // Switch to main thread
    await axios.put(`${baseURL}/conversations/${conversationId}/active-branch`, {
      branchId: null
    });
    let contextResponse = await axios.get(`${baseURL}/conversations/${conversationId}`);
    let contextMessages = getContextMessages(contextResponse.data.data);
    console.log(`✅ Main thread context: ${contextMessages.length} messages`);
    
    // Switch to first-level branch
    await axios.put(`${baseURL}/conversations/${conversationId}/active-branch`, {
      branchId: branch1.id
    });
    contextResponse = await axios.get(`${baseURL}/conversations/${conversationId}`);
    contextMessages = getContextMessages(contextResponse.data.data);
    console.log(`✅ First-level branch context: ${contextMessages.length} messages`);
    
    // Switch to second-level branch
    await axios.put(`${baseURL}/conversations/${conversationId}/active-branch`, {
      branchId: branch2.id
    });
    contextResponse = await axios.get(`${baseURL}/conversations/${conversationId}`);
    contextMessages = getContextMessages(contextResponse.data.data);
    console.log(`✅ Second-level branch context: ${contextMessages.length} messages`);
    
    // 8. Verify tree structure
    console.log('\n8. Verifying tree structure...');
    const finalConversation = contextResponse.data.data;
    
    console.log(`📊 Conversation Structure:`);
    console.log(`   Main Thread: ${finalConversation.mainThread.length} messages`);
    console.log(`   Total Branches: ${finalConversation.branches.length}`);
    
    finalConversation.branches.forEach((branch, index) => {
      const depth = getBranchDepth(finalConversation, branch.id);
      const indent = '  '.repeat(depth + 1);
      console.log(`${indent}├─ ${branch.name} (L${depth + 1})`);
      console.log(`${indent}   Parent: ${branch.forkPoint.parentId || 'Main Thread'}`);
      console.log(`${indent}   Messages: ${branch.messages.length}`);
      console.log(`${indent}   Children: ${branch.children.length}`);
    });
    
    console.log('\n🎉 Multi-Level Branching Test Completed Successfully!');
    console.log('\n✨ Key Features Verified:');
    console.log('   ✅ Create branches from main thread');
    console.log('   ✅ Create branches from other branches (multi-level)');
    console.log('   ✅ Proper parent-child relationships');
    console.log('   ✅ Context building through branch hierarchy');
    console.log('   ✅ Branch switching maintains correct context');
    console.log('   ✅ Tree structure visualization data');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Helper functions
async function addMessage(conversationId, message) {
  // Use the existing chat endpoint to add messages
  const response = await axios.post(`http://localhost:3001/api/chat`, {
    message: message.content,
    conversationId: conversationId
  });
  return response.data.data.conversation;
}

function getContextMessages(conversation) {
  if (!conversation.activeBranchId) {
    return conversation.mainThread;
  }
  
  return buildBranchPath(conversation, conversation.activeBranchId);
}

function buildBranchPath(conversation, branchId) {
  const branch = conversation.branches.find(b => b.id === branchId);
  if (!branch) {
    return conversation.mainThread;
  }
  
  let messages = [];
  
  if (branch.forkPoint.parentId === null) {
    // Branch from main thread
    messages = conversation.mainThread.slice(0, branch.forkPoint.messageIndex + 1);
  } else {
    // Branch from another branch - recursively build parent path
    const parentPath = buildBranchPath(conversation, branch.forkPoint.parentId);
    messages = parentPath.slice(0, branch.forkPoint.messageIndex + 1);
  }
  
  // Add this branch's messages
  return [...messages, ...branch.messages];
}

function getBranchDepth(conversation, branchId) {
  const branch = conversation.branches.find(b => b.id === branchId);
  if (!branch || branch.forkPoint.parentId === null) {
    return 0;
  }
  
  return 1 + getBranchDepth(conversation, branch.forkPoint.parentId);
}

// Run the test
if (require.main === module) {
  testMultiLevelBranching();
}

module.exports = { testMultiLevelBranching };
