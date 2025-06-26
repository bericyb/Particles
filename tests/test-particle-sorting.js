// Test for particle sorting functionality
// This test verifies that the grid-based sorting algorithm works correctly

import { ParticleSorter } from '../src/public/sort-particles.js';

// Mock canvas for testing
const mockCanvas = {
    width: 800,
    height: 600
};

// Test data: particles with different connection counts in graph format
const testGraphData = {
    nodes: {
        'hub': {
            x: 100, y: 100, radius: 20, title: 'Hub Node'
        },
        'node1': {
            x: 200, y: 200, radius: 20, title: 'Node 1'
        },
        'node2': {
            x: 300, y: 300, radius: 20, title: 'Node 2'
        },
        'node3': {
            x: 400, y: 400, radius: 20, title: 'Node 3'
        },
        'node4': {
            x: 500, y: 500, radius: 20, title: 'Node 4'
        },
        'isolated': {
            x: 600, y: 600, radius: 20, title: 'Isolated Node'
        }
    },
    edges: {
        'hub-node1': { source: 'hub', target: 'node1', label: 'connects to' },
        'hub-node2': { source: 'hub', target: 'node2', label: 'connects to' },
        'hub-node3': { source: 'hub', target: 'node3', label: 'connects to' },
        'hub-node4': { source: 'hub', target: 'node4', label: 'connects to' },
        'node1-node2': { source: 'node1', target: 'node2', label: 'connects to' }
    }
};

function runTests() {
    console.log('🧪 Starting Particle Sorting Tests...\n');
    
    const sorter = new ParticleSorter(mockCanvas);
    let testsPassed = 0;
    let totalTests = 0;
    
    // Test 1: Graph Data Preparation
    totalTests++;
    console.log('Test 1: Graph Data Preparation');
    try {
        const preparedData = sorter.prepareGraphData(testGraphData);
        
        // Check if edges were merged correctly
        const expectedConnections = {
            'hub': 4,      // 4 connections
            'node1': 2,    // 2 connections (hub + node2)
            'node2': 2,    // 2 connections (hub + node1)
            'node3': 1,    // 1 connection (hub)
            'node4': 1,    // 1 connection (hub)
            'isolated': 0  // 0 connections
        };
        
        let preparationCorrect = true;
        for (const [key, expectedCount] of Object.entries(expectedConnections)) {
            const actualCount = preparedData[key]?.edges?.length || 0;
            if (actualCount !== expectedCount) {
                console.log(`❌ Connections for ${key}: expected ${expectedCount}, got ${actualCount}`);
                preparationCorrect = false;
            }
        }
        
        if (preparationCorrect) {
            console.log('✅ Graph data preparation correct');
            testsPassed++;
        } else {
            console.log('❌ Graph data preparation failed');
        }
    } catch (error) {
        console.log('❌ Graph data preparation threw error:', error.message);
    }
    
    // Test 2: Cluster Detection
    totalTests++;
    console.log('\nTest 2: Cluster Detection');
    try {
        const preparedData = sorter.prepareGraphData(testGraphData);
        const clusters = sorter.detectClusters(preparedData);
        
        // Should detect 2 clusters: main cluster (5 nodes) and isolated (1 node)
        const expectedClusterSizes = [5, 1].sort((a, b) => b - a);
        const actualClusterSizes = clusters.map(c => c.length).sort((a, b) => b - a);
        
        let clustersCorrect = true;
        if (actualClusterSizes.length !== expectedClusterSizes.length) {
            clustersCorrect = false;
            console.log(`❌ Expected ${expectedClusterSizes.length} clusters, got ${actualClusterSizes.length}`);
        } else {
            for (let i = 0; i < expectedClusterSizes.length; i++) {
                if (actualClusterSizes[i] !== expectedClusterSizes[i]) {
                    clustersCorrect = false;
                    console.log(`❌ Cluster ${i}: expected size ${expectedClusterSizes[i]}, got ${actualClusterSizes[i]}`);
                }
            }
        }
        
        if (clustersCorrect) {
            console.log('✅ Cluster detection correct');
            console.log(`   Found clusters with sizes: ${actualClusterSizes.join(', ')}`);
            testsPassed++;
        }
    } catch (error) {
        console.log('❌ Cluster detection threw error:', error.message);
    }
    
    // Test 3: Grid Position Calculation
    totalTests++;
    console.log('\nTest 3: Grid Position Calculation');
    try {
        const preparedData = sorter.prepareGraphData(testGraphData);
        const positions = sorter.calculateGridPositions(preparedData);
        
        // All particles should have valid positions
        let allPositionsValid = true;
        for (const [key, position] of positions) {
            if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
                console.log(`❌ Invalid position for ${key}:`, position);
                allPositionsValid = false;
            }
            
            // Check if position is within canvas bounds
            const particle = preparedData[key];
            const radius = particle ? particle.radius : 20;
            if (position.y < radius || position.y > mockCanvas.height - radius) {
                console.log(`❌ Position for ${key} outside canvas bounds: (${position.x}, ${position.y})`);
                allPositionsValid = false;
            }
        }
        
        if (allPositionsValid) {
            console.log('✅ All grid positions are valid and within bounds');
            testsPassed++;
        }
    } catch (error) {
        console.log('❌ Grid position calculation threw error:', error.message);
    }
    
    // Test 4: Connection-based Hierarchy
    totalTests++;
    console.log('\nTest 4: Connection-based Hierarchy');
    try {
        const preparedData = sorter.prepareGraphData(testGraphData);
        const positions = sorter.calculateGridPositions(preparedData);
        
        // Hub (4 connections) should be positioned higher (lower Y) than node3 (1 connection)
        const hubPos = positions.get('hub');
        const node3Pos = positions.get('node3');
        
        if (hubPos && node3Pos && hubPos.y < node3Pos.y) {
            console.log('✅ Higher connection nodes positioned above lower connection nodes');
            console.log(`   Hub (4 conn) Y: ${hubPos.y.toFixed(1)}, Node3 (1 conn) Y: ${node3Pos.y.toFixed(1)}`);
            testsPassed++;
        } else {
            console.log('❌ Connection-based hierarchy not working correctly');
            console.log(`   Hub Y: ${hubPos?.y}, Node3 Y: ${node3Pos?.y}`);
        }
    } catch (error) {
        console.log('❌ Hierarchy test threw error:', error.message);
    }
    
    // Test 5: Isolated Node Handling
    totalTests++;
    console.log('\nTest 5: Isolated Node Handling');
    try {
        const preparedData = sorter.prepareGraphData(testGraphData);
        const positions = sorter.calculateGridPositions(preparedData);
        
        // Isolated node should have a valid position
        const isolatedPos = positions.get('isolated');
        
        if (isolatedPos && typeof isolatedPos.x === 'number' && typeof isolatedPos.y === 'number') {
            console.log('✅ Isolated node positioned correctly');
            console.log(`   Isolated position: (${isolatedPos.x.toFixed(1)}, ${isolatedPos.y.toFixed(1)})`);
            testsPassed++;
        } else {
            console.log('❌ Isolated node not positioned correctly');
            console.log(`   Isolated position:`, isolatedPos);
        }
    } catch (error) {
        console.log('❌ Isolated node test threw error:', error.message);
    }
    
    // Test Summary
    console.log('\n' + '='.repeat(50));
    console.log(`🧪 Test Results: ${testsPassed}/${totalTests} tests passed`);
    
    if (testsPassed === totalTests) {
        console.log('🎉 All tests passed! Particle sorting algorithm is working correctly.');
        return true;
    } else {
        console.log('⚠️  Some tests failed. Please check the implementation.');
        return false;
    }
}

// Visual test helper function
function visualizeTestResults() {
    console.log('\n📊 Visual Test Results:');
    console.log('Expected layout (centrality-based):');
    console.log('');
    console.log('                    Center');
    console.log('                      🔴 hub (4 connections)');
    console.log('              🟡 node1, node2 (2 connections each)');
    console.log('          🟢 node3, node4 (1 connection each)');
    console.log('      🔵 isolated (0 connections)');
    console.log('');
    console.log('Legend: Higher centrality = closer to center');
}

// Run the tests
if (typeof window !== 'undefined') {
    // Browser environment
    window.testParticleShuffling = runTests;
    window.visualizeTestResults = visualizeTestResults;
    console.log('Particle shuffling tests loaded. Run testParticleShuffling() to execute tests.');
} else {
    // Node.js environment
    runTests();
    visualizeTestResults();
}

export { runTests, visualizeTestResults };
