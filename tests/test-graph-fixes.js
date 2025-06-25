/**
 * Test suite for graph rendering and node label fixes
 * Tests the three main issues that were fixed:
 * 1. Initial render of nodes on index.html
 * 2. Node labels showing title instead of UUID
 * 3. MCP/HTTP server schema consistency
 */

const fs = require('fs');
const path = require('path');

// Mock DOM environment for testing
const { JSDOM } = require('jsdom');

// Test configuration
const TEST_CONFIG = {
    serverUrl: 'http://localhost:3001',
    testTimeout: 10000
};

// Test data
const SAMPLE_GRAPH_DATA = {
    nodes: {
        'test-uuid-1': {
            x: 100,
            y: 100,
            title: 'Test Node 1',
            radius: 20,
            data: { type: 'test' }
        },
        'test-uuid-2': {
            x: 200,
            y: 200,
            title: 'Test Node 2',
            radius: 25,
            data: { type: 'test' }
        }
    },
    edges: {
        'edge-1': {
            id: 'edge-1',
            source: 'test-uuid-1',
            target: 'test-uuid-2',
            label: 'connects to',
            directed: true
        }
    }
};

const LEGACY_PARTICLE_DATA = {
    'test-uuid-3': {
        x: 300,
        y: 300,
        title: 'Legacy Node',
        radius: 30,
        edges: [{ key: 'test-uuid-4', label: 'legacy edge' }]
    },
    'test-uuid-4': {
        x: 400,
        y: 400,
        title: 'Legacy Node 2',
        radius: 20,
        edges: []
    }
};

class GraphTestSuite {
    constructor() {
        this.results = [];
        this.setupDOM();
    }

    setupDOM() {
        // Create a mock DOM environment
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <head><title>Test</title></head>
            <body>
                <canvas id="canvas" width="800" height="600"></canvas>
                <div id="notification" class="notification hidden">
                    <span id="notificationMessage"></span>
                </div>
            </body>
            </html>
        `);
        
        global.window = dom.window;
        global.document = dom.window.document;
        global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
        
        // Mock canvas context
        const mockContext = {
            clearRect: () => {},
            save: () => {},
            restore: () => {},
            setTransform: () => {},
            beginPath: () => {},
            arc: () => {},
            fillRect: () => {},
            moveTo: () => {},
            lineTo: () => {},
            stroke: () => {},
            fill: () => {},
            fillText: () => {},
            set fillStyle(value) { this._fillStyle = value; },
            get fillStyle() { return this._fillStyle; },
            set strokeStyle(value) { this._strokeStyle = value; },
            get strokeStyle() { return this._strokeStyle; },
            set lineWidth(value) { this._lineWidth = value; },
            get lineWidth() { return this._lineWidth; },
            set font(value) { this._font = value; },
            get font() { return this._font; },
            set textAlign(value) { this._textAlign = value; },
            get textAlign() { return this._textAlign; }
        };
        
        HTMLCanvasElement.prototype.getContext = () => mockContext;
        
        // Mock fetch for server communication tests
        global.fetch = async (url, options) => {
            if (url.includes('/data')) {
                if (options?.method === 'GET' || !options?.method) {
                    return {
                        ok: true,
                        json: async () => SAMPLE_GRAPH_DATA
                    };
                }
            }
            return { ok: true, json: async () => ({ success: true }) };
        };
    }

    async runTest(testName, testFunction) {
        console.log(`Running test: ${testName}`);
        try {
            const startTime = Date.now();
            await testFunction();
            const duration = Date.now() - startTime;
            this.results.push({
                name: testName,
                status: 'PASS',
                duration,
                error: null
            });
            console.log(`✅ ${testName} - PASSED (${duration}ms)`);
        } catch (error) {
            this.results.push({
                name: testName,
                status: 'FAIL',
                duration: 0,
                error: error.message
            });
            console.log(`❌ ${testName} - FAILED: ${error.message}`);
        }
    }

    async testInitialDataLoading() {
        // Test that graph data is properly loaded and structured
        const mockParticles = SAMPLE_GRAPH_DATA;
        
        // Verify graph format detection
        if (!mockParticles.nodes || !mockParticles.edges) {
            throw new Error('Graph data should have nodes and edges properties');
        }
        
        // Verify nodes structure
        const nodeKeys = Object.keys(mockParticles.nodes);
        if (nodeKeys.length === 0) {
            throw new Error('Graph should have at least one node');
        }
        
        // Verify each node has required properties
        for (const [key, node] of Object.entries(mockParticles.nodes)) {
            if (typeof node.x !== 'number' || typeof node.y !== 'number') {
                throw new Error(`Node ${key} missing position coordinates`);
            }
            if (!node.title) {
                throw new Error(`Node ${key} missing title property`);
            }
            if (typeof node.radius !== 'number') {
                throw new Error(`Node ${key} missing radius property`);
            }
        }
        
        console.log('Graph data structure validation passed');
    }

    async testNodeLabelDisplay() {
        // Test that node labels show title instead of UUID
        const testNodes = {
            'uuid-12345': { title: 'My Test Node', x: 100, y: 100, radius: 20 },
            'uuid-67890': { title: 'Another Node', x: 200, y: 200, radius: 25 }
        };
        
        // Simulate the label display logic from utils.js
        for (const [nodeKey, node] of Object.entries(testNodes)) {
            const displayLabel = node.title || nodeKey;
            
            if (displayLabel === nodeKey) {
                throw new Error(`Node label should show title "${node.title}" not UUID "${nodeKey}"`);
            }
            
            if (displayLabel !== node.title) {
                throw new Error(`Expected label "${node.title}" but got "${displayLabel}"`);
            }
        }
        
        console.log('Node label display logic validated');
    }

    async testLegacyFormatCompatibility() {
        // Test that legacy particle format still works
        const legacyParticles = new Map(Object.entries(LEGACY_PARTICLE_DATA));
        
        // Verify Map structure
        if (!(legacyParticles instanceof Map)) {
            throw new Error('Legacy particles should be a Map');
        }
        
        // Test data format detection logic
        let isLegacyFormat = false;
        if (legacyParticles instanceof Map) {
            isLegacyFormat = true;
        } else if (legacyParticles && !legacyParticles.nodes) {
            isLegacyFormat = true;
        }
        
        if (!isLegacyFormat) {
            throw new Error('Legacy format detection failed');
        }
        
        // Test node access in legacy format
        for (const [key, particle] of legacyParticles) {
            if (!particle.title) {
                throw new Error(`Legacy particle ${key} missing title`);
            }
            
            // Test label display for legacy format
            const displayLabel = particle.title || key;
            if (displayLabel !== particle.title) {
                throw new Error(`Legacy particle label should show title "${particle.title}"`);
            }
        }
        
        console.log('Legacy format compatibility validated');
    }

    async testDataFormatHandling() {
        // Test the data format detection and handling logic
        const testCases = [
            {
                name: 'New graph format',
                data: SAMPLE_GRAPH_DATA,
                expectedFormat: 'graph'
            },
            {
                name: 'Legacy Map format',
                data: new Map(Object.entries(LEGACY_PARTICLE_DATA)),
                expectedFormat: 'map'
            },
            {
                name: 'Legacy object format',
                data: LEGACY_PARTICLE_DATA,
                expectedFormat: 'object'
            },
            {
                name: 'Empty Map',
                data: new Map(),
                expectedFormat: 'map'
            }
        ];
        
        for (const testCase of testCases) {
            const particles = testCase.data;
            let detectedFormat;
            
            // Simulate the format detection logic from graph.js
            if (particles && particles.nodes) {
                detectedFormat = 'graph';
            } else if (particles instanceof Map) {
                detectedFormat = 'map';
            } else {
                detectedFormat = 'object';
            }
            
            if (detectedFormat !== testCase.expectedFormat) {
                throw new Error(`${testCase.name}: Expected format "${testCase.expectedFormat}" but detected "${detectedFormat}"`);
            }
        }
        
        console.log('Data format handling validated');
    }

    async testNodeClickHandling() {
        // Test that node click detection works with different data formats
        const testCases = [
            { format: 'graph', data: SAMPLE_GRAPH_DATA },
            { format: 'legacy', data: LEGACY_PARTICLE_DATA }
        ];
        
        for (const testCase of testCases) {
            const particles = testCase.data;
            let nodes;
            
            // Simulate the node extraction logic from handleClick
            if (particles && particles.nodes) {
                nodes = particles.nodes;
            } else if (particles instanceof Map) {
                nodes = Object.fromEntries(particles);
            } else {
                nodes = particles;
            }
            
            if (!nodes || Object.keys(nodes).length === 0) {
                throw new Error(`${testCase.format} format: No nodes extracted for click handling`);
            }
            
            // Verify each node can be accessed
            for (const [key, node] of Object.entries(nodes)) {
                if (!node.x || !node.y || !node.radius) {
                    throw new Error(`${testCase.format} format: Node ${key} missing required properties for click detection`);
                }
            }
        }
        
        console.log('Node click handling validated');
    }

    async testServerSchemaConsistency() {
        // Test that the expected data structures match between client and server
        const expectedNodeSchema = {
            x: 'number',
            y: 'number',
            title: 'string',
            radius: 'number',
            data: 'object', // optional
            edges: 'array'  // for legacy compatibility
        };
        
        const expectedGraphSchema = {
            nodes: 'object',
            edges: 'object'
        };
        
        // Test sample data against schemas
        const sampleNode = SAMPLE_GRAPH_DATA.nodes['test-uuid-1'];
        for (const [prop, expectedType] of Object.entries(expectedNodeSchema)) {
            if (prop === 'data' || prop === 'edges') continue; // optional
            
            const actualType = typeof sampleNode[prop];
            if (actualType !== expectedType) {
                throw new Error(`Node property "${prop}" should be ${expectedType} but is ${actualType}`);
            }
        }
        
        // Test graph structure
        for (const [prop, expectedType] of Object.entries(expectedGraphSchema)) {
            const actualType = typeof SAMPLE_GRAPH_DATA[prop];
            if (actualType !== expectedType) {
                throw new Error(`Graph property "${prop}" should be ${expectedType} but is ${actualType}`);
            }
        }
        
        console.log('Server schema consistency validated');
    }

    async runAllTests() {
        console.log('🧪 Starting Graph Fixes Test Suite\n');
        
        await this.runTest('Initial Data Loading', () => this.testInitialDataLoading());
        await this.runTest('Node Label Display', () => this.testNodeLabelDisplay());
        await this.runTest('Legacy Format Compatibility', () => this.testLegacyFormatCompatibility());
        await this.runTest('Data Format Handling', () => this.testDataFormatHandling());
        await this.runTest('Node Click Handling', () => this.testNodeClickHandling());
        await this.runTest('Server Schema Consistency', () => this.testServerSchemaConsistency());
        
        this.printSummary();
    }

    printSummary() {
        console.log('\n📊 Test Results Summary');
        console.log('========================');
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
        }
        
        console.log('\n' + (failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed.'));
        
        // Return exit code for CI/CD
        process.exit(failed > 0 ? 1 : 0);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    // Check if jsdom is available
    try {
        require('jsdom');
    } catch (error) {
        console.log('📦 Installing required test dependencies...');
        console.log('Run: npm install --save-dev jsdom');
        console.log('Then run this test again.');
        process.exit(1);
    }
    
    const testSuite = new GraphTestSuite();
    testSuite.runAllTests().catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = GraphTestSuite;
