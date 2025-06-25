/**
 * Test suite for data field functionality fixes
 * Tests both data persistence and modal display
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const SERVER_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 30000;

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, options);
    const data = await response.json();
    return { response, data };
}

// Helper function to wait for server to be ready
async function waitForServer(maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await makeRequest(`${SERVER_URL}/data`);
            console.log('✓ Server is ready');
            return true;
        } catch (error) {
            console.log(`Waiting for server... (attempt ${i + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    throw new Error('Server failed to start within timeout period');
}

// Test data samples
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
            importance: "high",
            tags: ["test", "data", "verification"]
        },
        numbers: {
            count: 42,
            percentage: 85.5,
            negative: -10
        },
        boolean: true,
        nullValue: null
    },
    edges: []
};

const testNodeWithoutData = {
    x: 200,
    y: 150,
    title: "Test Node without Data",
    radius: 20,
    edges: []
};

const testNodeWithComplexData = {
    x: 300,
    y: 150,
    title: "Test Node with Complex Data",
    radius: 30,
    data: {
        users: [
            { id: 1, name: "Alice", active: true },
            { id: 2, name: "Bob", active: false }
        ],
        config: {
            settings: {
                theme: "dark",
                notifications: true,
                advanced: {
                    debug: false,
                    logging: "info"
                }
            }
        },
        timestamps: {
            created: "2025-01-01T00:00:00Z",
            updated: "2025-01-02T12:30:45Z"
        }
    },
    edges: []
};

async function runTests() {
    console.log('🧪 Starting Data Field Functionality Tests\n');
    
    let serverProcess;
    let testsPassed = 0;
    let testsTotal = 0;
    
    try {
        // Start the server
        console.log('🚀 Starting server...');
        serverProcess = execSync('npm run dev', { 
            stdio: 'pipe',
            detached: true,
            cwd: process.cwd()
        });
        
        // Wait for server to be ready
        await waitForServer();
        
        // Clear any existing data
        console.log('🧹 Clearing existing data...');
        await makeRequest(`${SERVER_URL}/data`, { method: 'DELETE' });
        
        // Test 1: Create node with data and verify persistence
        console.log('\n📝 Test 1: Create node with data and verify persistence');
        testsTotal++;
        
        const testKey1 = 'test-node-with-data';
        const { response: createResponse1 } = await makeRequest(`${SERVER_URL}/particle/${testKey1}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testNodeWithData)
        });
        
        if (createResponse1.ok) {
            console.log('✓ Node created successfully');
            
            // Verify data was saved
            const { data: retrievedData } = await makeRequest(`${SERVER_URL}/data`);
            const savedNode = retrievedData.nodes[testKey1];
            
            if (savedNode && savedNode.data) {
                console.log('✓ Node data was saved');
                
                // Verify data integrity
                const originalData = JSON.stringify(testNodeWithData.data, null, 2);
                const savedData = JSON.stringify(savedNode.data, null, 2);
                
                if (originalData === savedData) {
                    console.log('✓ Data integrity verified');
                    testsPassed++;
                } else {
                    console.log('✗ Data integrity check failed');
                    console.log('Expected:', originalData);
                    console.log('Got:', savedData);
                }
            } else {
                console.log('✗ Node data was not saved properly');
            }
        } else {
            console.log('✗ Failed to create node');
        }
        
        // Test 2: Create node without data
        console.log('\n📝 Test 2: Create node without data');
        testsTotal++;
        
        const testKey2 = 'test-node-without-data';
        const { response: createResponse2 } = await makeRequest(`${SERVER_URL}/particle/${testKey2}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testNodeWithoutData)
        });
        
        if (createResponse2.ok) {
            console.log('✓ Node without data created successfully');
            
            // Verify no data field or undefined data
            const { data: retrievedData2 } = await makeRequest(`${SERVER_URL}/data`);
            const savedNode2 = retrievedData2.nodes[testKey2];
            
            if (savedNode2 && (savedNode2.data === undefined || savedNode2.data === null)) {
                console.log('✓ Node correctly has no data field');
                testsPassed++;
            } else {
                console.log('✗ Node unexpectedly has data:', savedNode2.data);
            }
        } else {
            console.log('✗ Failed to create node without data');
        }
        
        // Test 3: Create node with complex nested data
        console.log('\n📝 Test 3: Create node with complex nested data');
        testsTotal++;
        
        const testKey3 = 'test-node-complex-data';
        const { response: createResponse3 } = await makeRequest(`${SERVER_URL}/particle/${testKey3}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testNodeWithComplexData)
        });
        
        if (createResponse3.ok) {
            console.log('✓ Node with complex data created successfully');
            
            // Verify complex data was saved correctly
            const { data: retrievedData3 } = await makeRequest(`${SERVER_URL}/data`);
            const savedNode3 = retrievedData3.nodes[testKey3];
            
            if (savedNode3 && savedNode3.data) {
                // Check specific nested values
                const userData = savedNode3.data.users;
                const configData = savedNode3.data.config.settings.advanced;
                
                if (userData && userData.length === 2 && userData[0].name === "Alice" &&
                    configData && configData.debug === false && configData.logging === "info") {
                    console.log('✓ Complex nested data saved correctly');
                    testsPassed++;
                } else {
                    console.log('✗ Complex nested data not saved correctly');
                }
            } else {
                console.log('✗ Complex data was not saved');
            }
        } else {
            console.log('✗ Failed to create node with complex data');
        }
        
        // Test 4: Update node data
        console.log('\n📝 Test 4: Update node data');
        testsTotal++;
        
        const updatedData = {
            ...testNodeWithData,
            data: {
                type: "updated",
                description: "This data has been updated",
                newField: "added during update",
                timestamp: new Date().toISOString()
            }
        };
        
        const { response: updateResponse } = await makeRequest(`${SERVER_URL}/particle/${testKey1}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        
        if (updateResponse.ok) {
            console.log('✓ Node updated successfully');
            
            // Verify updated data
            const { data: retrievedUpdatedData } = await makeRequest(`${SERVER_URL}/data`);
            const updatedNode = retrievedUpdatedData.nodes[testKey1];
            
            if (updatedNode && updatedNode.data && 
                updatedNode.data.type === "updated" && 
                updatedNode.data.newField === "added during update") {
                console.log('✓ Node data updated correctly');
                testsPassed++;
            } else {
                console.log('✗ Node data update failed');
            }
        } else {
            console.log('✗ Failed to update node');
        }
        
        // Test 5: Verify graph format consistency
        console.log('\n📝 Test 5: Verify graph format consistency');
        testsTotal++;
        
        const { data: finalData } = await makeRequest(`${SERVER_URL}/data`);
        
        if (finalData && finalData.nodes && finalData.edges && 
            typeof finalData.nodes === 'object' && typeof finalData.edges === 'object') {
            console.log('✓ Graph format is consistent');
            
            // Check that all nodes have the expected structure
            const nodeKeys = Object.keys(finalData.nodes);
            let allNodesValid = true;
            
            for (const key of nodeKeys) {
                const node = finalData.nodes[key];
                if (!node.hasOwnProperty('x') || !node.hasOwnProperty('y') || 
                    !node.hasOwnProperty('title') || !node.hasOwnProperty('radius')) {
                    allNodesValid = false;
                    break;
                }
            }
            
            if (allNodesValid) {
                console.log('✓ All nodes have required properties');
                testsPassed++;
            } else {
                console.log('✗ Some nodes missing required properties');
            }
        } else {
            console.log('✗ Graph format is inconsistent');
        }
        
        // Test 6: Test data field with various data types
        console.log('\n📝 Test 6: Test data field with various data types');
        testsTotal++;
        
        const dataTypesTest = {
            x: 400,
            y: 150,
            title: "Data Types Test",
            radius: 20,
            data: {
                string: "hello world",
                number: 42,
                float: 3.14159,
                boolean: true,
                null: null,
                array: [1, 2, 3, "four", true],
                object: { nested: { deep: "value" } },
                emptyArray: [],
                emptyObject: {}
            },
            edges: []
        };
        
        const testKey6 = 'test-data-types';
        const { response: dataTypesResponse } = await makeRequest(`${SERVER_URL}/particle/${testKey6}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataTypesTest)
        });
        
        if (dataTypesResponse.ok) {
            const { data: dataTypesResult } = await makeRequest(`${SERVER_URL}/data`);
            const dataTypesNode = dataTypesResult.nodes[testKey6];
            
            if (dataTypesNode && dataTypesNode.data) {
                const data = dataTypesNode.data;
                if (data.string === "hello world" && 
                    data.number === 42 && 
                    data.float === 3.14159 && 
                    data.boolean === true && 
                    data.null === null &&
                    Array.isArray(data.array) && data.array.length === 5 &&
                    typeof data.object === 'object' && data.object.nested.deep === "value") {
                    console.log('✓ All data types preserved correctly');
                    testsPassed++;
                } else {
                    console.log('✗ Some data types not preserved correctly');
                }
            } else {
                console.log('✗ Data types test node not saved properly');
            }
        } else {
            console.log('✗ Failed to create data types test node');
        }
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
    } finally {
        // Clean up
        if (serverProcess) {
            try {
                process.kill(-serverProcess.pid);
            } catch (e) {
                // Server might already be stopped
            }
        }
    }
    
    // Print results
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Tests passed: ${testsPassed}/${testsTotal}`);
    console.log(`Success rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);
    
    if (testsPassed === testsTotal) {
        console.log('🎉 All tests passed! Data field functionality is working correctly.');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed. Please check the implementation.');
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Tests interrupted by user');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the tests
runTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});
