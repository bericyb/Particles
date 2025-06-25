// Test for particle shuffling functionality
// This test verifies that the centrality-based shuffling algorithm works correctly

import { ParticleShuffler } from '../src/public/sort-particles.js';

// Mock canvas for testing
const mockCanvas = {
    width: 800,
    height: 600
};

// Test data: particles with different connection counts
const testParticles = new Map([
    ['hub', {
        x: 100, y: 100, radius: 20, title: 'Hub Node',
        edges: [
            { key: 'node1', label: 'connects to' },
            { key: 'node2', label: 'connects to' },
            { key: 'node3', label: 'connects to' },
            { key: 'node4', label: 'connects to' }
        ]
    }],
    ['node1', {
        x: 200, y: 200, radius: 20, title: 'Node 1',
        edges: [
            { key: 'hub', label: 'connects to' },
            { key: 'node2', label: 'connects to' }
        ]
    }],
    ['node2', {
        x: 300, y: 300, radius: 20, title: 'Node 2',
        edges: [
            { key: 'hub', label: 'connects to' },
            { key: 'node1', label: 'connects to' }
        ]
    }],
    ['node3', {
        x: 400, y: 400, radius: 20, title: 'Node 3',
        edges: [
            { key: 'hub', label: 'connects to' }
        ]
    }],
    ['node4', {
        x: 500, y: 500, radius: 20, title: 'Node 4',
        edges: [
            { key: 'hub', label: 'connects to' }
        ]
    }],
    ['isolated', {
        x: 600, y: 600, radius: 20, title: 'Isolated Node',
        edges: []
    }]
]);

function runTests() {
    console.log('🧪 Starting Particle Shuffling Tests...\n');
    
    const shuffler = new ParticleShuffler(mockCanvas);
    let testsPassed = 0;
    let totalTests = 0;
    
    // Test 1: Centrality Calculation
    totalTests++;
    console.log('Test 1: Centrality Calculation');
    try {
        const centrality = shuffler.calculateCentrality(testParticles);
        
        const expectedCentrality = {
            'hub': 4,      // 4 connections
            'node1': 2,    // 2 connections
            'node2': 2,    // 2 connections
            'node3': 1,    // 1 connection
            'node4': 1,    // 1 connection
            'isolated': 0  // 0 connections
        };
        
        let centralityCorrect = true;
        for (const [key, expectedCount] of Object.entries(expectedCentrality)) {
            if (centrality.get(key) !== expectedCount) {
                console.log(`❌ Centrality for ${key}: expected ${expectedCount}, got ${centrality.get(key)}`);
                centralityCorrect = false;
            }
        }
        
        if (centralityCorrect) {
            console.log('✅ Centrality calculation correct');
            testsPassed++;
        } else {
            console.log('❌ Centrality calculation failed');
        }
    } catch (error) {
        console.log('❌ Centrality calculation threw error:', error.message);
    }
    
    // Test 2: Target Position Calculation
    totalTests++;
    console.log('\nTest 2: Target Position Calculation');
    try {
        const centrality = shuffler.calculateCentrality(testParticles);
        const targets = shuffler.calculateTargetPositions(testParticles, centrality);
        
        const centerX = mockCanvas.width / 2;  // 400
        const centerY = mockCanvas.height / 2; // 300
        
        // Hub node (highest centrality) should be closest to center
        const hubTarget = targets.get('hub');
        const hubDistanceFromCenter = Math.sqrt(
            Math.pow(hubTarget.x - centerX, 2) + Math.pow(hubTarget.y - centerY, 2)
        );
        
        // Isolated node (lowest centrality) should be furthest from center
        const isolatedTarget = targets.get('isolated');
        const isolatedDistanceFromCenter = Math.sqrt(
            Math.pow(isolatedTarget.x - centerX, 2) + Math.pow(isolatedTarget.y - centerY, 2)
        );
        
        if (hubDistanceFromCenter < isolatedDistanceFromCenter) {
            console.log('✅ High centrality node closer to center than low centrality node');
            console.log(`   Hub distance: ${hubDistanceFromCenter.toFixed(2)}, Isolated distance: ${isolatedDistanceFromCenter.toFixed(2)}`);
            testsPassed++;
        } else {
            console.log('❌ Target positioning incorrect');
            console.log(`   Hub distance: ${hubDistanceFromCenter.toFixed(2)}, Isolated distance: ${isolatedDistanceFromCenter.toFixed(2)}`);
        }
    } catch (error) {
        console.log('❌ Target position calculation threw error:', error.message);
    }
    
    // Test 3: Concentric Ring Distribution
    totalTests++;
    console.log('\nTest 3: Concentric Ring Distribution');
    try {
        const centrality = shuffler.calculateCentrality(testParticles);
        const targets = shuffler.calculateTargetPositions(testParticles, centrality);
        
        const centerX = mockCanvas.width / 2;
        const centerY = mockCanvas.height / 2;
        
        // Group nodes by centrality and check if they're at similar distances
        const centralityGroups = new Map();
        for (const [key, particle] of testParticles) {
            const edgeCount = particle.edges.length;
            if (!centralityGroups.has(edgeCount)) {
                centralityGroups.set(edgeCount, []);
            }
            centralityGroups.get(edgeCount).push(key);
        }
        
        let ringDistributionCorrect = true;
        for (const [centralityLevel, nodeKeys] of centralityGroups) {
            if (nodeKeys.length > 1) {
                const distances = nodeKeys.map(key => {
                    const target = targets.get(key);
                    return Math.sqrt(
                        Math.pow(target.x - centerX, 2) + Math.pow(target.y - centerY, 2)
                    );
                });
                
                // Check if all nodes at same centrality level are at similar distances
                const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
                const maxDeviation = Math.max(...distances.map(d => Math.abs(d - avgDistance)));
                
                // Allow some tolerance for positioning variation
                if (maxDeviation > avgDistance * 0.1) { // 10% tolerance
                    console.log(`❌ Nodes with ${centralityLevel} connections not at similar distances`);
                    console.log(`   Average distance: ${avgDistance.toFixed(2)}, Max deviation: ${maxDeviation.toFixed(2)}`);
                    ringDistributionCorrect = false;
                }
            }
        }
        
        if (ringDistributionCorrect) {
            console.log('✅ Nodes with same centrality positioned at similar distances from center');
            testsPassed++;
        }
    } catch (error) {
        console.log('❌ Ring distribution test threw error:', error.message);
    }
    
    // Test 4: Boundary Constraints
    totalTests++;
    console.log('\nTest 4: Boundary Constraints');
    try {
        const centrality = shuffler.calculateCentrality(testParticles);
        const targets = shuffler.calculateTargetPositions(testParticles, centrality);
        
        let allWithinBounds = true;
        for (const [key, target] of targets) {
            const particle = testParticles.get(key);
            if (target.x < particle.radius || target.x > mockCanvas.width - particle.radius ||
                target.y < particle.radius || target.y > mockCanvas.height - particle.radius) {
                console.log(`❌ Node ${key} positioned outside canvas bounds`);
                allWithinBounds = false;
            }
        }
        
        if (allWithinBounds) {
            console.log('✅ All nodes positioned within canvas boundaries');
            testsPassed++;
        }
    } catch (error) {
        console.log('❌ Boundary constraints test threw error:', error.message);
    }
    
    // Test 5: Minimum Distance from Center
    totalTests++;
    console.log('\nTest 5: Minimum Distance from Center');
    try {
        const centrality = shuffler.calculateCentrality(testParticles);
        const targets = shuffler.calculateTargetPositions(testParticles, centrality);
        
        const centerX = mockCanvas.width / 2;
        const centerY = mockCanvas.height / 2;
        
        let allAboveMinDistance = true;
        for (const [key, target] of targets) {
            const distance = Math.sqrt(
                Math.pow(target.x - centerX, 2) + Math.pow(target.y - centerY, 2)
            );
            
            if (distance < shuffler.minRadius) {
                console.log(`❌ Node ${key} positioned too close to center: ${distance.toFixed(2)} < ${shuffler.minRadius}`);
                allAboveMinDistance = false;
            }
        }
        
        if (allAboveMinDistance) {
            console.log('✅ All nodes respect minimum distance from center');
            testsPassed++;
        }
    } catch (error) {
        console.log('❌ Minimum distance test threw error:', error.message);
    }
    
    // Test Summary
    console.log('\n' + '='.repeat(50));
    console.log(`🧪 Test Results: ${testsPassed}/${totalTests} tests passed`);
    
    if (testsPassed === totalTests) {
        console.log('🎉 All tests passed! Particle shuffling algorithm is working correctly.');
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
