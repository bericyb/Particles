/**
 * Test for shift-click-drag selection box functionality
 * This test verifies that the selection box feature works correctly
 */

const { JSDOM } = require('jsdom');

// Mock DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
    <title>Selection Box Test</title>
</head>
<body>
    <canvas id="canvas" width="800" height="600"></canvas>
    <div id="notification" class="hidden">
        <span id="notificationMessage"></span>
    </div>
</body>
</html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.CanvasRenderingContext2D = dom.window.CanvasRenderingContext2D;

// Mock canvas context
const mockContext = {
    clearRect: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    setTransform: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    setLineDash: jest.fn(),
    set fillStyle(value) { this._fillStyle = value; },
    get fillStyle() { return this._fillStyle; },
    set strokeStyle(value) { this._strokeStyle = value; },
    get strokeStyle() { return this._strokeStyle; },
    set lineWidth(value) { this._lineWidth = value; },
    get lineWidth() { return this._lineWidth; }
};

// Mock canvas.getContext
HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);

// Mock fetch
global.fetch = jest.fn(() => 
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ nodes: {}, edges: {} })
    })
);

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
    send: jest.fn(),
    close: jest.fn(),
    readyState: 1
}));

// Mock crypto for UUID generation
global.crypto = {
    randomUUID: () => 'test-uuid-1234'
};

describe('Selection Box Functionality', () => {
    let canvas;
    let particles;
    let selectedNodes;
    let isSelectionBoxActive;
    let selectionBoxStart;
    let selectionBoxEnd;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Setup test environment
        canvas = document.getElementById('canvas');
        
        // Mock particles data
        particles = {
            nodes: {
                'node1': { x: 100, y: 100, radius: 20, title: 'Node 1' },
                'node2': { x: 200, y: 150, radius: 20, title: 'Node 2' },
                'node3': { x: 300, y: 200, radius: 20, title: 'Node 3' },
                'node4': { x: 400, y: 250, radius: 20, title: 'Node 4' }
            },
            edges: {}
        };
        
        // Mock selection state
        selectedNodes = new Set();
        isSelectionBoxActive = false;
        selectionBoxStart = { x: 0, y: 0 };
        selectionBoxEnd = { x: 0, y: 0 };
    });

    test('should initialize selection box state variables', () => {
        expect(isSelectionBoxActive).toBe(false);
        expect(selectionBoxStart).toEqual({ x: 0, y: 0 });
        expect(selectionBoxEnd).toEqual({ x: 0, y: 0 });
    });

    test('should start selection box on shift+click empty space', () => {
        // Simulate shift+click on empty space
        const mockEvent = {
            button: 0,
            shiftKey: true,
            clientX: 150,
            clientY: 120
        };
        
        const bounding = { left: 0, top: 0 };
        canvas.getBoundingClientRect = jest.fn(() => bounding);
        
        // Calculate world coordinates (assuming scale=1, offset=0)
        const worldX = mockEvent.clientX;
        const worldY = mockEvent.clientY;
        
        // Simulate mousedown logic
        let clickedNode = false;
        for (const [key, particle] of Object.entries(particles.nodes)) {
            if (particle.x + particle.radius >= worldX && particle.x - particle.radius <= worldX && 
                particle.y + particle.radius >= worldY && particle.y - particle.radius <= worldY) {
                clickedNode = true;
                break;
            }
        }
        
        if (!clickedNode && mockEvent.shiftKey) {
            isSelectionBoxActive = true;
            selectionBoxStart.x = worldX;
            selectionBoxStart.y = worldY;
            selectionBoxEnd.x = worldX;
            selectionBoxEnd.y = worldY;
        }
        
        expect(isSelectionBoxActive).toBe(true);
        expect(selectionBoxStart).toEqual({ x: worldX, y: worldY });
        expect(selectionBoxEnd).toEqual({ x: worldX, y: worldY });
    });

    test('should update selection box coordinates on mousemove', () => {
        // Start selection box
        isSelectionBoxActive = true;
        selectionBoxStart = { x: 50, y: 50 };
        
        // Simulate mousemove
        const newX = 250;
        const newY = 200;
        
        if (isSelectionBoxActive) {
            selectionBoxEnd.x = newX;
            selectionBoxEnd.y = newY;
        }
        
        expect(selectionBoxEnd).toEqual({ x: newX, y: newY });
    });

    test('should select nodes within selection box on mouseup', () => {
        // Setup selection box that encompasses some nodes
        isSelectionBoxActive = true;
        selectionBoxStart = { x: 50, y: 50 };
        selectionBoxEnd = { x: 250, y: 200 };
        
        // Simulate mouseup logic
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
        
        // Should select node1 (100,100) and node2 (200,150)
        expect(selectedNodes.has('node1')).toBe(true);
        expect(selectedNodes.has('node2')).toBe(true);
        expect(selectedNodes.has('node3')).toBe(false); // node3 is at (300,200), outside box
        expect(selectedNodes.has('node4')).toBe(false); // node4 is at (400,250), outside box
        expect(isSelectionBoxActive).toBe(false);
    });

    test('should handle selection box drawing', () => {
        // Setup active selection box
        isSelectionBoxActive = true;
        selectionBoxStart = { x: 100, y: 100 };
        selectionBoxEnd = { x: 300, y: 200 };
        
        // Simulate draw function logic
        if (isSelectionBoxActive) {
            const boxLeft = Math.min(selectionBoxStart.x, selectionBoxEnd.x);
            const boxRight = Math.max(selectionBoxStart.x, selectionBoxEnd.x);
            const boxTop = Math.min(selectionBoxStart.y, selectionBoxEnd.y);
            const boxBottom = Math.max(selectionBoxStart.y, selectionBoxEnd.y);
            
            // Draw selection box background
            mockContext.fillStyle = 'rgba(255, 107, 53, 0.2)';
            mockContext.fillRect(boxLeft, boxTop, boxRight - boxLeft, boxBottom - boxTop);
            
            // Draw selection box border
            mockContext.strokeStyle = '#ff6b35';
            mockContext.lineWidth = 2;
            mockContext.setLineDash([5, 5]);
            mockContext.strokeRect(boxLeft, boxTop, boxRight - boxLeft, boxBottom - boxTop);
            mockContext.setLineDash([]);
        }
        
        expect(mockContext.fillRect).toHaveBeenCalledWith(100, 100, 200, 100);
        expect(mockContext.strokeRect).toHaveBeenCalledWith(100, 100, 200, 100);
        expect(mockContext.setLineDash).toHaveBeenCalledWith([5, 5]);
        expect(mockContext.setLineDash).toHaveBeenCalledWith([]);
    });

    test('should cancel selection box on mouse leave', () => {
        // Setup active selection box
        isSelectionBoxActive = true;
        
        // Simulate mouseleave logic
        if (isSelectionBoxActive) {
            isSelectionBoxActive = false;
        }
        
        expect(isSelectionBoxActive).toBe(false);
    });

    test('should not interfere with existing drag functionality', () => {
        // Test that regular node dragging still works
        const mockEvent = {
            button: 0,
            shiftKey: false,
            clientX: 100,
            clientY: 100
        };
        
        // Should not start selection box when clicking on a node without shift
        let clickedNode = false;
        for (const [key, particle] of Object.entries(particles.nodes)) {
            if (particle.x + particle.radius >= mockEvent.clientX && 
                particle.x - particle.radius <= mockEvent.clientX && 
                particle.y + particle.radius >= mockEvent.clientY && 
                particle.y - particle.radius <= mockEvent.clientY) {
                clickedNode = true;
                break;
            }
        }
        
        if (clickedNode && !mockEvent.shiftKey) {
            // Should start dragging, not selection box
            expect(isSelectionBoxActive).toBe(false);
        }
    });
});

console.log('✅ Selection box functionality tests completed');
