/**
 * Test WebSocket Integration
 * This test verifies that WebSocket notifications are sent when data changes
 */

const WebSocket = require('ws');

async function testWebSocketIntegration() {
    console.log('🧪 Testing WebSocket Integration...\n');

    let wsConnected = false;
    let messagesReceived = [];

    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:3001/ws');

    ws.on('open', () => {
        console.log('✅ WebSocket connected successfully');
        wsConnected = true;
    });

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log(
                '📨 Received WebSocket message:',
                message.type,
                message.operation || ''
            );
            messagesReceived.push(message);
        } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
        }
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
    });

    // Wait for connection
    await new Promise((resolve) => {
        const checkConnection = () => {
            if (wsConnected) {
                resolve();
            } else {
                setTimeout(checkConnection, 100);
            }
        };
        checkConnection();
    });

    console.log('⏳ Waiting 1 second for connection to stabilize...');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 1: Add a particle via HTTP API
    console.log('\n🧪 Test 1: Adding a particle via HTTP API...');

    const testParticle = {
        x: 100,
        y: 100,
        title: 'WebSocket Test Node',
        radius: 20,
        color: 'blue',
        data: {
            test: true,
            timestamp: Date.now(),
        },
    };

    try {
        const response = await fetch(
            'http://localhost:3001/particle/websocket-test-node',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testParticle),
            }
        );

        if (response.ok) {
            console.log('✅ Particle added successfully via HTTP');
        } else {
            console.error(
                '❌ Failed to add particle via HTTP:',
                response.status
            );
            return;
        }
    } catch (error) {
        console.error('❌ Error adding particle:', error);
        return;
    }

    // Wait for WebSocket message
    console.log('⏳ Waiting for WebSocket notification...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if we received the expected WebSocket message
    const addMessage = messagesReceived.find(
        (msg) =>
            msg.type === 'data_changed' &&
            msg.operation === 'add' &&
            msg.nodeKey === 'websocket-test-node'
    );

    if (addMessage) {
        console.log('✅ Received WebSocket notification for particle addition');
        console.log('   - Operation:', addMessage.operation);
        console.log('   - Node Key:', addMessage.nodeKey);
        console.log('   - Has Data:', !!addMessage.data);
    } else {
        console.error(
            '❌ Did not receive expected WebSocket notification for particle addition'
        );
        console.log(
            '   Messages received:',
            messagesReceived.map((m) => `${m.type}:${m.operation || 'none'}`)
        );
    }

    // Test 2: Update the particle
    console.log('\n🧪 Test 2: Updating the particle...');

    const updatedParticle = {
        ...testParticle,
        title: 'Updated WebSocket Test Node',
        x: 150,
        y: 150,
    };

    try {
        const response = await fetch(
            'http://localhost:3001/particle/websocket-test-node',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedParticle),
            }
        );

        if (response.ok) {
            console.log('✅ Particle updated successfully via HTTP');
        } else {
            console.error(
                '❌ Failed to update particle via HTTP:',
                response.status
            );
        }
    } catch (error) {
        console.error('❌ Error updating particle:', error);
    }

    // Wait for WebSocket message
    console.log('⏳ Waiting for WebSocket notification...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if we received the expected WebSocket message
    const updateMessage = messagesReceived.find(
        (msg) =>
            msg.type === 'data_changed' &&
            msg.operation === 'update' &&
            msg.nodeKey === 'websocket-test-node'
    );

    if (updateMessage) {
        console.log('✅ Received WebSocket notification for particle update');
    } else {
        console.error(
            '❌ Did not receive expected WebSocket notification for particle update'
        );
    }

    // Test 3: Delete the particle
    console.log('\n🧪 Test 3: Deleting the particle...');

    try {
        const response = await fetch(
            'http://localhost:3001/particle/websocket-test-node',
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.ok) {
            console.log('✅ Particle deleted successfully via HTTP');
        } else {
            console.error(
                '❌ Failed to delete particle via HTTP:',
                response.status
            );
        }
    } catch (error) {
        console.error('❌ Error deleting particle:', error);
    }

    // Wait for WebSocket message
    console.log('⏳ Waiting for WebSocket notification...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if we received the expected WebSocket message
    const deleteMessage = messagesReceived.find(
        (msg) =>
            msg.type === 'data_changed' &&
            msg.operation === 'delete' &&
            msg.nodeKey === 'websocket-test-node'
    );

    if (deleteMessage) {
        console.log('✅ Received WebSocket notification for particle deletion');
    } else {
        console.error(
            '❌ Did not receive expected WebSocket notification for particle deletion'
        );
    }

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(
        `   Total WebSocket messages received: ${messagesReceived.length}`
    );
    console.log(
        `   Connection established: ${
            messagesReceived.some((m) => m.type === 'connection_established')
                ? '✅'
                : '❌'
        }`
    );
    console.log(`   Add notification: ${addMessage ? '✅' : '❌'}`);
    console.log(`   Update notification: ${updateMessage ? '✅' : '❌'}`);
    console.log(`   Delete notification: ${deleteMessage ? '✅' : '❌'}`);

    const allTestsPassed = addMessage && updateMessage && deleteMessage;
    console.log(
        `\n🎯 Overall Result: ${
            allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'
        }`
    );

    // Close WebSocket
    ws.close();

    return allTestsPassed;
}

// Run the test
testWebSocketIntegration()
    .then((success) => {
        if (success) {
            console.log('\n🎉 WebSocket integration is working correctly!');
            process.exit(0);
        } else {
            console.log(
                '\n💥 WebSocket integration has issues that need to be addressed.'
            );
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('\n💥 Test failed with error:', error);
        process.exit(1);
    });
