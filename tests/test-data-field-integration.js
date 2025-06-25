/**
 * Integration test for the data field functionality
 * Tests the complete flow from frontend to backend
 */

// Test configuration
const SERVER_URL = 'http://localhost:3001';

// Test data with various data field scenarios
const testNodes = {
    'test-node-1': {
        x: 100,
        y: 100,
        title: 'Node with Simple Data',
        radius: 20,
        color: 'blue',
        data: {
            type: 'simple',
            value: 42,
            description: 'A simple test node'
        },
        edges: []
    },
    'test-node-2': {
        x: 200,
        y: 100,
        title: 'Node with Complex Data',
        radius: 25,
        color: 'red',
        data: {
            type: 'complex',
            metadata: {
                created: '2025-01-01',
                tags: ['important', 'test'],
                nested: {
                    level: 2,
                    active: true,
                    properties: {
                        weight: 0.8,
                        priority: 'high'
                    }
                }
            },
            array: [1, 2, 3, 'four', { five: 5 }],
            nullValue: null,
            booleanValue: false,
            emptyString: '',
            unicode: 'Hello 世界 🌍'
        },
        edges: []
    },
    'test-node-3': {
        x: 300,
        y: 100,
        title: 'Node without Data',
        radius: 15,
        color: 'green',
        edges: []
    }
};

// Helper function to make HTTP requests
async function makeRequest(method, endpoint, data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${SERVER_URL}${endpoint}`, options);
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
}

// Test functions
async function testAddNodeWithData() {
    console.log('Testing: Add node with data field...');
    
    try {
        // Add node with simple data
        const result1 = await makeRequest('POST', '/particle/test-node-1', testNodes['test-node-1']);
        if (!result1.success) {
            throw new Error('Failed to add node with simple data');
        }
        console.log('✓ Added node with simple data');
        
        // Add node with complex data
        const result2 = await makeRequest('POST', '/particle/test-node-2', testNodes['test-node-2']);
        if (!result2.success) {
            throw new Error('Failed to add node with complex data');
        }
        console.log('✓ Added node with complex data');
        
        // Add node without data
        const result3 = await makeRequest('POST', '/particle/test-node-3', testNodes['test-node-3']);
        if (!result3.success) {
            throw new Error('Failed to add node without data');
        }
        console.log('✓ Added node without data');
        
    } catch (error) {
        console.error('✗ Failed to add nodes:', error.message);
        throw error;
    }
}

async function testRetrieveNodeWithData() {
    console.log('Testing: Retrieve node with data field...');
    
    try {
        // Get node with simple data
        const node1 = await makeRequest('GET', '/particle/test-node-1');
        if (!node1.data || node1.data.type !== 'simple' || node1.data.value !== 42) {
            throw new Error('Simple data not preserved correctly');
        }
        console.log('✓ Retrieved node with simple data correctly');
        
        // Get node with complex data
        const node2 = await makeRequest('GET', '/particle/test-node-2');
        if (!node2.data || node2.data.type !== 'complex') {
            throw new Error('Complex data not preserved correctly');
        }
        if (!node2.data.metadata || !node2.data.metadata.nested || node2.data.metadata.nested.level !== 2) {
            throw new Error('Nested data not preserved correctly');
        }
        if (!Array.isArray(node2.data.array) || node2.data.array.length !== 5) {
            throw new Error('Array data not preserved correctly');
        }
        console.log('✓ Retrieved node with complex data correctly');
        
        // Get node without data
        const node3 = await makeRequest('GET', '/particle/test-node-3');
        if (node3.data !== undefined) {
            throw new Error('Node without data should not have data field');
        }
        console.log('✓ Retrieved node without data correctly');
        
    } catch (error) {
        console.error('✗ Failed to retrieve nodes:', error.message);
        throw error;
    }
}

async function testGetAllParticlesWithData() {
    console.log('Testing: Get all particles includes data field...');
    
    try {
        const allParticles = await makeRequest('GET', '/data');
        
        // Check that our test nodes are present with data
        if (!allParticles['test-node-1'] || !allParticles['test-node-1'].data) {
            throw new Error('Node 1 data missing from all particles');
        }
        
        if (!allParticles['test-node-2'] || !allParticles['test-node-2'].data) {
            throw new Error('Node 2 data missing from all particles');
        }
        
        if (allParticles['test-node-3'] && allParticles['test-node-3'].data !== undefined) {
            throw new Error('Node 3 should not have data field');
        }
        
        console.log('✓ All particles include data fields correctly');
        
    } catch (error) {
        console.error('✗ Failed to get all particles with data:', error.message);
        throw error;
    }
}

async function testUpdateNodeData() {
    console.log('Testing: Update node data field...');
    
    try {
        // Update node with new data
        const updatedNode = {
            ...testNodes['test-node-1'],
            data: {
                type: 'updated',
                newValue: 'modified',
                timestamp: Date.now()
            }
        };
        
        const result = await makeRequest('POST', '/particle/test-node-1', updatedNode);
        if (!result.success) {
            throw new Error('Failed to update node data');
        }
        
        // Verify the update
        const retrievedNode = await makeRequest('GET', '/particle/test-node-1');
        if (!retrievedNode.data || retrievedNode.data.type !== 'updated' || retrievedNode.data.newValue !== 'modified') {
            throw new Error('Node data not updated correctly');
        }
        
        console.log('✓ Updated node data successfully');
        
    } catch (error) {
        console.error('✗ Failed to update node data:', error.message);
        throw error;
    }
}

async function testGraphEndpointWithData() {
    console.log('Testing: Graph endpoint includes data field...');
    
    try {
        const graph = await makeRequest('GET', '/graph');
        
        if (!graph.nodes || !graph.nodes['test-node-1'] || !graph.nodes['test-node-1'].data) {
            throw new Error('Graph endpoint missing node data');
        }
        
        if (!graph.nodes['test-node-2'] || !graph.nodes['test-node-2'].data) {
            throw new Error('Graph endpoint missing complex node data');
        }
        
        console.log('✓ Graph endpoint includes data fields correctly');
        
    } catch (error) {
        console.error('✗ Failed to get graph with data:', error.message);
        throw error;
    }
}

async function testDataFieldEdgeCases() {
    console.log('Testing: Data field edge cases...');
    
    try {
        // Test with null data
        const nodeWithNull = {
            x: 400,
            y: 100,
            title: 'Node with Null Data',
            radius: 20,
            data: null,
            edges: []
        };
        
        const result1 = await makeRequest('POST', '/particle/test-null-data', nodeWithNull);
        if (!result1.success) {
            throw new Error('Failed to add node with null data');
        }
        
        const retrieved1 = await makeRequest('GET', '/particle/test-null-data');
        if (retrieved1.data !== null) {
            throw new Error('Null data not preserved correctly');
        }
        console.log('✓ Null data handled correctly');
        
        // Test with empty object data
        const nodeWithEmpty = {
            x: 500,
            y: 100,
            title: 'Node with Empty Data',
            radius: 20,
            data: {},
            edges: []
        };
        
        const result2 = await makeRequest('POST', '/particle/test-empty-data', nodeWithEmpty);
        if (!result2.success) {
            throw new Error('Failed to add node with empty data');
        }
        
        const retrieved2 = await makeRequest('GET', '/particle/test-empty-data');
        if (!retrieved2.data || typeof retrieved2.data !== 'object') {
            throw new Error('Empty object data not preserved correctly');
        }
        console.log('✓ Empty object data handled correctly');
        
    } catch (error) {
        console.error('✗ Failed edge case tests:', error.message);
        throw error;
    }
}

async function cleanup() {
    console.log('Cleaning up test data...');
    
    try {
        // Delete test nodes
        const testKeys = ['test-node-1', 'test-node-2', 'test-node-3', 'test-null-data', 'test-empty-data'];
        
        for (const key of testKeys) {
            try {
                await makeRequest('DELETE', `/particle/${key}`);
            } catch (error) {
                // Ignore errors during cleanup
                console.warn(`Warning: Could not delete ${key}:`, error.message);
            }
        }
        
        console.log('✓ Cleanup completed');
        
    } catch (error) {
        console.warn('Warning: Cleanup had issues:', error.message);
    }
}

// Main test runner
async function runIntegrationTests() {
    console.log('=== Data Field Integration Tests ===');
    console.log('');
    
    try {
        await testAddNodeWithData();
        console.log('');
        
        await testRetrieveNodeWithData();
        console.log('');
        
        await testGetAllParticlesWithData();
        console.log('');
        
        await testUpdateNodeData();
        console.log('');
        
        await testGraphEndpointWithData();
        console.log('');
        
        await testDataFieldEdgeCases();
        console.log('');
        
        console.log('=== All Integration Tests Passed! ===');
        console.log('✓ Data field functionality works end-to-end');
        console.log('✓ Server endpoints handle data field correctly');
        console.log('✓ Data persistence and retrieval working');
        console.log('✓ Edge cases handled properly');
        
    } catch (error) {
        console.error('');
        console.error('=== Integration Tests Failed ===');
        console.error('✗ Error:', error.message);
        console.error('');
        console.error('Make sure the server is running on http://localhost:3001');
        
    } finally {
        await cleanup();
    }
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runIntegrationTests,
        testNodes,
        makeRequest
    };
}

// Auto-run if this script is executed directly
if (typeof window === 'undefined' && require.main === module) {
    runIntegrationTests().catch(console.error);
}
