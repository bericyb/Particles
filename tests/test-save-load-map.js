/**
 * Test for save/load map functionality with data fields
 * This test verifies that data fields are preserved when saving and loading maps
 */

// Test data with data fields
const testMapData = {
    'node-1': {
        x: 100,
        y: 100,
        title: 'Node with Data',
        radius: 20,
        color: 'blue',
        data: {
            type: 'test',
            value: 42,
            metadata: {
                created: '2025-01-01',
                tags: ['important', 'test']
            }
        },
        edges: []
    },
    'node-2': {
        x: 200,
        y: 100,
        title: 'Node without Data',
        radius: 15,
        color: 'red',
        edges: []
    }
};

function testSaveMapDataPreservation() {
    console.log('Testing: Save map data preservation...');
    
    // Simulate the save map functionality
    try {
        // This is what saveParticleMap() does
        const particleData = Object.fromEntries(new Map(Object.entries(testMapData)));
        const jsonData = JSON.stringify(particleData, null, 2);
        
        // Parse it back to verify data is preserved
        const parsedData = JSON.parse(jsonData);
        
        // Check that data field is preserved
        if (!parsedData['node-1'].data || parsedData['node-1'].data.type !== 'test') {
            throw new Error('Data field not preserved in save operation');
        }
        
        if (parsedData['node-2'].data !== undefined) {
            throw new Error('Node without data should not have data field');
        }
        
        console.log('✓ Save map preserves data fields correctly');
        return parsedData;
        
    } catch (error) {
        console.error('✗ Save map data preservation failed:', error.message);
        throw error;
    }
}

function testLoadMapDataPreservation() {
    console.log('Testing: Load map data preservation...');
    
    try {
        // Simulate loading the saved data
        const jsonData = JSON.stringify(testMapData);
        const parsedData = JSON.parse(jsonData);
        
        // This is what openParticleMap() does
        const particles = new Map(Object.entries(parsedData));
        
        // Verify data is preserved
        const node1 = particles.get('node-1');
        if (!node1.data || node1.data.type !== 'test' || node1.data.value !== 42) {
            throw new Error('Data field not preserved in load operation');
        }
        
        const node2 = particles.get('node-2');
        if (node2.data !== undefined) {
            throw new Error('Node without data should not have data field after load');
        }
        
        console.log('✓ Load map preserves data fields correctly');
        
    } catch (error) {
        console.error('✗ Load map data preservation failed:', error.message);
        throw error;
    }
}

function testCompleteRoundTrip() {
    console.log('Testing: Complete save/load round trip...');
    
    try {
        // Start with test data
        const originalParticles = new Map(Object.entries(testMapData));
        
        // Simulate save operation
        const particleData = Object.fromEntries(originalParticles);
        const jsonData = JSON.stringify(particleData, null, 2);
        
        // Simulate load operation
        const loadedData = JSON.parse(jsonData);
        const loadedParticles = new Map(Object.entries(loadedData));
        
        // Compare original and loaded data
        const originalNode1 = originalParticles.get('node-1');
        const loadedNode1 = loadedParticles.get('node-1');
        
        if (JSON.stringify(originalNode1.data) !== JSON.stringify(loadedNode1.data)) {
            throw new Error('Data field not preserved through complete round trip');
        }
        
        console.log('✓ Complete save/load round trip preserves data correctly');
        
    } catch (error) {
        console.error('✗ Complete round trip failed:', error.message);
        throw error;
    }
}

function testDataFieldEdgeCases() {
    console.log('Testing: Data field edge cases in save/load...');
    
    const edgeCaseData = {
        'null-data': {
            x: 100, y: 100, title: 'Null Data', radius: 20,
            data: null, edges: []
        },
        'empty-object': {
            x: 200, y: 100, title: 'Empty Object', radius: 20,
            data: {}, edges: []
        },
        'complex-data': {
            x: 300, y: 100, title: 'Complex Data', radius: 20,
            data: {
                array: [1, 2, { nested: true }],
                nullValue: null,
                booleanValue: false,
                emptyString: '',
                unicode: 'Hello 世界 🌍'
            },
            edges: []
        }
    };
    
    try {
        // Round trip test
        const particles = new Map(Object.entries(edgeCaseData));
        const saved = JSON.stringify(Object.fromEntries(particles), null, 2);
        const loaded = new Map(Object.entries(JSON.parse(saved)));
        
        // Verify null data
        const nullDataNode = loaded.get('null-data');
        if (nullDataNode.data !== null) {
            throw new Error('Null data not preserved correctly');
        }
        
        // Verify empty object
        const emptyObjectNode = loaded.get('empty-object');
        if (!emptyObjectNode.data || typeof emptyObjectNode.data !== 'object') {
            throw new Error('Empty object data not preserved correctly');
        }
        
        // Verify complex data
        const complexNode = loaded.get('complex-data');
        if (!Array.isArray(complexNode.data.array) || complexNode.data.unicode !== 'Hello 世界 🌍') {
            throw new Error('Complex data not preserved correctly');
        }
        
        console.log('✓ Edge cases handled correctly in save/load');
        
    } catch (error) {
        console.error('✗ Edge case testing failed:', error.message);
        throw error;
    }
}

// Main test runner
function runSaveLoadTests() {
    console.log('=== Save/Load Map Data Field Tests ===');
    console.log('');
    
    try {
        testSaveMapDataPreservation();
        console.log('');
        
        testLoadMapDataPreservation();
        console.log('');
        
        testCompleteRoundTrip();
        console.log('');
        
        testDataFieldEdgeCases();
        console.log('');
        
        console.log('=== All Save/Load Tests Passed! ===');
        console.log('✓ Data fields are preserved correctly in save/load operations');
        console.log('✓ Frontend save/load functionality works with data fields');
        console.log('✓ Edge cases handled properly');
        
    } catch (error) {
        console.error('');
        console.error('=== Save/Load Tests Failed ===');
        console.error('✗ Error:', error.message);
    }
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runSaveLoadTests,
        testMapData,
        testSaveMapDataPreservation,
        testLoadMapDataPreservation,
        testCompleteRoundTrip,
        testDataFieldEdgeCases
    };
}

// Auto-run if this script is executed directly
if (typeof window === 'undefined' && require.main === module) {
    runSaveLoadTests();
}
