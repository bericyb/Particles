const axios = require('axios');

async function testSimpleMerge() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    console.log('🧪 Testing Simple Merge Functionality...\n');
    
    // Create conversation
    const createResponse = await axios.post(`${baseURL}/conversations`, {
      title: 'Simple Merge Test'
    });
    const conversationId = createResponse.data.data.id;
    console.log(`✅ Created conversation: ${conversationId}`);
    
    // Create branch1 from main thread
    const branch1Response = await axios.post(`${baseURL}/conversations/${conversationId}/branches`, {
      conversationId,
      messageIndex: 0,
      selectedText: 'branch1',
      parentBranchId: null
    });
    const branch1Id = branch1Response.data.data.branch.id;
    console.log(`✅ Created branch1: ${branch1Id}`);
    
    // Create branch2 from branch1
    const branch2Response = await axios.post(`${baseURL}/conversations/${conversationId}/branches`, {
      conversationId,
      messageIndex: 0,
      selectedText: 'branch2',
      parentBranchId: branch1Id
    });
    const branch2Id = branch2Response.data.data.branch.id;
    console.log(`✅ Created branch2: ${branch2Id}`);
    
    // Get conversation state before merge
    let conversation = await axios.get(`${baseURL}/conversations/${conversationId}`);
    let conv = conversation.data.data;
    
    console.log('\n📊 Before Merge:');
    conv.branches.forEach(branch => {
      console.log(`   Branch ${branch.id.slice(-6)}: parent=${branch.forkPoint.parentId?.slice(-6) || 'main'}, children=[${branch.children.map(c => c.slice(-6)).join(', ')}]`);
    });
    
    // Merge branch2 into branch1
    console.log(`\n🔄 Merging branch2 (${branch2Id.slice(-6)}) into branch1 (${branch1Id.slice(-6)})...`);
    const mergeResponse = await axios.post(`${baseURL}/conversations/${conversationId}/branches/${branch2Id}/merge`, {
      strategy: 'append'
    });
    
    if (mergeResponse.data.success) {
      console.log('✅ Merge successful');
      
      // Get conversation state after merge
      conversation = await axios.get(`${baseURL}/conversations/${conversationId}`);
      conv = conversation.data.data;
      
      console.log('\n📊 After Merge:');
      console.log(`   Total branches: ${conv.branches.length}`);
      conv.branches.forEach(branch => {
        console.log(`   Branch ${branch.id.slice(-6)}: parent=${branch.forkPoint.parentId?.slice(-6) || 'main'}, children=[${branch.children.map(c => c.slice(-6)).join(', ')}]`);
      });
      
      // Check if branch2 was removed
      const branch2Exists = conv.branches.some(b => b.id === branch2Id);
      console.log(`\n   Branch2 removed: ${!branch2Exists}`);
      
      // Check if branch1 still exists
      const branch1Exists = conv.branches.some(b => b.id === branch1Id);
      console.log(`   Branch1 exists: ${branch1Exists}`);
      
    } else {
      console.log(`❌ Merge failed: ${mergeResponse.data.message}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testSimpleMerge().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testSimpleMerge };
