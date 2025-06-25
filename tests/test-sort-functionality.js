// Test for particle sorting functionality
// This test verifies that the grid-based sorting algorithm works correctly

import { ParticleSorter } from '../src/public/sort-particles.js';

// Mock canvas for testing
const mockCanvas = {
    width: 800,
    height: 600
};

// Test data: particles with different connection counts forming clusters
const testParticles = new Map([
    // Cluster 1: Well-connected hub
    ['hub1', {
        x: 100, y: 100, radius: 20, title: 'Hub Node 1',
        edges: [
            { key: 'node1', label: 'connects to' },
            { key: 'node2', label: 'connects to' },
            { key: 'node3', label: 'connects to' }
        ]
    }],
    ['node1', {
        x: 200, y: 200, radius: 20, title: 'Node 1',
        edges: [
            { key: 'hub1', label: 'connects to' },
            { key: 'node2', label: 'connects to' }
        ]
    }],
    ['node2', {
        x: 300, y: 300, radius: 20, title: 'Node 2',
        edges: [
            { key: 'hub1', label: 'connects to' },
            { key: 'node1', label: 'connects to' }
        ]
    }],
    ['node3', {
        x: 400, y: 400, radius: 20, title: 'Node 3',
        edges: [
            { key: 'hub1', label: 'connects to' }
        ]
    }],
    
    // Cluster 2: Smaller cluster
    ['hub2', {
        x: 500, y: 100, radius: 20, title: 'Hub Node 2',
        edges: [
            { key: 'node4', label: 'connects to' }
        ]
    }],
    ['node4', {
        x: 600, y: 200, radius: 20, title: 'Node 4',
        edges: [
            { key: 'hub2', label: 'connects to' }
        ]
    }],
    
    // Isolated node
    ['isolated', {
        x: 700, y: 500, radius: 20, title: 'Isolated Node',
        edges: []
    }]
]);

function runSortTests() {
    console.log('🧪 Starting Particle Sorting Tests...\n');
    
    const sorter = new ParticleSorter(mockCanvas);
    let testsPassed = 0;
    let totalTests = 0;
    
    // Test 1: Cluster Detection
    totalTests++;
    console.log('Test 1: Cluster Detection');
    try {
        const clusters = sorter.detectClusters(testParticles);
        
        // Should detect 3 clusters: main cluster (4 nodes), small cluster (2 nodes), isolated (1 node)
        const expectedClusterSizes = [4, 2, 1].sort((a, b) => b - a);
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
    
    // Test 2: Grid Position Calculation
    totalTests++;
    console.log('\nTest 2: Grid Position Calculation');
    try {
        const positions = sorter.calculateGridPositions(testParticles);
        
        // All particles should have valid positions
        let allPositionsValid = true;
        for (const [key, position] of positions) {
            if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
                console.log(`❌ Invalid position for ${key}:`, position);
                allPositionsValid = false;
            }
            
            // Check if position is within canvas bounds
            const particle = testParticles.get(key);
            const radius = particle ? particle.radius : 20;
            if (position.x < radius || position.x > mockCanvas.width - radius ||
                position.y < radius || position.y > mockCanvas.height - radius) {
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
    
    // Test 3: Connection-based Hierarchy
    totalTests++;
    console.log('\nTest 3: Connection-based Hierarchy');
    try {
        const positions = sorter.calculateGridPositions(testParticles);
        
        // Hub1 (3 connections) should be positioned higher (lower Y) than node3 (1 connection)
        const hub1Pos = positions.get('hub1');
        const node3Pos = positions.get('node3');
        
        if (hub1Pos && node3Pos && hub1Pos.y < node3Pos.y) {
            console.log('✅ Higher connection nodes positioned above lower connection nodes');
            console.log(`   Hub1 (3 conn) Y: ${hub1Pos.y.toFixed(1)}, Node3 (1 conn) Y: ${node3Pos.y.toFixed(1)}`);
            testsPassed++;
        } else {
            console.log('❌ Connection-based hierarchy not working correctly');
            console.log(`   Hub1 Y: ${hub1Pos?.y}, Node3 Y: ${node3Pos?.y}`);
        }
    } catch (error) {
        console.log('❌ Hierarchy test threw error:', error.message);
    }
    
    // Test 4: Cluster Separation
    totalTests++;
    console.log('\nTest 4: Cluster Separation');
    try {
        const positions = sorter.calculateGridPositions(testParticles);
        
        // Nodes from different clusters should be separated horizontally
        const hub1Pos = positions.get('hub1');
        const hub2Pos = positions.get('hub2');
        
        if (hub1Pos && hub2Pos) {
            const horizontalDistance = Math.abs(hub1Pos.x - hub2Pos.x);
            
            if (horizontalDistance >= sorter.clusterSpacing) {
                console.log('✅ Clusters are properly separated');
                console.log(`   Horizontal distance between cluster hubs: ${horizontalDistance.toFixed(1)}px`);
                testsPassed++;
            } else {
                console.log('❌ Clusters not sufficiently separated');
                console.log(`   Distance: ${horizontalDistance.toFixed(1)}px, Required: ${sorter.clusterSpacing}px`);
            }
        } else {
            console.log('❌ Could not find cluster hub positions');
        }
    } catch (error) {
        console.log('❌ Cluster separation test threw error:', error.message);
    }
    
    // Test 5: Node Spacing
    totalTests++;
    console.log('\nTest 5: Node Spacing');
    try {
        const positions = sorter.calculateGridPositions(testParticles);
        
        // Check spacing between nodes in the same cluster
        const node1Pos = positions.get('node1');
        const node2Pos = positions.get('node2');
        
        if (node1Pos && node2Pos) {
            const distance = Math.sqrt(
                Math.pow(node1Pos.x - node2Pos.x, 2) + 
                Math.pow(node1Pos.y - node2Pos.y, 2)
            );
            
            // Distance should be close to the node spacing (allowing some tolerance)
            const expectedSpacing = sorter.nodeSpacing;
            const tolerance = expectedSpacing * 0.2; // 20% tolerance
            
            if (Math.abs(distance - expectedSpacing) <= tolerance) {
                console.log('✅ Node spacing is correct');
                console.log(`   Distance: ${distance.toFixed(1)}px, Expected: ${expectedSpacing}px`);
                testsPassed++;
            } else {
                console.log('❌ Node spacing incorrect');
                console.log(`   Distance: ${distance.toFixed(1)}px, Expected: ~${expectedSpacing}px`);
            }
        } else {
            console.log('❌ Could not find node positions for spacing test');
        }
    } catch (error) {
        console.log('❌ Node spacing test threw error:', error.message);
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
function visualizeExpectedLayout() {
    console.log('\n📊 Expected Grid Layout:');
    console.log('');
    console.log('Cluster 1 (Left)    Gap    Cluster 2 (Right)    Gap    Isolated');
    console.log('┌─────────────────┐         ┌─────────────────┐         ┌─────────┐');
    console.log('│ Hub1 (3 conn)   │         │ Hub2 (1 conn)   │         │ Isolated│');
    console.log('│ Node1,Node2(2c) │         │ Node4 (1 conn)  │         │ (0 conn)│');
    console.log('│ Node3 (1 conn)  │         │                 │         │         │');
    console.log('└─────────────────┘         └─────────────────┘         └─────────┘');
    console.log('');
    console.log('Legend: Higher connections = higher position in cluster');
    console.log('        Clusters separated by 100px horizontally');
    console.log('        Nodes within cluster separated by 50px');
}

// Run the tests
if (typeof window !== 'undefined') {
    // Browser environment
    window.testParticleSorting = runSortTests;
    window.visualizeExpectedLayout = visualizeExpectedLayout;
    console.log('Particle sorting tests loaded. Run testParticleSorting() to execute tests.');
} else {
    // Node.js environment
    runSortTests();
    visualizeExpectedLayout();
}

export { runSortTests, visualizeExpectedLayout };
