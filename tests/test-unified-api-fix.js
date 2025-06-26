// Test to verify the unified API fix for the original sorting error
// This test uses the actual JSON format that was causing the "particles is not iterable" error

import { ParticleSorter } from '../src/public/sort-particles.js';
import { ParticleShuffler } from '../src/public/shuffle-particles.js';

// Mock canvas for testing
const mockCanvas = {
    width: 800,
    height: 600
};

// Test data: The actual JSON format that was causing the error
const testJsonData = {
    "nodes": {
        "App.vue": {
            "x": 400,
            "y": 50,
            "color": "#2196F3",
            "title": "App.vue",
            "radius": 30,
            "data": {
                "type": "root-component",
                "description": "Root Vue application component"
            }
        },
        "OutputDashboard.vue": {
            "x": 400,
            "y": 150,
            "color": "#4CAF50",
            "title": "OutputDashboard.vue",
            "radius": 35,
            "data": {
                "type": "page-component",
                "description": "Main dashboard page with tabs and layout"
            }
        },
        "ApplicationAlert.vue": {
            "x": 200,
            "y": 100,
            "color": "#FF9800",
            "title": "ApplicationAlert.vue",
            "radius": 20,
            "data": {
                "type": "component",
                "description": "Global alert component"
            }
        }
    },
    "edges": {
        "app-router": {
            "id": "app-router",
            "source": "App.vue",
            "target": "OutputDashboard.vue",
            "label": "RouterView",
            "directed": true
        },
        "app-alert": {
            "id": "app-alert",
            "source": "App.vue",
            "target": "ApplicationAlert.vue",
            "label": "imports",
            "directed": true
        }
    }
};

function runUnifiedApiTests() {
    console.log('🧪 Testing Unified API Fix...\n');
    
    let testsPassed = 0;
    let totalTests = 0;
    
    // Test 1: ParticleSorter with graph format
    totalTests++;
    console.log('Test 1: ParticleSorter with Graph Format');
    try {
        const sorter = new ParticleSorter(mockCanvas);
        
        // This should NOT throw "particles is not iterable" error
        const preparedData = sorter.prepareGraphData(testJsonData);
        const clusters = sorter.detectClusters(preparedData);
        const positions = sorter.calculateGridPositions(preparedData);
        
        console.log('✅ ParticleSorter successfully processed graph format');
        console.log(`   Prepared ${Object.keys(preparedData).length} nodes`);
        console.log(`   Detected ${clusters.length} clusters`);
        console.log(`   Generated ${positions.size} positions`);
        testsPassed++;
        
    } catch (error) {
        console.log('❌ ParticleSorter failed with graph format:', error.message);
    }
    
    // Test 2: ParticleShuffler with graph format
    totalTests++;
    console.log('\nTest 2: ParticleShuffler with Graph Format');
    try {
        const shuffler = new ParticleShuffler(mockCanvas);
        
        // This should NOT throw "particles is not iterable" error
        const preparedData = shuffler.prepareGraphData(testJsonData);
        const centrality = shuffler.calculateCentrality(preparedData);
        const targets = shuffler.calculateTargetPositions(preparedData, centrality);
        
        console.log('✅ ParticleShuffler successfully processed graph format');
        console.log(`   Prepared ${Object.keys(preparedData).length} nodes`);
        console.log(`   Calculated centrality for ${centrality.size} nodes`);
        console.log(`   Generated ${targets.size} target positions`);
        testsPassed++;
        
    } catch (error) {
        console.log('❌ ParticleShuffler failed with graph format:', error.message);
    }
    
    // Test 3: Edge merging verification
    totalTests++;
    console.log('\nTest 3: Edge Merging Verification');
    try {
        const sorter = new ParticleSorter(mockCanvas);
        const preparedData = sorter.prepareGraphData(testJsonData);
        
        // Check if edges were properly merged
        const appVue = preparedData['App.vue'];
        const expectedConnections = 2; // Should connect to OutputDashboard.vue and ApplicationAlert.vue
        const actualConnections = appVue.edges ? appVue.edges.length : 0;
        
        if (actualConnections === expectedConnections) {
            console.log('✅ Edge merging working correctly');
            console.log(`   App.vue has ${actualConnections} connections as expected`);
            testsPassed++;
        } else {
            console.log(`❌ Edge merging failed: expected ${expectedConnections}, got ${actualConnections}`);
        }
        
    } catch (error) {
        console.log('❌ Edge merging test failed:', error.message);
    }
    
    // Test Summary
    console.log('\n' + '='.repeat(50));
    console.log(`🧪 Unified API Fix Test Results: ${testsPassed}/${totalTests} tests passed`);
    
    if (testsPassed === totalTests) {
        console.log('🎉 All tests passed! The "particles is not iterable" error has been fixed.');
        console.log('✨ The unified API now correctly handles graph format from JSON files.');
        return true;
    } else {
        console.log('⚠️  Some tests failed. The fix may need additional work.');
        return false;
    }
}

// Run the tests
if (typeof window !== 'undefined') {
    // Browser environment
    window.testUnifiedApiFix = runUnifiedApiTests;
    console.log('Unified API fix tests loaded. Run testUnifiedApiFix() to execute tests.');
} else {
    // Node.js environment
    runUnifiedApiTests();
}

export { runUnifiedApiTests };
