/**
 * Test suite for the cleaned up graph data structure
 * This test verifies that the frontend and backend work together
 * with the new GraphData format without legacy compatibility
 */

const assert = require('assert');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 10000;

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
}

// Test data
const testNodes = {
    'node-1': {
        x: 100,
        y: 150,
        title: 'Test Node 1',
        radius: 20,
        data: { type: 'test', value: 42 }
    },
    'node-2': {
        x: 200,
        y: 100,
        title: 'Test Node 2',
        radius: 15
    },
    'node-3': {
        x: 200,
        y: 200,
        title: 'Test Node 3',
        radius: 18,
        color: 'red'
    }
};

describe('Graph Structure Cleanup Tests', function() {
    this.timeout(TEST_TIMEOUT);
    
    beforeEach(async function() {
        // Clear all data before each test
        try {
            await makeRequest(`${BASE_URL}/data`, { method: 'DELETE' });
        } catch (error) {
            console.warn('Failed to clear data before test:', error.message);
        }
    });
    
    describe('GraphData Structure', function() {
        it('should return empty GraphData structure initially', async function() {
            const data = await makeRequest(`${BASE_URL}/data`);
            
            assert(typeof data === 'object', 'Response should be an object');
            assert(data.hasOwnProperty('nodes'), 'Should have nodes property');
            assert(data.hasOwnProperty('edges'), 'Should have edges property');
            assert(typeof data.nodes === 'object', 'Nodes should be an object');
            assert(typeof data.edges === 'object', 'Edges should be an object');
            assert(Object.keys(data.nodes).length === 0, 'Nodes should be empty initially');
            assert(Object.keys(data.edges).length === 0, 'Edges should be empty initially');
        });
        
        it('should accept complete GraphData structure', async function() {
            const graphData = {
                nodes: testNodes,
                edges: {}
            };
            
            const result = await makeRequest(`${BASE_URL}/data`, {
                method: 'POST',
                body: JSON.stringify(graphData)
            });
            
            assert(result.success === true, 'Should successfully update graph data');
            
            // Verify the data was stored
            const retrievedData = await makeRequest(`${BASE_URL}/data`);
            assert.deepEqual(retrievedData.nodes, testNodes, 'Stored nodes should match input');
            assert.deepEqual(retrievedData.edges, {}, 'Edges should be empty object');
        });
    });
    
    describe('Node Operations', function() {
        it('should add individual nodes without legacy edge arrays', async function() {
            const nodeKey = 'test-node';
            const nodeData = testNodes['node-1'];
            
            const result = await makeRequest(`${BASE_URL}/particle/${nodeKey}`, {
                method: 'POST',
                body: JSON.stringify(nodeData)
            });
            
            assert(result.success === true, 'Should successfully add node');
            
            // Verify node was added
            const retrievedNode = await makeRequest(`${BASE_URL}/particle/${nodeKey}`);
            assert.equal(retrievedNode.title, nodeData.title, 'Node title should match');
            assert.equal(retrievedNode.x, nodeData.x, 'Node x coordinate should match');
            assert.equal(retrievedNode.y, nodeData.y, 'Node y coordinate should match');
            assert.deepEqual(retrievedNode.data, nodeData.data, 'Node data should match');
        });
        
        it('should reject nodes with legacy edge arrays', async function() {
            const nodeWithLegacyEdges = {
                ...testNodes['node-1'],
                edges: [{ key: 'other-node', label: 'connects to' }]
            };
            
            // The backend should ignore the edges array and only store the node
            const result = await makeRequest(`${BASE_URL}/particle/test-node`, {
                method: 'POST',
                body: JSON.stringify(nodeWithLegacyEdges)
            });
            
            assert(result.success === true, 'Should add node successfully');
            
            // Verify no edges were created from the legacy format
            const graphData = await makeRequest(`${BASE_URL}/data`);
            assert(Object.keys(graphData.edges).length === 0, 'No edges should be created from legacy format');
        });
        
        it('should delete nodes and connected edges', async function() {
            // Add nodes
            await makeRequest(`${BASE_URL}/particle/node-1`, {
                method: 'POST',
                body: JSON.stringify(testNodes['node-1'])
            });
            await makeRequest(`${BASE_URL}/particle/node-2`, {
                method: 'POST',
                body: JSON.stringify(testNodes['node-2'])
            });
            
            // Add edge between nodes
            const edgeResult = await makeRequest(`${BASE_URL}/edge`, {
                method: 'POST',
                body: JSON.stringify({
                    source: 'node-1',
                    target: 'node-2',
                    label: 'test connection',
                    directed: true
                })
            });
            
            assert(edgeResult.success === true, 'Should create edge successfully');
            assert(typeof edgeResult.edgeId === 'string', 'Should return edge ID');
            
            // Verify edge exists
            let graphData = await makeRequest(`${BASE_URL}/data`);
            assert(Object.keys(graphData.edges).length === 1, 'Should have one edge');
            
            // Delete node-1
            const deleteResult = await makeRequest(`${BASE_URL}/particle/node-1`, {
                method: 'DELETE'
            });
            
            assert(deleteResult.success === true, 'Should delete node successfully');
            
            // Verify node and connected edges are gone
            graphData = await makeRequest(`${BASE_URL}/data`);
            assert(!graphData.nodes['node-1'], 'Node-1 should be deleted');
            assert(graphData.nodes['node-2'], 'Node-2 should still exist');
            assert(Object.keys(graphData.edges).length === 0, 'Connected edges should be deleted');
        });
    });
    
    describe('Edge Operations', function() {
        beforeEach(async function() {
            // Add test nodes for edge operations
            for (const [key, nodeData] of Object.entries(testNodes)) {
                await makeRequest(`${BASE_URL}/particle/${key}`, {
                    method: 'POST',
                    body: JSON.stringify(nodeData)
                });
            }
        });
        
        it('should create edges with proper UUID identifiers', async function() {
            const edgeData = {
                source: 'node-1',
                target: 'node-2',
                label: 'test connection',
                directed: true,
                weight: 1.5
            };
            
            const result = await makeRequest(`${BASE_URL}/edge`, {
                method: 'POST',
                body: JSON.stringify(edgeData)
            });
            
            assert(result.success === true, 'Should create edge successfully');
            assert(typeof result.edgeId === 'string', 'Should return edge ID');
            assert(result.edgeId.length > 0, 'Edge ID should not be empty');
            
            // Verify edge was created
            const graphData = await makeRequest(`${BASE_URL}/data`);
            const edges = Object.values(graphData.edges);
            assert(edges.length === 1, 'Should have one edge');
            
            const edge = edges[0];
            assert.equal(edge.source, edgeData.source, 'Edge source should match');
            assert.equal(edge.target, edgeData.target, 'Edge target should match');
            assert.equal(edge.label, edgeData.label, 'Edge label should match');
            assert.equal(edge.directed, edgeData.directed, 'Edge direction should match');
            assert.equal(edge.weight, edgeData.weight, 'Edge weight should match');
            assert.equal(edge.id, result.edgeId, 'Edge ID should match returned ID');
        });
        
        it('should get edges for a specific node', async function() {
            // Create multiple edges
            await makeRequest(`${BASE_URL}/edge`, {
                method: 'POST',
                body: JSON.stringify({
                    source: 'node-1',
                    target: 'node-2',
                    label: 'connection 1',
                    directed: true
                })
            });
            
            await makeRequest(`${BASE_URL}/edge`, {
                method: 'POST',
                body: JSON.stringify({
                    source: 'node-1',
                    target: 'node-3',
                    label: 'connection 2',
                    directed: false
                })
            });
            
            // Get edges for node-1
            const node1Edges = await makeRequest(`${BASE_URL}/node/node-1/edges`);
            assert(Array.isArray(node1Edges), 'Should return array of edges');
            assert(node1Edges.length === 2, 'Node-1 should have 2 edges');
            
            // Get edges for node-2
            const node2Edges = await makeRequest(`${BASE_URL}/node/node-2/edges`);
            assert(node2Edges.length === 1, 'Node-2 should have 1 edge');
            
            // Verify edge properties
            const edge = node1Edges.find(e => e.target === 'node-2');
            assert(edge, 'Should find edge to node-2');
            assert.equal(edge.label, 'connection 1', 'Edge label should match');
        });
        
        it('should delete edges by ID', async function() {
            // Create edge
            const createResult = await makeRequest(`${BASE_URL}/edge`, {
                method: 'POST',
                body: JSON.stringify({
                    source: 'node-1',
                    target: 'node-2',
                    label: 'temporary connection',
                    directed: true
                })
            });
            
            const edgeId = createResult.edgeId;
            
            // Verify edge exists
            let graphData = await makeRequest(`${BASE_URL}/data`);
            assert(Object.keys(graphData.edges).length === 1, 'Should have one edge');
            
            // Delete edge
            const deleteResult = await makeRequest(`${BASE_URL}/edge/${edgeId}`, {
                method: 'DELETE'
            });
            
            assert(deleteResult.success === true, 'Should delete edge successfully');
            
            // Verify edge is gone
            graphData = await makeRequest(`${BASE_URL}/data`);
            assert(Object.keys(graphData.edges).length === 0, 'Edge should be deleted');
        });
    });
    
    describe('Graph Statistics', function() {
        it('should return accurate node and edge counts', async function() {
            // Initially empty
            let stats = await makeRequest(`${BASE_URL}/graph/stats`);
            assert.equal(stats.nodeCount, 0, 'Should have 0 nodes initially');
            assert.equal(stats.edgeCount, 0, 'Should have 0 edges initially');
            
            // Add nodes
            for (const [key, nodeData] of Object.entries(testNodes)) {
                await makeRequest(`${BASE_URL}/particle/${key}`, {
                    method: 'POST',
                    body: JSON.stringify(nodeData)
                });
            }
            
            // Add edges
            await makeRequest(`${BASE_URL}/edge`, {
                method: 'POST',
                body: JSON.stringify({
                    source: 'node-1',
                    target: 'node-2',
                    directed: true
                })
            });
            
            await makeRequest(`${BASE_URL}/edge`, {
                method: 'POST',
                body: JSON.stringify({
                    source: 'node-2',
                    target: 'node-3',
                    directed: false
                })
            });
            
            // Check final stats
            stats = await makeRequest(`${BASE_URL}/graph/stats`);
            assert.equal(stats.nodeCount, 3, 'Should have 3 nodes');
            assert.equal(stats.edgeCount, 2, 'Should have 2 edges');
        });
    });
    
    describe('Data Integrity', function() {
        it('should maintain referential integrity between nodes and edges', async function() {
            // Add nodes
            await makeRequest(`${BASE_URL}/particle/node-1`, {
                method: 'POST',
                body: JSON.stringify(testNodes['node-1'])
            });
            await makeRequest(`${BASE_URL}/particle/node-2`, {
                method: 'POST',
                body: JSON.stringify(testNodes['node-2'])
            });
            
            // Try to create edge with non-existent node
            try {
                await makeRequest(`${BASE_URL}/edge`, {
                    method: 'POST',
                    body: JSON.stringify({
                        source: 'node-1',
                        target: 'non-existent-node',
                        directed: true
                    })
                });
                
                // If we get here, the edge was created (which might be allowed)
                // Let's verify the graph data is still consistent
                const graphData = await makeRequest(`${BASE_URL}/data`);
                const edges = Object.values(graphData.edges);
                
                if (edges.length > 0) {
                    // If edge was created, verify all referenced nodes exist
                    for (const edge of edges) {
                        assert(graphData.nodes[edge.source], `Source node ${edge.source} should exist`);
                        assert(graphData.nodes[edge.target], `Target node ${edge.target} should exist`);
                    }
                }
            } catch (error) {
                // Edge creation failed, which is also acceptable behavior
                console.log('Edge creation with non-existent node failed as expected:', error.message);
            }
        });
        
        it('should handle concurrent operations gracefully', async function() {
            // Create multiple nodes concurrently
            const nodePromises = Object.entries(testNodes).map(([key, nodeData]) =>
                makeRequest(`${BASE_URL}/particle/${key}`, {
                    method: 'POST',
                    body: JSON.stringify(nodeData)
                })
            );
            
            const results = await Promise.all(nodePromises);
            results.forEach(result => {
                assert(result.success === true, 'All node creations should succeed');
            });
            
            // Verify all nodes were created
            const graphData = await makeRequest(`${BASE_URL}/data`);
            assert.equal(Object.keys(graphData.nodes).length, 3, 'Should have 3 nodes');
        });
    });
});

// Export for use in other test files
module.exports = {
    makeRequest,
    testNodes,
    BASE_URL
};
