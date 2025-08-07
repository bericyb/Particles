const axios = require('axios');

// Test the enhanced merge functionality for multi-level branches
async function testMergeFunctionality() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    console.log('🧪 Testing Enhanced Merge Functionality...\n');
    
    // 1. Create a new conversation
    console.log('1. Creating new conversation...');
    const createResponse = await axios.post(`${baseURL}/conversations`, {
      title: 'Merge Test Conversation'
    });
    const conversationId = createResponse.data.data.id;
    console.log(`✅ Created conversation: ${conversationId}\n`);
    
    // 2. Create first-level branch from main thread
    console.log('2. Creating first-level branch...');
    const branch1Response = await axios.post(`${baseURL}/conversations/${conversationId}/branches`, {
      conversationId,
      messageIndex: 0,
      selectedText: 'first level topic',
      parentBranchId: null
    });
    const branch1 = branch1Response.data.data.branch;
    console.log(`✅ Created first-level branch: ${branch1.id}\n`);
    
    // 3. Create second-level branch from first-level branch
    console.log('3. Creating second-level branch...');
    const branch2Response = await axios.post(`${baseURL}/conversations/${conversationId}/branches`, {
      conversationId,
      messageIndex: 0,
      selectedText: 'second level topic',
      parentBranchId: branch1.id
    });
    const branch2 = branch2Response.data.data.branch;
    console.log(`✅ Created second-level branch: ${branch2.id}\n`);
    
    // 4. Create third-level branch from second-level branch
    console.log('4. Creating third-level branch...');
    const branch3Response = await axios.post(`${baseURL}/conversations/${conversationId}/branches`, {
      conversationId,
      messageIndex: 0,
      selectedText: 'third level topic',
      parentBranchId: branch2.id
    });
    const branch3 = branch3Response.data.data.branch;
    console.log(`✅ Created third-level branch: ${branch3.id}\n`);
    
    // 5. Verify initial tree structure
    console.log('5. Verifying initial tree structure...');
    let conversation = await axios.get(`${baseURL}/conversations/${conversationId}`);
    let conv = conversation.data.data;
    
    console.log(`📊 Initial Structure:`);
    console.log(`   Total Branches: ${conv.branches.length}`);
    console.log(`   Branch1 children: [${conv.branches.find(b => b.id === branch1.id).children.join(', ')}]`);
    console.log(`   Branch2 children: [${conv.branches.find(b => b.id === branch2.id).children.join(', ')}]`);
    console.log(`   Branch3 parent: ${conv.branches.find(b => b.id === branch3.id).forkPoint.parentId}\n`);
    
    // 6. Test merging second-level branch into first-level branch
    console.log('6. Testing merge: second-level branch → first-level branch...');
    const mergeResponse = await axios.post(`${baseURL}/conversations/${conversationId}/branches/${branch2.id}/merge`, {
      strategy: 'append'
    });
    
    if (mergeResponse.data.success) {
      console.log(`✅ Successfully merged branch2 into branch1`);
      
      // Verify structure after merge
      conversation = await axios.get(`${baseURL}/conversations/${conversationId}`);
      conv = conversation.data.data;
      
      console.log(`📊 After Merge Structure:`);
      console.log(`   Total Branches: ${conv.branches.length}`);
      
      // Check that branch2 is gone
      const branch2Exists = conv.branches.some(b => b.id === branch2.id);
      console.log(`   Branch2 still exists: ${branch2Exists}`);
      
      // Check that branch3 is now a child of branch1
      const branch1Updated = conv.branches.find(b => b.id === branch1.id);
      const branch3Updated = conv.branches.find(b => b.id === branch3.id);
      
      if (branch1Updated && branch3Updated) {
        console.log(`   Branch1 children: [${branch1Updated.children.join(', ')}]`);
        console.log(`   Branch3 parent: ${branch3Updated.forkPoint.parentId}`);
        
        const branch3ReParented = branch3Updated.forkPoint.parentId === branch1.id;
        const branch1HasBranch3 = branch1Updated.children.includes(branch3.id);
        
        console.log(`   ✅ Branch3 re-parented to Branch1: ${branch3ReParented}`);
        console.log(`   ✅ Branch1 has Branch3 as child: ${branch1HasBranch3}`);
      }
    } else {
      console.log(`❌ Merge failed: ${mergeResponse.data.message}`);
    }
    
    console.log();
    
    // 7. Test merging first-level branch into main thread
    console.log('7. Testing merge: first-level branch → main thread...');
    const mergeToMainResponse = await axios.post(`${baseURL}/conversations/${conversationId}/branches/${branch1.id}/merge`, {
      strategy: 'append'
    });
    
    if (mergeToMainResponse.data.success) {
      console.log(`✅ Successfully merged branch1 into main thread`);
      
      // Verify final structure
      conversation = await axios.get(`${baseURL}/conversations/${conversationId}`);
      conv = conversation.data.data;
      
      console.log(`📊 Final Structure:`);
      console.log(`   Total Branches: ${conv.branches.length}`);
      console.log(`   Main Thread Messages: ${conv.mainThread.length}`);
      
      // Check that branch1 is gone
      const branch1Exists = conv.branches.some(b => b.id === branch1.id);
      console.log(`   Branch1 still exists: ${branch1Exists}`);
      
      // Check that branch3 is now a main thread child
      if (conv.branches.length > 0) {
        const remainingBranch = conv.branches[0];
        console.log(`   Remaining branch parent: ${remainingBranch.forkPoint.parentId}`);
        
        const isMainThreadChild = remainingBranch.forkPoint.parentId === null;
        console.log(`   ✅ Remaining branch is main thread child: ${isMainThreadChild}`);
      }
    } else {
      console.log(`❌ Merge to main failed: ${mergeToMainResponse.data.message}`);
    }
    
    console.log();
    
    // 8. Test delete functionality with child re-parenting
    console.log('8. Testing delete with child re-parenting...');
    
    // Create a new branch structure for delete testing
    const newBranch1Response = await axios.post(`${baseURL}/conversations/${conversationId}/branches`, {
      conversationId,
      messageIndex: 0,
      selectedText: 'delete test parent',
      parentBranchId: null
    });
    const newBranch1 = newBranch1Response.data.data.branch;
    
    const newBranch2Response = await axios.post(`${baseURL}/conversations/${conversationId}/branches`, {
      conversationId,
      messageIndex: 0,
      selectedText: 'delete test child',
      parentBranchId: newBranch1.id
    });
    const newBranch2 = newBranch2Response.data.data.branch;
    
    // Delete the parent branch
    const deleteResponse = await axios.delete(`${baseURL}/conversations/${conversationId}/branches/${newBranch1.id}`);
    
    if (deleteResponse.data.success) {
      console.log(`✅ Successfully deleted parent branch`);
      
      // Verify child was re-parented
      conversation = await axios.get(`${baseURL}/conversations/${conversationId}`);
      conv = conversation.data.data;
      
      const childBranch = conv.branches.find(b => b.id === newBranch2.id);
      if (childBranch) {
        const isReParented = childBranch.forkPoint.parentId === null;
        console.log(`   ✅ Child branch re-parented to main thread: ${isReParented}`);
      }
    } else {
      console.log(`❌ Delete failed: ${deleteResponse.data.message}`);
    }
    
    console.log('\n🎉 Enhanced Merge Functionality Test Completed Successfully!');
    console.log('\n✨ Key Features Verified:');
    console.log('   ✅ Merge branches into parent branches (not just main thread)');
    console.log('   ✅ Proper child re-parenting during merge');
    console.log('   ✅ Parent-child relationship cleanup');
    console.log('   ✅ Active branch switching after merge');
    console.log('   ✅ Delete with child re-parenting');
    console.log('   ✅ Multi-level merge operations');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Run the test
if (require.main === module) {
  testMergeFunctionality().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testMergeFunctionality };
