/**
 * Test for Shuffle Performance Optimization
 * This test verifies that the shuffle functionality is fast enough for button spamming
 */

import { ParticleShuffler } from '../src/public/shuffle-particles.js';

// Mock browser APIs for Node.js environment
global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 16); // ~60fps
};

global.performance = {
    now: () => Date.now()
};

// Mock canvas
const mockCanvas = {
    width: 1200,
    height: 800
};

// Create test particles with various connection counts
function createTestParticles(count = 20) {
    const particles = new Map();
    
    for (let i = 0; i < count; i++) {
        const key = `particle-${i}`;
        const connectionCount = Math.floor(Math.random() * 5); // 0-4 connections
        const edges = [];
        
        // Create some random connections
        for (let j = 0; j < connectionCount; j++) {
            const targetIndex = Math.floor(Math.random() * count);
            if (targetIndex !== i) {
                edges.push({
                    key: `particle-${targetIndex}`,
                    label: `edge-${j}`
                });
            }
        }
        
        particles.set(key, {
            x: Math.random() * mockCanvas.width,
            y: Math.random() * mockCanvas.height,
            radius: 20,
            title: `Test Particle ${i}`,
            edges: edges
        });
    }
    
    return particles;
}

// Test shuffle performance
async function testShufflePerformance() {
    console.log('Testing shuffle performance...\n');
    
    const shuffler = new ParticleShuffler(mockCanvas);
    const particles = createTestParticles(20);
    
    console.log(`Created ${particles.size} test particles`);
    
    // Test single shuffle performance
    console.log('\n--- Single Shuffle Performance ---');
    const startTime = performance.now();
    
    await shuffler.startShuffling(
        particles,
        () => {}, // No update callback needed for test
        async () => {} // No server update needed for test
    );
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    console.log(`✅ Single shuffle completed in ${duration}ms`);
    
    // Verify performance target
    const targetTime = 1000; // Should complete within 1 second
    if (duration <= targetTime) {
        console.log(`✅ Performance target met (${duration}ms <= ${targetTime}ms)`);
    } else {
        console.log(`❌ Performance target missed (${duration}ms > ${targetTime}ms)`);
        return false;
    }
    
    // Test rapid shuffling (button spamming)
    console.log('\n--- Rapid Shuffle Test (Button Spamming) ---');
    const rapidShuffleCount = 5;
    const rapidStartTime = performance.now();
    
    for (let i = 0; i < rapidShuffleCount; i++) {
        console.log(`Starting rapid shuffle ${i + 1}/${rapidShuffleCount}...`);
        
        // Stop previous shuffle if running (simulates button spamming)
        if (shuffler.isShuffling()) {
            shuffler.stopShuffling();
            await new Promise(resolve => setTimeout(resolve, 50)); // Brief cleanup delay
        }
        
        await shuffler.startShuffling(
            particles,
            () => {},
            async () => {}
        );
    }
    
    const rapidEndTime = performance.now();
    const rapidDuration = Math.round(rapidEndTime - rapidStartTime);
    const avgPerShuffle = Math.round(rapidDuration / rapidShuffleCount);
    
    console.log(`✅ ${rapidShuffleCount} rapid shuffles completed in ${rapidDuration}ms`);
    console.log(`✅ Average time per shuffle: ${avgPerShuffle}ms`);
    
    // Verify rapid shuffle performance
    const rapidTargetTime = 1200; // Average should be under 1.2 seconds per shuffle
    if (avgPerShuffle <= rapidTargetTime) {
        console.log(`✅ Rapid shuffle performance target met (${avgPerShuffle}ms <= ${rapidTargetTime}ms)`);
    } else {
        console.log(`❌ Rapid shuffle performance target missed (${avgPerShuffle}ms > ${rapidTargetTime}ms)`);
        return false;
    }
    
    return true;
}

// Test animation speed configuration
function testAnimationSpeedConfig() {
    console.log('\n--- Animation Speed Configuration Test ---');
    
    const shuffler = new ParticleShuffler(mockCanvas);
    
    // Verify animation speed is optimized
    const expectedMinSpeed = 0.1; // Should be at least 0.1 (much faster than original 0.02)
    
    if (shuffler.animationSpeed >= expectedMinSpeed) {
        console.log(`✅ Animation speed optimized: ${shuffler.animationSpeed} (>= ${expectedMinSpeed})`);
        return true;
    } else {
        console.log(`❌ Animation speed not optimized: ${shuffler.animationSpeed} (< ${expectedMinSpeed})`);
        return false;
    }
}

// Test interruption capability
async function testInterruptionCapability() {
    console.log('\n--- Interruption Capability Test ---');
    
    const shuffler = new ParticleShuffler(mockCanvas);
    const particles = createTestParticles(10);
    
    // Start a shuffle
    const shufflePromise = shuffler.startShuffling(
        particles,
        () => {},
        async () => {}
    );
    
    // Wait a bit then interrupt
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Interrupting shuffle...');
    shuffler.stopShuffling();
    
    // Wait for the promise to resolve
    await shufflePromise;
    
    // Verify the shuffler is no longer animating
    if (!shuffler.isShuffling()) {
        console.log('✅ Shuffle successfully interrupted');
        return true;
    } else {
        console.log('❌ Shuffle interruption failed');
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Running Shuffle Performance Tests...\n');
    
    const tests = [
        { name: 'Animation Speed Configuration', test: testAnimationSpeedConfig },
        { name: 'Interruption Capability', test: testInterruptionCapability },
        { name: 'Shuffle Performance', test: testShufflePerformance }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const { name, test } of tests) {
        try {
            console.log(`\n🧪 Running: ${name}`);
            console.log('='.repeat(50));
            
            const result = await test();
            
            if (result) {
                console.log(`\n✅ ${name} - PASSED`);
                passed++;
            } else {
                console.log(`\n❌ ${name} - FAILED`);
                failed++;
            }
        } catch (error) {
            console.log(`\n❌ ${name} - ERROR: ${error.message}`);
            failed++;
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All shuffle performance tests passed!');
        console.log('✨ The shuffle button can now be spammed quickly!');
    } else {
        console.log('⚠️  Some tests failed. Performance optimization may need adjustment.');
    }
    
    return failed === 0;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

export { runAllTests, testShufflePerformance, testAnimationSpeedConfig, testInterruptionCapability };
