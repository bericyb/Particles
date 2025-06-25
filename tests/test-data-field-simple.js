/**
 * Simple test for data field functionality
 * Assumes server is already running on localhost:3001
 */

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
}

const SERVER_URL = 'http://localhost:3001';

async function runSimpleTest() {
    console.log('🧪 Simple Data Field Test');
    console.log('Make sure the server is running on localhost:3001\n');
    
    try {
        // Test data
        const testNodeWithData = {
            x: 100,
            y: 150,
            title: "Test Node with Data",
            radius: 25,
            data: {
                type: "test",
                description: "This is test data for verification",
                metadata: {
                    created: "2025-01-01",
                    importance: "high"
                },
                count: 42,
                active: true
            },
            edges: []
        };
        
        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await makeRequest(`${SERVER_URL}/data`, { method: 'DELETE' });
        
        // Create node with data
        console.log('📝 Creating node with data...');
        const testKey = 'test-node-with-data';
        const { response: createResponse } = await makeRequest(`${SERVER_URL}/particle/${testKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testNodeWithData)
        });
        
        if (!createResponse.ok) {
            throw new Error(`Failed to create node: ${createResponse.status}`);
        }
        
        console.log('✓ Node created successfully');
        
        // Retrieve and verify data
        console.log('🔍 Retrieving data...');
        const { data: retrievedData } = await makeRequest(`${SERVER_URL}/data`);
        
        console.log('Retrieved graph data:', JSON.stringify(retrievedData, null, 2));
        
        const savedNode = retrievedData.nodes[testKey];
        
        if (!savedNode) {
            throw new Error('Node not found in retrieved data');
        }
        
        console.log('✓ Node found in retrieved data');
        
        if (!savedNode.data) {
            throw new Error('Node data field is missing');
        }
        
        console.log('✓ Node has data field');
        console.log('Node data:', JSON.stringify(savedNode.data, null, 2));
        
        // Verify specific data values
        if (savedNode.data.type === "test" && 
            savedNode.data.description === "This is test data for verification" &&
            savedNode.data.count === 42 &&
            savedNode.data.active === true) {
            console.log('✓ Data values are correct');
        } else {
            throw new Error('Data values do not match expected values');
        }
        
        // Test retrieving specific node
        console.log('🔍 Testing specific node retrieval...');
        const { data: specificNode } = await makeRequest(`${SERVER_URL}/particle/${testKey}`);
        
        if (specificNode && specificNode.data) {
            console.log('✓ Specific node retrieval works');
            console.log('Specific node data:', JSON.stringify(specificNode.data, null, 2));
        } else {
            throw new Error('Specific node retrieval failed or missing data');
        }
        
        console.log('\n🎉 All tests passed! Data field functionality is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

runSimpleTest().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
});
