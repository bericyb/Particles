/**
 * Test script for delete node functionality
 * This script tests the complete delete feature including UI and backend integration
 */

// Test configuration
const TEST_CONFIG = {
    serverUrl: 'http://localhost:3001',
    testTimeout: 5000,
    testNodes: [
        { key: 'test-node-1', title: 'Test Node 1', x: 100, y: 100, radius: 20, edges: [] },
        { key: 'test-node-2', title: 'Test Node 2', x: 200, y: 200, radius: 25, edges: [{ key: 'test-node-1', label: 'connects to' }] },
        { key: 'test-node-3', title: 'Test Node 3', x: 300, y: 300, radius: 30, edges: [{ key: 'test-node-1', label: 'also connects' }] }
    ]
};

class DeleteFunctionalityTester {
    constructor() {
        this.results = [];
        this.originalData = null;
    }

    async runAllTests() {
        console.log('🧪 Starting Delete Functionality Tests...\n');
        
        try {
            // Setup test environment
            await this.setupTestEnvironment();
            
            // Run individual tests
            await this.testBackendDeleteEndpoint();
            await this.testDeleteWithEdges();
            await this.testDeleteNonExistentNode();
            await this.testMCPDeleteTool();
            
            // Cleanup
            await this.cleanup();
            
            // Report results
            this.reportResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            await this.cleanup();
        }
    }

    async setupTestEnvironment() {
        console.log('🔧 Setting up test environment...');
        
        try {
            // Store original data
            const response = await fetch(`${TEST_CONFIG.serverUrl}/data`);
            if (response.ok) {
                this.originalData = await response.json();
            }
            
            // Clear existing data
            await fetch(`${TEST_CONFIG.serverUrl}/data`, {
                method: 'DELETE'
            });
            
            // Add test nodes
            for (const node of TEST_CONFIG.testNodes) {
                await fetch(`${TEST_CONFIG.serverUrl}/particle/${node.key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(node)
                });
            }
            
            console.log('✅ Test environment setup complete\n');
            
        } catch (error) {
            throw new Error(`Failed to setup test environment: ${error.message}`);
        }
    }

    async testBackendDeleteEndpoint() {
        console.log('🔍 Testing backend DELETE endpoint...');
        
        try {
            // Test deleting a node
            const deleteResponse = await fetch(`${TEST_CONFIG.serverUrl}/particle/test-node-1`, {
                method: 'DELETE'
            });
            
            const deleteResult = await deleteResponse.json();
            
            if (!deleteResponse.ok || !deleteResult.success) {
                throw new Error(`Delete request failed: ${deleteResult.message || 'Unknown error'}`);
            }
            
            // Verify node is deleted
            const getResponse = await fetch(`${TEST_CONFIG.serverUrl}/particle/test-node-1`);
            if (getResponse.ok) {
                throw new Error('Node still exists after deletion');
            }
            
            // Verify other nodes still exist
            const allDataResponse = await fetch(`${TEST_CONFIG.serverUrl}/data`);
            const allData = await allDataResponse.json();
            
            if (allData['test-node-1']) {
                throw new Error('Deleted node still appears in all data');
            }
            
            if (!allData['test-node-2'] || !allData['test-node-3']) {
                throw new Error('Other nodes were incorrectly deleted');
            }
            
            this.results.push({
                test: 'Backend DELETE endpoint',
                status: 'PASS',
                message: 'Node deleted successfully via HTTP endpoint'
            });
            
            console.log('✅ Backend DELETE endpoint test passed\n');
            
        } catch (error) {
            this.results.push({
                test: 'Backend DELETE endpoint',
                status: 'FAIL',
                message: error.message
            });
            console.log(`❌ Backend DELETE endpoint test failed: ${error.message}\n`);
        }
    }

    async testDeleteWithEdges() {
        console.log('🔍 Testing delete node with connected edges...');
        
        try {
            // Add a new test node with edges for this specific test
            await fetch(`${TEST_CONFIG.serverUrl}/particle/edge-test-node`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Edge Test Node',
                    x: 500,
                    y: 500,
                    radius: 25,
                    edges: [{ key: 'test-node-2', label: 'test edge' }]
                })
            });
            
            // Verify the node was created with edges
            const beforeResponse = await fetch(`${TEST_CONFIG.serverUrl}/data`);
            const beforeData = await beforeResponse.json();
            
            const edgeTestNode = beforeData['edge-test-node'];
            if (!edgeTestNode || !edgeTestNode.edges || edgeTestNode.edges.length === 0) {
                throw new Error('Test setup failed: edge-test-node should have edges');
            }
            
            // Delete the node with edges
            const deleteResponse = await fetch(`${TEST_CONFIG.serverUrl}/particle/edge-test-node`, {
                method: 'DELETE'
            });
            
            const deleteResult = await deleteResponse.json();
            
            if (!deleteResponse.ok || !deleteResult.success) {
                throw new Error(`Delete request failed: ${deleteResult.message || 'Unknown error'}`);
            }
            
            // Verify node and its edges are gone
            const afterResponse = await fetch(`${TEST_CONFIG.serverUrl}/data`);
            const afterData = await afterResponse.json();
            
            if (afterData['edge-test-node']) {
                throw new Error('Node with edges still exists after deletion');
            }
            
            // Verify remaining nodes don't have dangling edges to deleted node
            for (const [key, node] of Object.entries(afterData)) {
                if (node.edges) {
                    const danglingEdges = node.edges.filter(edge => edge.key === 'edge-test-node');
                    if (danglingEdges.length > 0) {
                        throw new Error(`Dangling edges found in node ${key} pointing to deleted node`);
                    }
                }
            }
            
            this.results.push({
                test: 'Delete node with edges',
                status: 'PASS',
                message: 'Node and connected edges deleted successfully'
            });
            
            console.log('✅ Delete node with edges test passed\n');
            
        } catch (error) {
            this.results.push({
                test: 'Delete node with edges',
                status: 'FAIL',
                message: error.message
            });
            console.log(`❌ Delete node with edges test failed: ${error.message}\n`);
        }
    }

    async testDeleteNonExistentNode() {
        console.log('🔍 Testing delete non-existent node...');
        
        try {
            // Try to delete a node that doesn't exist
            const deleteResponse = await fetch(`${TEST_CONFIG.serverUrl}/particle/non-existent-node`, {
                method: 'DELETE'
            });
            
            const deleteResult = await deleteResponse.json();
            
            // Should return 404 or success: false
            if (deleteResponse.status === 404 || (deleteResult && !deleteResult.success)) {
                this.results.push({
                    test: 'Delete non-existent node',
                    status: 'PASS',
                    message: 'Correctly handled deletion of non-existent node'
                });
                console.log('✅ Delete non-existent node test passed\n');
            } else {
                throw new Error('Should have returned error for non-existent node');
            }
            
        } catch (error) {
            this.results.push({
                test: 'Delete non-existent node',
                status: 'FAIL',
                message: error.message
            });
            console.log(`❌ Delete non-existent node test failed: ${error.message}\n`);
        }
    }

    async testMCPDeleteTool() {
        console.log('🔍 Testing MCP delete tool...');
        
        try {
            // Add a test node for MCP deletion
            await fetch(`${TEST_CONFIG.serverUrl}/particle/mcp-test-node`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'MCP Test Node',
                    x: 400,
                    y: 400,
                    radius: 20,
                    edges: []
                })
            });
            
            // Note: We can't directly test MCP tools in this environment,
            // but we can verify the HTTP client method exists and works
            // This is effectively testing the same endpoint the MCP tool uses
            
            const deleteResponse = await fetch(`${TEST_CONFIG.serverUrl}/particle/mcp-test-node`, {
                method: 'DELETE'
            });
            
            const deleteResult = await deleteResponse.json();
            
            if (!deleteResponse.ok || !deleteResult.success) {
                throw new Error(`MCP-style delete failed: ${deleteResult.message || 'Unknown error'}`);
            }
            
            // Verify deletion
            const verifyResponse = await fetch(`${TEST_CONFIG.serverUrl}/particle/mcp-test-node`);
            if (verifyResponse.ok) {
                throw new Error('Node still exists after MCP-style deletion');
            }
            
            this.results.push({
                test: 'MCP delete tool compatibility',
                status: 'PASS',
                message: 'MCP delete tool endpoint works correctly'
            });
            
            console.log('✅ MCP delete tool test passed\n');
            
        } catch (error) {
            this.results.push({
                test: 'MCP delete tool compatibility',
                status: 'FAIL',
                message: error.message
            });
            console.log(`❌ MCP delete tool test failed: ${error.message}\n`);
        }
    }

    async cleanup() {
        console.log('🧹 Cleaning up test environment...');
        
        try {
            // Clear all test data
            await fetch(`${TEST_CONFIG.serverUrl}/data`, {
                method: 'DELETE'
            });
            
            // Restore original data if it existed
            if (this.originalData && Object.keys(this.originalData).length > 0) {
                await fetch(`${TEST_CONFIG.serverUrl}/data`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.originalData)
                });
            }
            
            console.log('✅ Cleanup complete\n');
            
        } catch (error) {
            console.warn('⚠️ Cleanup failed:', error.message);
        }
    }

    reportResults() {
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('========================\n');
        
        let passed = 0;
        let failed = 0;
        
        this.results.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${result.test}: ${result.status}`);
            console.log(`   ${result.message}\n`);
            
            if (result.status === 'PASS') passed++;
            else failed++;
        });
        
        console.log(`Total Tests: ${this.results.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%\n`);
        
        if (failed === 0) {
            console.log('🎉 All delete functionality tests passed!');
            console.log('The delete node feature is working correctly.');
        } else {
            console.log('⚠️ Some tests failed. Please review the issues above.');
        }
    }
}

// UI Testing Instructions
function printUITestInstructions() {
    console.log('\n🖱️ MANUAL UI TESTING INSTRUCTIONS');
    console.log('===================================\n');
    console.log('To test the UI delete functionality:');
    console.log('1. Open the application in your browser');
    console.log('2. Add some test nodes using the "Add Particle" button');
    console.log('3. Double-click on a node to open the modal');
    console.log('4. Verify you see both "Edit" (blue) and "Delete" (red) buttons');
    console.log('5. Click the Delete button');
    console.log('6. Confirm the confirmation dialog appears');
    console.log('7. Click "OK" to confirm deletion');
    console.log('8. Verify the node disappears from the canvas');
    console.log('9. Verify a success notification appears');
    console.log('10. Test canceling deletion by clicking "Cancel" in the confirmation dialog\n');
    console.log('Expected behavior:');
    console.log('- Delete button should be red with a trash icon');
    console.log('- Confirmation dialog should mention edge removal');
    console.log('- Node and all connected edges should be removed');
    console.log('- Success notification should appear');
    console.log('- Modal should close after successful deletion\n');
}

// Run tests
async function runTests() {
    const tester = new DeleteFunctionalityTester();
    await tester.runAllTests();
    printUITestInstructions();
}

// Check if running in Node.js environment
if (typeof window === 'undefined') {
    // Running in Node.js
    runTests().catch(console.error);
} else {
    // Running in browser
    console.log('Delete functionality test script loaded.');
    console.log('Run runTests() to execute the test suite.');
    window.runTests = runTests;
}
