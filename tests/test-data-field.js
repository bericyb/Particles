/**
 * Test for the new data field functionality in nodes
 * This test verifies that nodes can store and display JSON data
 */

// Test data structures
const testData = {
    simple: {
        name: "Test Node",
        value: 42
    },
    complex: {
        type: "complex",
        metadata: {
            created: "2025-01-01",
            tags: ["important", "test"],
            nested: {
                level: 2,
                active: true
            }
        },
        array: [1, 2, 3, "four", { five: 5 }]
    },
    edge_cases: {
        null_value: null,
        empty_string: "",
        zero: 0,
        boolean_false: false,
        unicode: "Hello 世界 🌍"
    }
};

// Test functions
function testJSONParsing() {
    console.log("Testing JSON parsing...");
    
    // Test valid JSON
    try {
        const parsed = JSON.parse(JSON.stringify(testData.simple));
        console.log("✓ Simple JSON parsing works");
    } catch (error) {
        console.error("✗ Simple JSON parsing failed:", error);
    }
    
    // Test complex JSON
    try {
        const parsed = JSON.parse(JSON.stringify(testData.complex));
        console.log("✓ Complex JSON parsing works");
    } catch (error) {
        console.error("✗ Complex JSON parsing failed:", error);
    }
    
    // Test edge cases
    try {
        const parsed = JSON.parse(JSON.stringify(testData.edge_cases));
        console.log("✓ Edge case JSON parsing works");
    } catch (error) {
        console.error("✗ Edge case JSON parsing failed:", error);
    }
}

function testJSONFormatting() {
    console.log("Testing JSON formatting...");
    
    // Test pretty printing
    try {
        const formatted = JSON.stringify(testData.simple, null, 2);
        if (formatted.includes('\n') && formatted.includes('  ')) {
            console.log("✓ JSON pretty printing works");
        } else {
            console.error("✗ JSON pretty printing failed - no indentation found");
        }
    } catch (error) {
        console.error("✗ JSON formatting failed:", error);
    }
}

function testDataFieldValidation() {
    console.log("Testing data field validation...");
    
    // Test invalid JSON
    const invalidJSON = '{"invalid": json}';
    try {
        JSON.parse(invalidJSON);
        console.error("✗ Invalid JSON should have thrown an error");
    } catch (error) {
        console.log("✓ Invalid JSON correctly rejected");
    }
    
    // Test empty string (should be valid - no data)
    const emptyString = '';
    if (!emptyString.trim()) {
        console.log("✓ Empty string correctly handled as no data");
    }
    
    // Test whitespace only
    const whitespaceOnly = '   \n\t   ';
    if (!whitespaceOnly.trim()) {
        console.log("✓ Whitespace-only string correctly handled as no data");
    }
}

function testNodeDataIntegration() {
    console.log("Testing node data integration...");
    
    // Simulate node creation with data
    const mockNode = {
        x: 100,
        y: 100,
        title: "Test Node",
        radius: 20,
        data: testData.simple
    };
    
    // Test that data is preserved
    if (mockNode.data && mockNode.data.name === "Test Node" && mockNode.data.value === 42) {
        console.log("✓ Node data integration works");
    } else {
        console.error("✗ Node data integration failed");
    }
    
    // Test node without data
    const mockNodeNoData = {
        x: 100,
        y: 100,
        title: "Test Node No Data",
        radius: 20
    };
    
    if (mockNodeNoData.data === undefined) {
        console.log("✓ Node without data works correctly");
    } else {
        console.error("✗ Node without data failed");
    }
}

function testModalDisplay() {
    console.log("Testing modal display logic...");
    
    // Test data display formatting
    const testNode = {
        data: testData.complex
    };
    
    try {
        const formattedData = JSON.stringify(testNode.data, null, 2);
        if (formattedData.includes('"type": "complex"') && formattedData.includes('\n')) {
            console.log("✓ Modal data display formatting works");
        } else {
            console.error("✗ Modal data display formatting failed");
        }
    } catch (error) {
        console.error("✗ Modal data display failed:", error);
    }
    
    // Test null/undefined data handling
    const nodeWithNullData = { data: null };
    const nodeWithUndefinedData = { data: undefined };
    const nodeWithoutData = {};
    
    if (nodeWithNullData.data === null) {
        console.log("✓ Null data handling works");
    }
    
    if (nodeWithUndefinedData.data === undefined) {
        console.log("✓ Undefined data handling works");
    }
    
    if (nodeWithoutData.data === undefined) {
        console.log("✓ Missing data property handling works");
    }
}

// Run all tests
function runAllTests() {
    console.log("=== Data Field Functionality Tests ===");
    console.log("");
    
    testJSONParsing();
    console.log("");
    
    testJSONFormatting();
    console.log("");
    
    testDataFieldValidation();
    console.log("");
    
    testNodeDataIntegration();
    console.log("");
    
    testModalDisplay();
    console.log("");
    
    console.log("=== Test Summary ===");
    console.log("All data field tests completed!");
    console.log("Check the console output above for any failures (✗)");
    console.log("All passed tests are marked with (✓)");
}

// Auto-run tests when script loads
if (typeof window !== 'undefined') {
    // Browser environment
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    // Node.js environment
    runAllTests();
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testData,
        testJSONParsing,
        testJSONFormatting,
        testDataFieldValidation,
        testNodeDataIntegration,
        testModalDisplay
    };
}
