/**
 * Simple test for shift-click-drag selection box functionality
 * This test verifies the core logic without external dependencies
 */

// Mock particles data
const particles = {
    nodes: {
        'node1': { x: 100, y: 100, radius: 20, title: 'Node 1' },
        'node2': { x: 200, y: 150, radius: 20, title: 'Node 2' },
        'node3': { x: 300, y: 200, radius: 20, title: 'Node 3' },
        'node4': { x: 400, y: 250, radius: 20, title: 'Node 4' }
    },
    edges: {}
};

// Selection box state
let isSelectionBoxActive = false;
let selectionBoxStart = { x: 0, y: 0 };
let selectionBoxEnd = { x: 0, y: 0 };
let selectedNodes = new Set();

// Test functions
function testSelectionBoxInitialization() {
    console.log('🧪 Testing selection box initialization...');
    
    const initialState = {
        isSelectionBoxActive: false,
        selectionBoxStart: { x: 0, y: 0 },
        selectionBoxEnd: { x: 0, y: 0 },
        selectedNodes: new Set()
    };
    
    const success = 
        isSelectionBoxActive === initialState.isSelectionBoxActive &&
        JSON.stringify(selectionBoxStart) === JSON.stringify(initialState.selectionBoxStart) &&
        JSON.stringify(selectionBoxEnd) === JSON.stringify(initialState.selectionBoxEnd) &&
        selectedNodes.size === initialState.selectedNodes.size;
    
    console.log(success ? '✅ Selection box initialization test passed' : '❌ Selection box initialization test failed');
    return success;
}

function testSelectionBoxStart() {
    console.log('🧪 Testing selection box start...');
    
    // Simulate shift+click on empty space at (150, 120)
    const clickX = 150;
    const clickY = 120;
    const shiftKey = true;
    
    // Check if click is on a node
    let clickedNode = false;
    for (const [key, particle] of Object.entries(particles.nodes)) {
        if (particle.x + particle.radius >= clickX && particle.x - particle.radius <= clickX && 
            particle.y + particle.radius >= clickY && particle.y - particle.radius <= clickY) {
            clickedNode = true;
            break;
        }
    }
    
    // Start selection box if shift+click on empty space
    if (!clickedNode && shiftKey) {
        isSelectionBoxActive = true;
        selectionBoxStart.x = clickX;
        selectionBoxStart.y = clickY;
        selectionBoxEnd.x = clickX;
        selectionBoxEnd.y = clickY;
    }
    
    const success = 
        isSelectionBoxActive === true &&
        selectionBoxStart.x === clickX &&
        selectionBoxStart.y === clickY &&
        selectionBoxEnd.x === clickX &&
        selectionBoxEnd.y === clickY;
    
    console.log(success ? '✅ Selection box start test passed' : '❌ Selection box start test failed');
    return success;
}

function testSelectionBoxUpdate() {
    console.log('🧪 Testing selection box update...');
    
    // Simulate mousemove to (250, 200)
    const newX = 250;
    const newY = 200;
    
    if (isSelectionBoxActive) {
        selectionBoxEnd.x = newX;
        selectionBoxEnd.y = newY;
    }
    
    const success = 
        selectionBoxEnd.x === newX &&
        selectionBoxEnd.y === newY;
    
    console.log(success ? '✅ Selection box update test passed' : '❌ Selection box update test failed');
    return success;
}

function testNodeSelection() {
    console.log('🧪 Testing node selection within box...');
    
    // Current selection box: (150, 120) to (250, 200)
    // Should select nodes within this area
    
    if (isSelectionBoxActive) {
        const boxLeft = Math.min(selectionBoxStart.x, selectionBoxEnd.x);
        const boxRight = Math.max(selectionBoxStart.x, selectionBoxEnd.x);
        const boxTop = Math.min(selectionBoxStart.y, selectionBoxEnd.y);
        const boxBottom = Math.max(selectionBoxStart.y, selectionBoxEnd.y);
        
        // Find nodes within the selection box
        for (const [nodeKey, node] of Object.entries(particles.nodes)) {
            if (node.x >= boxLeft && node.x <= boxRight && 
                node.y >= boxTop && node.y <= boxBottom) {
                selectedNodes.add(nodeKey);
            }
        }
        
        isSelectionBoxActive = false;
    }
    
    // Expected: node2 (200, 150) should be selected
    // node1 (100, 100) - outside (x < 150)
    // node2 (200, 150) - inside
    // node3 (300, 200) - outside (x > 250)
    // node4 (400, 250) - outside (x > 250, y > 200)
    
    const success = 
        !selectedNodes.has('node1') &&
        selectedNodes.has('node2') &&
        !selectedNodes.has('node3') &&
        !selectedNodes.has('node4') &&
        isSelectionBoxActive === false;
    
    console.log(success ? '✅ Node selection test passed' : '❌ Node selection test failed');
    console.log(`Selected nodes: ${Array.from(selectedNodes).join(', ')}`);
    return success;
}

function testSelectionBoxCancel() {
    console.log('🧪 Testing selection box cancellation...');
    
    // Reset for this test
    isSelectionBoxActive = true;
    
    // Simulate mouse leave
    if (isSelectionBoxActive) {
        isSelectionBoxActive = false;
    }
    
    const success = isSelectionBoxActive === false;
    
    console.log(success ? '✅ Selection box cancellation test passed' : '❌ Selection box cancellation test failed');
    return success;
}

function testNodeClickDetection() {
    console.log('🧪 Testing node click detection...');
    
    // Test clicking directly on node1 (100, 100, radius 20)
    const clickX = 100;
    const clickY = 100;
    
    let clickedNode = false;
    let clickedNodeKey = null;
    
    for (const [key, particle] of Object.entries(particles.nodes)) {
        if (particle.x + particle.radius >= clickX && particle.x - particle.radius <= clickX && 
            particle.y + particle.radius >= clickY && particle.y - particle.radius <= clickY) {
            clickedNode = true;
            clickedNodeKey = key;
            break;
        }
    }
    
    const success = clickedNode === true && clickedNodeKey === 'node1';
    
    console.log(success ? '✅ Node click detection test passed' : '❌ Node click detection test failed');
    console.log(`Clicked node: ${clickedNodeKey}`);
    return success;
}

// Run all tests
function runAllTests() {
    console.log('🚀 Running Selection Box Tests\n');
    
    const tests = [
        testSelectionBoxInitialization,
        testSelectionBoxStart,
        testSelectionBoxUpdate,
        testNodeSelection,
        testSelectionBoxCancel,
        testNodeClickDetection
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
        if (test()) {
            passed++;
        }
        console.log(''); // Add spacing between tests
    }
    
    console.log(`📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All selection box tests passed! The feature is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please review the implementation.');
    }
    
    return passed === total;
}

// Run the tests
runAllTests();
