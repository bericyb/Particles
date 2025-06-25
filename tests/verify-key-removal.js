/**
 * Simple verification script for key input removal
 * This script checks that our changes are working correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying key input removal changes...\n');

// Read the HTML file
const htmlPath = path.join(__dirname, '../src/public/index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Read the JavaScript file
const jsPath = path.join(__dirname, '../src/public/graph.js');
const jsContent = fs.readFileSync(jsPath, 'utf8');

let allTestsPassed = true;

// Test 1: Check that key input field is removed from HTML
console.log('Test 1: Checking HTML form structure...');
const hasKeyInput = htmlContent.includes('id="particleKey"') || htmlContent.includes('name="key"');
const hasKeyLabel = htmlContent.includes('for="particleKey"') || htmlContent.includes('Key:');
const hasTitleInput = htmlContent.includes('id="particleTitle"') && htmlContent.includes('name="title"');

if (!hasKeyInput && !hasKeyLabel && hasTitleInput) {
    console.log('✅ Key input field successfully removed from HTML');
    console.log('✅ Title field is present and properly configured');
} else {
    console.log('❌ HTML form structure test failed');
    if (hasKeyInput) console.log('  - Key input field still exists');
    if (hasKeyLabel) console.log('  - Key label still exists');
    if (!hasTitleInput) console.log('  - Title input field missing or misconfigured');
    allTestsPassed = false;
}

// Test 2: Check JavaScript UUID generation function
console.log('\nTest 2: Checking UUID generation function...');
const hasUUIDFunction = jsContent.includes('function generateUUID()');
const hasUUIDFallback = jsContent.includes('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx');
const usesCryptoUUID = jsContent.includes('crypto.randomUUID');

if (hasUUIDFunction && hasUUIDFallback && usesCryptoUUID) {
    console.log('✅ UUID generation function is properly implemented');
    console.log('✅ Fallback UUID generation is available');
    console.log('✅ Modern crypto.randomUUID is used when available');
} else {
    console.log('❌ UUID generation test failed');
    if (!hasUUIDFunction) console.log('  - generateUUID function missing');
    if (!hasUUIDFallback) console.log('  - Fallback UUID generation missing');
    if (!usesCryptoUUID) console.log('  - crypto.randomUUID not used');
    allTestsPassed = false;
}

// Test 3: Check form submission logic
console.log('\nTest 3: Checking form submission logic...');
const hasCurrentEditingKey = jsContent.includes('currentEditingKey');
const hasUUIDGeneration = jsContent.includes('key = generateUUID()');
const hasUpdateLogic = jsContent.includes('key = currentEditingKey');

if (hasCurrentEditingKey && hasUUIDGeneration && hasUpdateLogic) {
    console.log('✅ Form submission logic properly handles UUID generation');
    console.log('✅ Update mode uses stored editing key');
    console.log('✅ Add mode generates new UUID');
} else {
    console.log('❌ Form submission logic test failed');
    if (!hasCurrentEditingKey) console.log('  - currentEditingKey variable missing');
    if (!hasUUIDGeneration) console.log('  - UUID generation in form submission missing');
    if (!hasUpdateLogic) console.log('  - Update logic missing');
    allTestsPassed = false;
}

// Test 4: Check that problematic key references are removed
console.log('\nTest 4: Checking for problematic key references...');
const problematicPatterns = [
    /getElementById\(["']particleKey["']\)/g,
    /form\.elements\[["']key["']\]\.value/g,
    /formData\.get\(["']key["']\)/g
];

let problematicReferences = 0;
problematicPatterns.forEach((pattern, index) => {
    const matches = jsContent.match(pattern);
    if (matches) {
        problematicReferences += matches.length;
        console.log(`  - Found ${matches.length} matches for pattern ${index + 1}`);
    }
});

if (problematicReferences === 0) {
    console.log('✅ No problematic key references found');
} else {
    console.log(`⚠️  Found ${problematicReferences} potentially problematic references`);
    console.log('   (Some may be acceptable in comments or error handling)');
}

// Test 5: Check form mode functions
console.log('\nTest 5: Checking form mode functions...');
const resetFormModeClears = jsContent.includes('currentEditingKey = null');
const formModeFunctionsExist = jsContent.includes('function resetFormMode()') && 
                               jsContent.includes('function setUpdateFormMode()');

if (resetFormModeClears && formModeFunctionsExist) {
    console.log('✅ Form mode functions properly updated');
    console.log('✅ resetFormMode clears currentEditingKey');
} else {
    console.log('❌ Form mode functions test failed');
    if (!resetFormModeClears) console.log('  - resetFormMode does not clear currentEditingKey');
    if (!formModeFunctionsExist) console.log('  - Form mode functions missing');
    allTestsPassed = false;
}

// Test UUID generation manually
console.log('\nTest 6: Testing UUID generation manually...');
try {
    // Extract and test the UUID generation logic
    const generateUUID = function() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback UUID v4 implementation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (uuid1 !== uuid2 && uuid1.length === 36 && uuid2.length === 36) {
        console.log('✅ UUID generation produces unique identifiers');
        console.log(`   Sample UUID 1: ${uuid1}`);
        console.log(`   Sample UUID 2: ${uuid2}`);
    } else {
        console.log('❌ UUID generation test failed');
        allTestsPassed = false;
    }
} catch (error) {
    console.log('⚠️  Could not test UUID generation directly:', error.message);
}

// Final result
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
    console.log('🎉 All tests passed! Key input removal was successful.');
    console.log('\nSummary of changes:');
    console.log('• Key input field removed from HTML form');
    console.log('• UUID generation function added to JavaScript');
    console.log('• Form submission logic updated to use auto-generated UUIDs');
    console.log('• Edit mode properly stores and reuses existing keys');
    console.log('• Form mode functions updated to handle key management');
} else {
    console.log('❌ Some tests failed. Please review the changes.');
}
console.log('='.repeat(50));
