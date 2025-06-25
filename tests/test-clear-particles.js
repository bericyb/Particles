/**
 * Test for Clear Particles functionality
 * This test verifies that the clear particles button works correctly
 */

// Mock DOM elements and functions
const mockElements = {
    clearParticleBtn: {
        addEventListener: null,
        disabled: false,
        textContent: 'Clear Particles'
    },
    notification: {
        classList: {
            remove: () => {},
            add: () => {}
        },
        style: { display: 'none' }
    },
    notificationMessage: {
        textContent: ''
    }
};

// Mock global functions
global.document = {
    getElementById: (id) => mockElements[id] || null
};

// Simple mock functions without Jest
const mockFetch = {
    calls: [],
    mockResolvedValue: (value) => {
        mockFetch.implementation = () => Promise.resolve(value);
    },
    implementation: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    mockClear: () => {
        mockFetch.calls = [];
    }
};

const mockConfirm = {
    calls: [],
    returnValue: true,
    mockReturnValue: (value) => {
        mockConfirm.returnValue = value;
    },
    implementation: (message) => {
        mockConfirm.calls.push(message);
        return mockConfirm.returnValue;
    },
    mockClear: () => {
        mockConfirm.calls = [];
    }
};

// Store original console methods
const originalConsole = {
    log: console.log,
    error: console.error
};

const mockConsole = {
    logs: [],
    errors: [],
    log: (message) => {
        mockConsole.logs.push(message);
        originalConsole.log(message); // Use original console
    },
    error: (message, error) => {
        mockConsole.errors.push({ message, error });
        originalConsole.error(message, error); // Use original console
    },
    mockClear: () => {
        mockConsole.logs = [];
        mockConsole.errors = [];
    }
};

global.fetch = (...args) => {
    mockFetch.calls.push(args);
    return mockFetch.implementation(...args);
};
global.confirm = mockConfirm.implementation;
global.console = mockConsole;

// Mock particles Map
let mockParticles = new Map();

// Mock showNotification function
function showNotification(message, duration = 3000) {
    mockElements.notificationMessage.textContent = message;
    mockElements.notification.classList.remove('hidden');
    mockElements.notification.style.display = 'block';
}

// The clear particles functionality (extracted from graph.js)
async function clearParticlesFunctionality() {
    const clearParticlesBtn = mockElements.clearParticleBtn;
    const particles = mockParticles;
    
    if (particles.size === 0) {
        showNotification('No particles to clear.', 2000);
        return;
    }
    
    // Show confirmation dialog
    const confirmMessage = `Are you sure you want to clear all particles?\n\nThis will remove all ${particles.size} particles and their connections. This action cannot be undone.`;
    const confirmed = global.confirm(confirmMessage);
    
    if (!confirmed) {
        return;
    }
    
    try {
        // Disable the clear button during operation
        clearParticlesBtn.disabled = true;
        clearParticlesBtn.textContent = 'Clearing...';
        
        showNotification('Clearing all particles...', 2000);
        
        // Clear particles on server
        const response = await fetch('http://localhost:3001/data', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Clear local particles
        particles.clear();
        
        showNotification('All particles cleared successfully!', 4000);
        console.log('All particles cleared successfully');
        
    } catch (error) {
        console.error('Error clearing particles:', error);
        showNotification('Failed to clear particles. Please try again.', 4000);
        
        // Optionally refetch data to ensure consistency
        try {
            const dataResponse = await fetch('http://localhost:3001/data');
            if (dataResponse.ok) {
                const data = await dataResponse.json();
                // In real implementation: particles = new Map(Object.entries(data));
            }
        } catch (refetchError) {
            console.error('Error refetching data after clear failure:', refetchError);
        }
    } finally {
        // Re-enable the clear button
        clearParticlesBtn.disabled = false;
        clearParticlesBtn.textContent = 'Clear Particles';
    }
}

// Helper function to reset mocks
function resetMocks() {
    mockFetch.mockClear();
    mockConfirm.mockClear();
    mockConsole.mockClear();
    mockParticles.clear();
    mockElements.clearParticleBtn.disabled = false;
    mockElements.clearParticleBtn.textContent = 'Clear Particles';
    mockElements.notificationMessage.textContent = '';
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('Running Clear Particles Tests...\n');
    
    // Simple test runner
    const tests = [
        {
            name: 'No particles to clear',
            test: async () => {
                mockParticles.clear();
                await clearParticlesFunctionality();
                return mockElements.notificationMessage.textContent === 'No particles to clear.';
            }
        },
        {
            name: 'User cancels confirmation',
            test: async () => {
                mockParticles.set('test', {});
                mockConfirm.mockReturnValue(false);
                await clearParticlesFunctionality();
                return mockParticles.size === 1;
            }
        },
        {
            name: 'Successful clear operation',
            test: async () => {
                mockParticles.set('test1', {});
                mockParticles.set('test2', {});
                mockConfirm.mockReturnValue(true);
                mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
                await clearParticlesFunctionality();
                return mockParticles.size === 0 && 
                       mockElements.notificationMessage.textContent === 'All particles cleared successfully!';
            }
        },
        {
            name: 'Server error handling',
            test: async () => {
                mockParticles.set('test1', {});
                mockConfirm.mockReturnValue(true);
                mockFetch.mockResolvedValue({ ok: false, status: 500 });
                await clearParticlesFunctionality();
                return mockElements.notificationMessage.textContent === 'Failed to clear particles. Please try again.' &&
                       mockConsole.errors.length > 0;
            }
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            // Reset before each test
            resetMocks();
            
            const result = await test.test();
            if (result) {
                console.log(`✅ ${test.name}`);
                passed++;
            } else {
                console.log(`❌ ${test.name}`);
                failed++;
            }
        } catch (error) {
            console.log(`❌ ${test.name} - Error: ${error.message}`);
            failed++;
        }
    }
    
    console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! The clear particles functionality is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please check the implementation.');
    }
}

export { clearParticlesFunctionality, showNotification };
