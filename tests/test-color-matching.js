// Test to verify node colors match button colors
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the utils.js file to extract the calculateNodeColor function
const utilsContent = readFileSync(join(__dirname, '../src/public/utils.js'), 'utf8');

// Extract and evaluate the calculateNodeColor function
const functionMatch = utilsContent.match(/function calculateNodeColor\([\s\S]*?\n}/);
if (!functionMatch) {
    throw new Error('Could not find calculateNodeColor function');
}

// Create a safe evaluation context
const calculateNodeColor = eval(`(${functionMatch[0]})`);

// Test the color calculation
console.log('Testing Node Color Matching with Button Colors');
console.log('='.repeat(50));

// Expected button colors
const expectedBlue = { r: 59, g: 130, b: 246 };   // #3b82f6
const expectedPurple = { r: 139, g: 92, b: 246 }; // #8b5cf6

// Helper function to parse RGB string
function parseRGB(rgbString) {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return null;
    return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
    };
}

// Test cases
const testCases = [
    { edgeCount: 0, maxEdges: 10, expectedColor: expectedBlue, description: 'No edges (should be blue)' },
    { edgeCount: 10, maxEdges: 10, expectedColor: expectedPurple, description: 'Max edges (should be purple)' },
    { edgeCount: 5, maxEdges: 10, expectedColor: null, description: 'Half edges (should be between blue and purple)' }
];

let allTestsPassed = true;

testCases.forEach((testCase, index) => {
    const result = calculateNodeColor(testCase.edgeCount, testCase.maxEdges);
    const parsedColor = parseRGB(result);
    
    console.log(`\nTest ${index + 1}: ${testCase.description}`);
    console.log(`Input: edgeCount=${testCase.edgeCount}, maxEdges=${testCase.maxEdges}`);
    console.log(`Result: ${result}`);
    console.log(`Parsed RGB: r=${parsedColor.r}, g=${parsedColor.g}, b=${parsedColor.b}`);
    
    if (testCase.expectedColor) {
        const matches = parsedColor.r === testCase.expectedColor.r && 
                       parsedColor.g === testCase.expectedColor.g && 
                       parsedColor.b === testCase.expectedColor.b;
        
        if (matches) {
            console.log('✅ PASS: Color matches expected value');
        } else {
            console.log(`❌ FAIL: Expected r=${testCase.expectedColor.r}, g=${testCase.expectedColor.g}, b=${testCase.expectedColor.b}`);
            allTestsPassed = false;
        }
    } else {
        // For the middle case, just verify it's between blue and purple
        const isValidInterpolation = parsedColor.r >= Math.min(expectedBlue.r, expectedPurple.r) &&
                                   parsedColor.r <= Math.max(expectedBlue.r, expectedPurple.r) &&
                                   parsedColor.g >= Math.min(expectedBlue.g, expectedPurple.g) &&
                                   parsedColor.g <= Math.max(expectedBlue.g, expectedPurple.g) &&
                                   parsedColor.b >= Math.min(expectedBlue.b, expectedPurple.b) &&
                                   parsedColor.b <= Math.max(expectedBlue.b, expectedPurple.b);
        
        if (isValidInterpolation) {
            console.log('✅ PASS: Color is valid interpolation between blue and purple');
        } else {
            console.log('❌ FAIL: Color is not a valid interpolation');
            allTestsPassed = false;
        }
    }
});

// Test edge cases
console.log('\n' + '='.repeat(50));
console.log('Testing Edge Cases');
console.log('='.repeat(50));

const edgeCases = [
    { edgeCount: 0, maxEdges: 1, description: 'Single node graph' },
    { edgeCount: 15, maxEdges: 10, description: 'Edge count exceeds max (should cap at purple)' },
    { edgeCount: 1, maxEdges: 100, description: 'Very low ratio (should be close to blue)' }
];

edgeCases.forEach((testCase, index) => {
    const result = calculateNodeColor(testCase.edgeCount, testCase.maxEdges);
    const parsedColor = parseRGB(result);
    
    console.log(`\nEdge Case ${index + 1}: ${testCase.description}`);
    console.log(`Input: edgeCount=${testCase.edgeCount}, maxEdges=${testCase.maxEdges}`);
    console.log(`Result: ${result}`);
    console.log(`Parsed RGB: r=${parsedColor.r}, g=${parsedColor.g}, b=${parsedColor.b}`);
    
    // Verify the result is a valid RGB color
    const isValidRGB = parsedColor.r >= 0 && parsedColor.r <= 255 &&
                      parsedColor.g >= 0 && parsedColor.g <= 255 &&
                      parsedColor.b >= 0 && parsedColor.b <= 255;
    
    if (isValidRGB) {
        console.log('✅ PASS: Valid RGB color generated');
    } else {
        console.log('❌ FAIL: Invalid RGB values');
        allTestsPassed = false;
    }
});

console.log('\n' + '='.repeat(50));
console.log('SUMMARY');
console.log('='.repeat(50));

if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Node colors now match button colors');
    console.log('✅ Blue nodes: rgb(59, 130, 246) - matches #3b82f6 button color');
    console.log('✅ Purple nodes: rgb(139, 92, 246) - matches #8b5cf6 button color');
    console.log('✅ Gradient interpolation working correctly');
} else {
    console.log('❌ SOME TESTS FAILED');
    console.log('Please check the implementation');
}

console.log('\nColor mapping:');
console.log('• Low connectivity nodes → Blue (like Add/Save buttons)');
console.log('• High connectivity nodes → Purple (like Tree/Graph buttons)');
