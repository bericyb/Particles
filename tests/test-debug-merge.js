const axios = require('axios');

async function debugMerge() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    console.log('🔍 Debug Merge Functionality...\n');
    
    // Create conversation
    const createResponse = await axios.post(`${baseURL}/conversations`, {
      title: 'Debug Merge Test'
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
    
    console.log('\n📊 Before Merge - Detailed State:');
    console.log(`   Total branches: ${conv.branches.length}`);
    conv.branches.forEach((branch, index) => {
      console.log(`   Branch ${index + 1}:`);
      console.log(`     ID: ${branch.id}`);
      console.log(`     Name: ${branch.name}`);
      console.log(`     Parent: ${branch.forkPoint.parentId || 'main'}`);
      console.log(`     Children: [${branch.children.join(', ')}]`);
    });
    
    // Merge branch2 into branch1
    console.log(`\n🔄 Merging branch2 (${branch2Id}) into branch1 (${branch1Id})...`);
    const mergeResponse = await axios.post(`${baseURL}/conversations/${conversationId}/branches/${branch2Id}/merge`, {
      strategy: 'append'
    });
    
    if (mergeResponse.data.success) {
      console.log('✅ Merge API call successful');
      
      // Get conversation state after merge
      conversation = await axios.get(`${baseURL}/conversations/${conversationId}`);
      conv = conversation.data.data;
      
      console.log('\n📊 After Merge - Detailed State:');
      console.log(`   Total branches: ${conv.branches.length}`);
      conv.branches.forEach((branch, index) => {
        console.log(`   Branch ${index + 1}:`);
        console.log(`     ID: ${branch.id}`);
        console.log(`     Name: ${branch.name}`);
        console.log(`     Parent: ${branch.forkPoint.parentId || 'main'}`);
        console.log(`     Children: [${branch.children.join(', ')}]`);
      });
      
      // Check specific conditions
      const branch2Exists = conv.branches.some(b => b.id === branch2Id);
      const branch1Exists = conv.branches.some(b => b.id === branch1Id);
      const branch1 = conv.branches.find(b => b.id === branch1Id);
      
      console.log(`\n🔍 Analysis:`);
      console.log(`   Branch2 (${branch2Id}) still exists: ${branch2Exists}`);
      console.log(`   Branch1 (${branch1Id}) still exists: ${branch1Exists}`);
      
      if (branch1) {
        console.log(`   Branch1 children array: [${branch1.children.join(', ')}]`);
        console.log(`   Branch1 children contains branch2 ID: ${branch1.children.includes(branch2Id)}`);
        console.log(`   Branch1 children length: ${branch1.children.length}`);
      }
      
    } else {
      console.log(`❌ Merge failed: ${mergeResponse.data.message}`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data || error.message);
    return false;
  }
}

// Run the debug
if (require.main === module) {
  debugMerge().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { debugMerge };
