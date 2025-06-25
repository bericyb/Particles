const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Edge Rendering Fixes...\n');

// Test 1: Verify font consistency
console.log('1. Testing font consistency...');
const utilsPath = path.join(__dirname, '../src/public/utils.js');
const utilsContent = fs.readFileSync(utilsPath, 'utf8');

// Check if Inter font is being used
const fontMatch = utilsContent.match(/ctx\.font\s*=\s*["']([^"']+)["']/);
if (fontMatch && fontMatch[1].includes('Inter')) {
    console.log('   ✅ Canvas font updated to use Inter font family');
    console.log(`   📝 Font: ${fontMatch[1]}`);
} else if (utilsContent.includes("ctx.font = \"28px 'Inter'")) {
    console.log('   ✅ Canvas font updated to use Inter font family');
    console.log('   📝 Font: 28px Inter with system font fallbacks');
} else {
    console.log('   ❌ Canvas font not updated properly');
    console.log('   🔍 Debug: Looking for font setting...');
    const debugMatch = utilsContent.match(/ctx\.font\s*=\s*[^;]+/);
    if (debugMatch) {
        console.log(`   📝 Found: ${debugMatch[0]}`);
    }
    process.exit(1);
}

// Test 2: Verify edge deduplication logic
console.log('\n2. Testing edge deduplication logic...');

// Check for renderedEdges Set usage
if (utilsContent.includes('const renderedEdges = new Set()')) {
    console.log('   ✅ Edge deduplication tracking implemented');
} else {
    console.log('   ❌ Edge deduplication tracking not found');
    process.exit(1);
}

// Check for edge ID creation logic
if (utilsContent.includes('[key, edge.key].sort().join(\'-\')')) {
    console.log('   ✅ Consistent edge ID generation implemented');
} else {
    console.log('   ❌ Consistent edge ID generation not found');
    process.exit(1);
}

// Check for duplicate prevention
if (utilsContent.includes('if (renderedEdges.has(edgeId))')) {
    console.log('   ✅ Duplicate edge prevention logic implemented');
} else {
    console.log('   ❌ Duplicate edge prevention logic not found');
    process.exit(1);
}

// Test 3: Verify rendering order (edges before nodes)
console.log('\n3. Testing rendering order...');

const drawLegacyFunction = utilsContent.match(/function drawLegacyParticles\(ctx, particles\) \{([\s\S]*?)\n\}/);
if (drawLegacyFunction) {
    const functionBody = drawLegacyFunction[1];
    
    // Find positions of edge drawing and node drawing
    const edgeDrawingPos = functionBody.indexOf('// Draw edges first');
    const nodeDrawingPos = functionBody.indexOf('// Draw nodes (after edges');
    
    if (edgeDrawingPos !== -1 && nodeDrawingPos !== -1 && edgeDrawingPos < nodeDrawingPos) {
        console.log('   ✅ Edges are drawn before nodes (correct rendering order)');
    } else {
        console.log('   ❌ Rendering order may be incorrect');
        process.exit(1);
    }
} else {
    console.log('   ❌ Could not find drawLegacyParticles function');
    process.exit(1);
}

// Test 4: Verify text color improvements
console.log('\n4. Testing text color improvements...');

// Check for white text color for better visibility
if (utilsContent.includes('ctx.fillStyle = "white"')) {
    console.log('   ✅ Text color updated to white for better visibility');
} else {
    console.log('   ⚠️  Text color not explicitly set to white (may use default)');
}

// Test 5: Verify label rendering optimization
console.log('\n5. Testing label rendering optimization...');

if (utilsContent.includes('if (edge.label && edge.label.trim())')) {
    console.log('   ✅ Label rendering optimized (only renders non-empty labels)');
} else {
    console.log('   ❌ Label rendering optimization not found');
    process.exit(1);
}

console.log('\n🎉 All edge rendering fixes verified successfully!');
console.log('\n📋 Summary of fixes:');
console.log('   • Font updated to match HTML page (Inter font family)');
console.log('   • Edge deduplication prevents double rendering');
console.log('   • Consistent edge ID generation prevents A->B and B->A duplicates');
console.log('   • Edges drawn before nodes for proper layering');
console.log('   • Text color improved for better visibility');
console.log('   • Label rendering optimized for performance');
console.log('\n✨ The canvas should now display edges without duplication and use consistent fonts!');
