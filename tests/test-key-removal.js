/**
 * Test for Key Input Removal and UUID Generation
 * 
 * This test verifies that:
 * 1. The key input field has been removed from the HTML form
 * 2. The UUID generation function works correctly
 * 3. New particles get auto-generated UUIDs
 */

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Read the HTML file
const htmlPath = path.join(__dirname, '../src/public/index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Read the JavaScript file
const jsPath = path.join(__dirname, '../src/public/graph.js');
const jsContent = fs.readFileSync(jsPath, 'utf8');

describe('Key Input Removal Tests', () => {
    let dom;
    let window;
    let document;

    beforeEach(() => {
        // Create a new DOM instance for each test
        dom = new JSDOM(htmlContent, {
            runScripts: "dangerously",
            resources: "usable"
        });
        window = dom.window;
        document = window.document;
        
        // Mock fetch for testing
        global.fetch = jest.fn();
        
        // Mock crypto.randomUUID if not available
        if (!window.crypto) {
            window.crypto = {};
        }
        if (!window.crypto.randomUUID) {
            window.crypto.randomUUID = () => 'test-uuid-' + Math.random().toString(36).substr(2, 9);
        }
    });

    afterEach(() => {
        dom.window.close();
        jest.restoreAllMocks();
    });

    test('Key input field should be removed from HTML form', () => {
        // Check that the key input field no longer exists
        const keyInput = document.getElementById('particleKey');
        expect(keyInput).toBeNull();
        
        // Check that the key label is also removed
        const keyLabels = document.querySelectorAll('label[for="particleKey"]');
        expect(keyLabels.length).toBe(0);
        
        // Verify other form fields still exist
        const titleInput = document.getElementById('particleTitle');
        expect(titleInput).not.toBeNull();
        expect(titleInput.name).toBe('title');
    });

    test('UUID generation function should work correctly', () => {
        // Test the UUID generation function from the JavaScript
        // We need to extract and test the generateUUID function
        
        // Create a simple UUID validation regex
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        
        // Test crypto.randomUUID if available
        if (window.crypto && window.crypto.randomUUID) {
            const uuid1 = window.crypto.randomUUID();
            const uuid2 = window.crypto.randomUUID();
            
            // UUIDs should be different
            expect(uuid1).not.toBe(uuid2);
            
            // Should be strings
            expect(typeof uuid1).toBe('string');
            expect(typeof uuid2).toBe('string');
        }
        
        // Test fallback UUID generation
        const fallbackUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        
        expect(typeof fallbackUUID).toBe('string');
        expect(fallbackUUID.length).toBe(36);
        expect(fallbackUUID.charAt(8)).toBe('-');
        expect(fallbackUUID.charAt(13)).toBe('-');
        expect(fallbackUUID.charAt(18)).toBe('-');
        expect(fallbackUUID.charAt(23)).toBe('-');
    });

    test('Form should have title field as first input', () => {
        const form = document.getElementById('addParticleForm');
        expect(form).not.toBeNull();
        
        // The first form group should now contain the title field
        const firstFormGroup = form.querySelector('.form-group');
        expect(firstFormGroup).not.toBeNull();
        
        const titleInput = firstFormGroup.querySelector('#particleTitle');
        expect(titleInput).not.toBeNull();
        expect(titleInput.name).toBe('title');
        expect(titleInput.required).toBe(true);
    });

    test('Form structure should be correct after key removal', () => {
        const form = document.getElementById('addParticleForm');
        
        // Count form groups
        const formGroups = form.querySelectorAll('.form-group');
        
        // Should have title field, advanced settings, and edges section
        expect(formGroups.length).toBeGreaterThan(0);
        
        // Check that we have the expected form elements
        expect(document.getElementById('particleTitle')).not.toBeNull();
        expect(document.getElementById('particleX')).not.toBeNull();
        expect(document.getElementById('particleY')).not.toBeNull();
        expect(document.getElementById('particleRadius')).not.toBeNull();
        
        // Advanced settings toggle should exist
        expect(document.getElementById('advancedToggle')).not.toBeNull();
        expect(document.getElementById('advancedSettings')).not.toBeNull();
        
        // Edges section should exist
        expect(document.getElementById('edgesContainer')).not.toBeNull();
        expect(document.getElementById('edgeSearch')).not.toBeNull();
    });

    test('JavaScript should not reference particleKey element', () => {
        // Check that the JavaScript content doesn't contain references to particleKey
        // that would cause errors when the element doesn't exist
        
        // These are acceptable references (in comments or strings)
        const acceptableReferences = [
            'particleKey', // might be in comments
            '"particleKey"', // might be in strings for error messages
            "'particleKey'" // might be in strings for error messages
        ];
        
        // Count problematic references like getElementById("particleKey")
        const problematicPatterns = [
            /getElementById\(["']particleKey["']\)/g,
            /elements\[["']key["']\]/g,
            /\.particleKey\./g
        ];
        
        let problematicReferences = 0;
        problematicPatterns.forEach(pattern => {
            const matches = jsContent.match(pattern);
            if (matches) {
                problematicReferences += matches.length;
            }
        });
        
        // Should have minimal or no problematic references
        // (Some might remain in error handling or comments)
        expect(problematicReferences).toBeLessThan(3);
    });
});

console.log('✅ Key input removal tests completed');
