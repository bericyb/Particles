/**
 * Comprehensive regression test suite
 * Tests all functionality to ensure no regressions after ParticleService removal
 */

const { execSync } = require('child_process');

// Test configuration
const SERVER_URL = 'http://localhost:3001';

// Helper function to make HTTP requests using curl
function makeRequest(method, endpoint, data = null) {
    try {
        let command = `curl -s -X ${method} "${SERVER_URL}${endpoint}"`;
        
        if (data) {
            command += ` -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`;
        }
        
        const result = execSync(command, { encoding: 'utf8' });
        return JSON.parse(result);
    } catch (error) {
        console.error(`Request failed: ${method} ${endpoint}`, error.message);
        throw error;
    }
}

async function runRegressionTests() {
    console.log('🧪 Comprehensive Regression Test Suite');
    console.log('Testing all functionality after ParticleService removal\n');
    
    let testsPassed = 0;
    let testsTotal = 0;
    
    try {
        // Test 1: Clear all data
        console.log('📝 Test 1: Clear all data');
        testsTotal++;
        const clearResult = makeRequest('DELETE', '/data');
        if (clearResult.success) {
            console.log('✓ Clear data successful');
            testsPassed++;
        } else {
            console.log('✗ Clear data failed');
        }
        
        // Test 2: Get empty graph
        console.log('📝 Test 2: Get empty graph');
        testsTotal++;
        const emptyGraph = makeRequest('GET', '/graph');
        if (emptyGraph.nodes && Object.keys(emptyGraph.nodes).length === 0 && 
            emptyGraph.edges && Object.keys(emptyGraph.edges).length === 0) {
            console.log('✓ Empty graph structure correct');
            testsPassed++;
        } else {
            console.log('✗ Empty graph structure incorrect');
        }
        
        // Test 3: Add node with data field
        console.log('📝 Test 3: Add node with data field');
        testsTotal++;
        const testNode = {
            x: 100,
            y: 200,
            title: "Regression Test Node",
            radius: 30,
            data: {
                type: "regression-test",
                features: ["data-persistence", "modal-display"],
                metadata: {
                    created: new Date().toISOString(),
                    version: "1.0"
                },
                numbers: {
                    count: 42,
                    percentage: 85.5
                },
                flags: {
                    active: true,
                    tested: false
                }
            },
            edges: []
        };
        
        const addResult = makeRequest('POST', '/particle/regression-test', testNode);
        if (addResult.success) {
            console.log('✓ Node with data added successfully');
            testsPassed++;
        } else {
            console.log('✗ Failed to add node with data');
        }
        
        // Test 4: Retrieve node and verify data
        console.log('📝 Test 4: Retrieve node and verify data');
        testsTotal++;
        const retrievedNode = makeRequest('GET', '/particle/regression-test');
        if (retrievedNode.data && 
            retrievedNode.data.type === "regression-test" &&
            retrievedNode.data.numbers.count === 42 &&
            retrievedNode.data.flags.active === true) {
            console.log('✓ Node data retrieved correctly');
            testsPassed++;
        } else {
            console.log('✗ Node data not retrieved correctly');
            console.log('Retrieved:', JSON.stringify(retrievedNode, null, 2));
        }
        
        // Test 5: Get graph and verify structure
        console.log('📝 Test 5: Get graph and verify structure');
        testsTotal++;
        const graphData = makeRequest('GET', '/graph');
        if (graphData.nodes && graphData.nodes['regression-test'] && 
            graphData.nodes['regression-test'].data &&
            graphData.edges && typeof graphData.edges === 'object') {
            console.log('✓ Graph structure correct');
            testsPassed++;
        } else {
            console.log('✗ Graph structure incorrect');
        }
        
        // Test 6: Add node with edges
        console.log('📝 Test 6: Add node with edges');
        testsTotal++;
        const nodeWithEdges = {
            x: 200,
            y: 300,
            title: "Connected Node",
            radius: 25,
            data: {
                type: "connected",
                connections: ["regression-test"]
            },
            edges: [
                { key: "regression-test", label: "connects to" }
            ]
        };
        
        const addConnectedResult = makeRequest('POST', '/particle/connected-node', nodeWithEdges);
        if (addConnectedResult.success) {
            console.log('✓ Node with edges added successfully');
            testsPassed++;
        } else {
            console.log('✗ Failed to add node with edges');
        }
        
        // Test 7: Verify edges were created
        console.log('📝 Test 7: Verify edges were created');
        testsTotal++;
        const graphWithEdges = makeRequest('GET', '/graph');
        const edgeCount = Object.keys(graphWithEdges.edges).length;
        if (edgeCount > 0) {
            console.log('✓ Edges created successfully');
            testsPassed++;
        } else {
            console.log('✗ No edges found');
        }
        
        // Test 8: Test example data
        console.log('📝 Test 8: Test example data');
        testsTotal++;
        const exampleData = makeRequest('GET', '/example');
        if (exampleData.nodes && exampleData.nodes.root && 
            exampleData.nodes.root.data && exampleData.nodes.root.data.type === "root") {
            console.log('✓ Example data has correct structure with data fields');
            testsPassed++;
        } else {
            console.log('✗ Example data missing or incorrect');
        }
        
        // Test 9: Test statistics
        console.log('📝 Test 9: Test statistics');
        testsTotal++;
        const stats = makeRequest('GET', '/stats');
        if (stats.success && stats.nodeCount >= 2) {
            console.log('✓ Statistics working correctly');
            testsPassed++;
        } else {
            console.log('✗ Statistics not working correctly');
        }
        
        // Test 10: Test graph statistics
        console.log('📝 Test 10: Test graph statistics');
        testsTotal++;
        const graphStats = makeRequest('GET', '/graph/stats');
        if (graphStats.success && graphStats.nodeCount >= 2 && graphStats.edgeCount >= 0) {
            console.log('✓ Graph statistics working correctly');
            testsPassed++;
        } else {
            console.log('✗ Graph statistics not working correctly');
        }
        
        // Test 11: Test node deletion
        console.log('📝 Test 11: Test node deletion');
        testsTotal++;
        const deleteResult = makeRequest('DELETE', '/particle/connected-node');
        if (deleteResult.success) {
            console.log('✓ Node deletion successful');
            testsPassed++;
        } else {
            console.log('✗ Node deletion failed');
        }
        
        // Test 12: Verify node was deleted
        console.log('📝 Test 12: Verify node was deleted');
        testsTotal++;
        const finalGraph = makeRequest('GET', '/graph');
        if (!finalGraph.nodes['connected-node']) {
            console.log('✓ Node successfully deleted from graph');
            testsPassed++;
        } else {
            console.log('✗ Node still exists after deletion');
        }
        
        // Test 13: Test data field with various data types
        console.log('📝 Test 13: Test various data types');
        testsTotal++;
        const dataTypesNode = {
            x: 300,
            y: 400,
            title: "Data Types Test",
            radius: 20,
            data: {
                string: "hello world",
                number: 42,
                float: 3.14159,
                boolean: true,
                null: null,
                array: [1, 2, 3, "four", true, null],
                object: { nested: { deep: "value" } },
                emptyArray: [],
                emptyObject: {},
                specialChars: "Special chars: !@#$%^&*()_+-={}[]|\\:;\"'<>?,./"
            },
            edges: []
        };
        
        const dataTypesResult = makeRequest('POST', '/particle/data-types-test', dataTypesNode);
        if (dataTypesResult.success) {
            const retrievedDataTypes = makeRequest('GET', '/particle/data-types-test');
            if (retrievedDataTypes.data && 
                retrievedDataTypes.data.string === "hello world" &&
                retrievedDataTypes.data.number === 42 &&
                retrievedDataTypes.data.boolean === true &&
                retrievedDataTypes.data.null === null &&
                Array.isArray(retrievedDataTypes.data.array) &&
                retrievedDataTypes.data.object.nested.deep === "value") {
                console.log('✓ All data types preserved correctly');
                testsPassed++;
            } else {
                console.log('✗ Some data types not preserved correctly');
            }
        } else {
            console.log('✗ Failed to add node with various data types');
        }
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
    }
    
    // Print results
    console.log('\n' + '='.repeat(50));
    console.log('📊 REGRESSION TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Tests passed: ${testsPassed}/${testsTotal}`);
    console.log(`Success rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);
    
    if (testsPassed === testsTotal) {
        console.log('🎉 All regression tests passed! No regressions detected.');
        process.exit(0);
    } else {
        console.log('❌ Some regression tests failed. Please investigate.');
        process.exit(1);
    }
}

// Run the tests
runRegressionTests().catch(error => {
    console.error('❌ Regression test suite failed:', error);
    process.exit(1);
});
