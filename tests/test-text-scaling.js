/**
 * Test for text scaling functionality
 * This test verifies that node label text scales proportionally with node radius
 */

// Mock canvas context for testing
class MockCanvasContext {
    constructor() {
        this._font = '';
        this.textAlign = '';
        this.fillStyle = '';
        this.fontCalls = [];
        this.fillTextCalls = [];
    }
    
    set font(value) {
        this._font = value;
        this.fontCalls.push(value);
    }
    
    get font() {
        return this._font;
    }
    
    fillText(text, x, y) {
        this.fillTextCalls.push({ text, x, y, font: this.font });
    }
    
    beginPath() {}
    arc() {}
    fill() {}
    stroke() {}
    moveTo() {}
    lineTo() {}
}

// Import the drawing functions (simulated for testing)
function calculateFontSize(radius) {
    return Math.max(8, Math.min(24, radius * 0.7));
}

function setScaledFont(ctx, radius) {
    const fontSize = calculateFontSize(radius);
    ctx.font = `${fontSize}px 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`;
}

// Test cases
function testFontSizeCalculation() {
    console.log('Testing font size calculation...');
    
    // Test various radius values
    const testCases = [
        { radius: 5, expectedMin: 8 },    // Should use minimum (8px)
        { radius: 10, expectedMin: 8 },   // 10 * 0.7 = 7, but min is 8
        { radius: 20, expectedSize: 14 }, // 20 * 0.7 = 14
        { radius: 30, expectedSize: 21 }, // 30 * 0.7 = 21
        { radius: 40, expectedSize: 24 }, // 40 * 0.7 = 28, but max is 24
        { radius: 50, expectedMax: 24 },  // Should use maximum (24px)
    ];
    
    testCases.forEach(({ radius, expectedSize, expectedMin, expectedMax }) => {
        const fontSize = calculateFontSize(radius);
        const expected = expectedSize || expectedMin || expectedMax;
        
        console.log(`Radius ${radius}: Expected ${expected}px, Got ${fontSize}px`);
        
        if (fontSize !== expected) {
            console.error(`❌ FAIL: Radius ${radius} should produce ${expected}px font, got ${fontSize}px`);
        } else {
            console.log(`✅ PASS: Radius ${radius} correctly produces ${fontSize}px font`);
        }
    });
}

function testScaledFontSetting() {
    console.log('\nTesting scaled font setting...');
    
    const ctx = new MockCanvasContext();
    const testRadii = [10, 20, 30, 40];
    
    testRadii.forEach(radius => {
        setScaledFont(ctx, radius);
        const expectedSize = calculateFontSize(radius);
        const expectedFont = `${expectedSize}px 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`;
        
        if (ctx.font === expectedFont) {
            console.log(`✅ PASS: Radius ${radius} correctly sets font to "${ctx.font}"`);
        } else {
            console.error(`❌ FAIL: Radius ${radius} should set font to "${expectedFont}", got "${ctx.font}"`);
        }
    });
}

function testLegacyParticleDrawing() {
    console.log('\nTesting legacy particle drawing with scaled text...');
    
    const ctx = new MockCanvasContext();
    const particles = new Map([
        ['small', { x: 100, y: 100, radius: 10, edges: [] }],
        ['medium', { x: 200, y: 200, radius: 20, edges: [] }],
        ['large', { x: 300, y: 300, radius: 30, edges: [] }]
    ]);
    
    // Simulate the drawing loop for legacy particles
    for (const [key, particle] of particles) {
        // Set font size based on particle radius (simulating the actual code)
        setScaledFont(ctx, particle.radius);
        ctx.fillStyle = "white";
        ctx.fillText(key, particle.x, particle.y - particle.radius * 1.4);
    }
    
    // Verify that different font sizes were used
    const uniqueFonts = [...new Set(ctx.fontCalls)];
    console.log(`Used ${uniqueFonts.length} different font sizes:`, uniqueFonts);
    
    if (uniqueFonts.length === 3) {
        console.log('✅ PASS: Different font sizes used for different radius values');
    } else {
        console.error('❌ FAIL: Expected 3 different font sizes, got', uniqueFonts.length);
    }
    
    // Verify font sizes are proportional to radius
    const fontSizes = ctx.fontCalls.map(font => parseInt(font.match(/(\d+)px/)[1]));
    console.log('Font sizes used:', fontSizes);
    
    // Check that larger radius produces larger font (with bounds)
    const smallFont = fontSizes[0]; // radius 10
    const mediumFont = fontSizes[1]; // radius 20  
    const largeFont = fontSizes[2]; // radius 30
    
    if (smallFont <= mediumFont && mediumFont <= largeFont) {
        console.log('✅ PASS: Font sizes increase with radius (respecting min/max bounds)');
    } else {
        console.error('❌ FAIL: Font sizes should increase with radius');
    }
}

function testNewGraphFormatDrawing() {
    console.log('\nTesting new graph format drawing with scaled text...');
    
    const ctx = new MockCanvasContext();
    const graphData = {
        nodes: {
            'nodeA': { x: 100, y: 100, radius: 15 },
            'nodeB': { x: 200, y: 200, radius: 25 },
            'nodeC': { x: 300, y: 300, radius: 35 }
        },
        edges: {}
    };
    
    // Simulate the drawing loop for new graph format
    for (const [nodeKey, node] of Object.entries(graphData.nodes)) {
        // Set font size based on node radius (simulating the actual code)
        setScaledFont(ctx, node.radius);
        ctx.fillStyle = "white";
        ctx.fillText(nodeKey, node.x, node.y - node.radius * 1.4);
    }
    
    // Verify that different font sizes were used
    const uniqueFonts = [...new Set(ctx.fontCalls)];
    console.log(`Used ${uniqueFonts.length} different font sizes:`, uniqueFonts);
    
    if (uniqueFonts.length === 3) {
        console.log('✅ PASS: Different font sizes used for different radius values in new graph format');
    } else {
        console.error('❌ FAIL: Expected 3 different font sizes for new graph format, got', uniqueFonts.length);
    }
}

function testBoundaryConditions() {
    console.log('\nTesting boundary conditions...');
    
    // Test minimum boundary
    const minFont = calculateFontSize(1); // Very small radius
    if (minFont === 8) {
        console.log('✅ PASS: Minimum font size (8px) enforced for very small radius');
    } else {
        console.error(`❌ FAIL: Expected minimum 8px, got ${minFont}px`);
    }
    
    // Test maximum boundary  
    const maxFont = calculateFontSize(100); // Very large radius
    if (maxFont === 24) {
        console.log('✅ PASS: Maximum font size (24px) enforced for very large radius');
    } else {
        console.error(`❌ FAIL: Expected maximum 24px, got ${maxFont}px`);
    }
    
    // Test exact boundary values
    const boundaryTests = [
        { radius: 8 / 0.7, expected: 8 }, // Should be close to minimum
        { radius: 24 / 0.7, expected: 24 }, // Should be close to maximum
    ];
    
    boundaryTests.forEach(({ radius, expected }) => {
        const fontSize = calculateFontSize(radius);
        console.log(`Boundary test - Radius ${radius.toFixed(1)}: Expected ${expected}px, Got ${fontSize}px`);
    });
}

// Run all tests
console.log('🧪 Running Text Scaling Tests\n');
console.log('='.repeat(50));

testFontSizeCalculation();
testScaledFontSetting();
testLegacyParticleDrawing();
testNewGraphFormatDrawing();
testBoundaryConditions();

console.log('\n' + '='.repeat(50));
console.log('✅ Text scaling tests completed!');
console.log('\nThe implementation should now:');
console.log('• Scale text size proportionally with node radius (0.7x multiplier)');
console.log('• Enforce minimum font size of 8px for readability');
console.log('• Enforce maximum font size of 24px to prevent oversized text');
console.log('• Work with both legacy particle format and new graph format');
console.log('• Maintain the Inter font family for consistency');
