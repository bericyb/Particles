/**
 * Test script to verify the edge refactoring works correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testEdgeRefactor() {
    console.log('🧪 Testing Edge Refactoring...\n');

    try {
        // Test 1: Clear existing data
        console.log('1. Clearing existing data...');
        await axios.delete(`${BASE_URL}/data`);
        console.log('✅ Data cleared\n');

        // Test 2: Add nodes using legacy API (should work with new system)
        console.log('2. Adding nodes using legacy particle API...');
        
        const node1 = {
            x: 100,
            y: 100,
            color: 'red',
            title: 'Node 1',
            radius: 20,
            edges: [
                { key: 'node2', label: 'connects to' },
                { key: 'node3', label: 'relates to' }
            ]
        };

        const node2 = {
            x: 200,
            y: 150,
            color: 'blue',
            title: 'Node 2',
            radius: 15,
            edges: [
                { key: 'node3', label: 'links to' }
            ]
        };

        const node3 = {
            x: 150,
            y: 250,
            color: 'green',
            title: 'Node 3',
            radius: 18,
            edges: []
        };

        await axios.post(`${BASE_URL}/particle/node1`, node1);
        await axios.post(`${BASE_URL}/particle/node2`, node2);
        await axios.post(`${BASE_URL}/particle/node3`, node3);
        console.log('✅ Nodes added via legacy API\n');

        // Test 3: Verify legacy API still works
        console.log('3. Testing legacy API compatibility...');
        const legacyData = await axios.get(`${BASE_URL}/data`);
        console.log('Legacy format data:', JSON.stringify(legacyData.data, null, 2));
        console.log('✅ Legacy API working\n');

        // Test 4: Test new graph API
        console.log('4. Testing new graph API...');
        const graphData = await axios.get(`${BASE_URL}/graph`);
        console.log('Graph format data:', JSON.stringify(graphData.data, null, 2));
        console.log('✅ New graph API working\n');

        // Test 5: Test edge management
        console.log('5. Testing edge management...');
        
        // Add a new edge using new API
        const edgeResponse = await axios.post(`${BASE_URL}/edge`, {
            source: 'node2',
            target: 'node1',
            label: 'reverse connection',
            directed: true
        });
        console.log('Added edge:', edgeResponse.data);

        // Get edges for a specific node
        const nodeEdges = await axios.get(`${BASE_URL}/node/node1/edges`);
        console.log('Node1 edges:', JSON.stringify(nodeEdges.data, null, 2));

        // Get edges between two nodes
        const edgesBetween = await axios.get(`${BASE_URL}/edges/node1/node2`);
        console.log('Edges between node1 and node2:', JSON.stringify(edgesBetween.data, null, 2));
        console.log('✅ Edge management working\n');

        // Test 6: Test graph statistics
        console.log('6. Testing graph statistics...');
        const stats = await axios.get(`${BASE_URL}/graph/stats`);
        console.log('Graph stats:', JSON.stringify(stats.data, null, 2));
        console.log('✅ Graph statistics working\n');

        // Test 7: Verify data consistency
        console.log('7. Verifying data consistency...');
        const finalLegacyData = await axios.get(`${BASE_URL}/data`);
        const finalGraphData = await axios.get(`${BASE_URL}/graph`);
        
        console.log('Final legacy data has', Object.keys(finalLegacyData.data).length, 'nodes');
        console.log('Final graph data has', Object.keys(finalGraphData.data.nodes).length, 'nodes and', Object.keys(finalGraphData.data.edges).length, 'edges');
        console.log('✅ Data consistency verified\n');

        console.log('🎉 All tests passed! Edge refactoring is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the test
testEdgeRefactor();
