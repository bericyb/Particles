# WebSocket Real-Time Updates

This document describes the WebSocket integration that enables real-time updates for the particle graph visualization.

## Overview

The particle server now supports WebSocket connections for real-time data synchronization. When data changes on the server (add, update, delete operations), all connected clients receive instant notifications and automatically update their local data.

## Architecture

### Backend Components

1. **WebSocketService** (`src/server/services/websocketService.ts`)

    - Manages WebSocket connections
    - Handles client connection/disconnection
    - Broadcasts messages to all connected clients
    - Implements heartbeat mechanism for connection health

2. **GraphService Integration**

    - Modified to emit WebSocket notifications on data changes
    - Supports operations: `add`, `update`, `delete`, `clear`, `bulk_update`

3. **HTTP Server Integration** (`src/server/http-server.ts`)
    - WebSocket server runs alongside HTTP server
    - Available at `ws://localhost:3001/ws`

### Frontend Components

1. **WebSocket Client** (`src/public/graph.js`)
    - Automatically connects to WebSocket server on page load
    - Handles real-time data updates
    - Implements automatic reconnection with exponential backoff
    - Shows user notifications for connection status and data changes

## Message Format

### Server to Client Messages

```javascript
{
  type: 'data_changed' | 'connection_established' | 'heartbeat',
  operation?: 'add' | 'update' | 'delete' | 'clear' | 'bulk_update',
  data?: GraphData,
  nodeKey?: string,
  timestamp: number
}
```

### Client to Server Messages

```javascript
{
  type: 'heartbeat',
  timestamp: number
}
```

## Features

### Real-Time Data Synchronization

-   **Add Node**: When a node is added, all clients see it immediately
-   **Update Node**: Position changes, property updates are broadcast instantly
-   **Delete Node**: Node removal is synchronized across all clients
-   **Clear All**: Complete data clearing is synchronized
-   **Bulk Updates**: Large data changes (like file imports) are handled efficiently

### Connection Management

-   **Automatic Connection**: WebSocket connects automatically on page load
-   **Reconnection**: Automatic reconnection with exponential backoff (up to 5 attempts)
-   **Heartbeat**: 30-second heartbeat to maintain connection health
-   **Graceful Degradation**: Falls back to HTTP-only mode if WebSocket fails

### User Experience

-   **Visual Notifications**: Users see notifications for connection status and data changes
-   **Seamless Updates**: No page refresh needed for data synchronization
-   **Multi-User Support**: Multiple users can collaborate in real-time

## Usage Examples

### Adding a Node (triggers WebSocket notification)

```javascript
// HTTP API call
fetch('http://localhost:3001/particle/my-node', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        x: 100,
        y: 100,
        title: 'My Node',
        radius: 20,
    }),
});

// All connected clients receive:
// { type: 'data_changed', operation: 'add', nodeKey: 'my-node', data: {...} }
```

### Updating Node Position (drag and drop)

```javascript
// When user drags a node, position updates are debounced and sent to server
// All other clients see the node move in real-time
```

## Testing

Run the WebSocket integration test:

```bash
node tests/test-websocket-integration.js
```

This test verifies:

-   WebSocket connection establishment
-   Real-time notifications for add/update/delete operations
-   Message format correctness
-   Connection cleanup

## Configuration

### Server Configuration

-   **Port**: 3001 (same as HTTP server)
-   **Path**: `/ws`
-   **Heartbeat Interval**: 30 seconds
-   **Max Reconnection Attempts**: 5

### Client Configuration

-   **Reconnection Delay**: 1 second (with exponential backoff)
-   **Max Reconnection Attempts**: 5
-   **Notification Duration**: 2-5 seconds depending on message type

## Benefits

1. **Real-Time Collaboration**: Multiple users can work on the same graph simultaneously
2. **Instant Feedback**: Changes are visible immediately across all clients
3. **Reduced Server Load**: No need for polling or frequent HTTP requests
4. **Better User Experience**: Seamless, responsive interface
5. **Scalable**: Supports multiple concurrent users efficiently

## Browser Compatibility

WebSocket is supported in all modern browsers:

-   Chrome 16+
-   Firefox 11+
-   Safari 7+
-   Edge 12+
-   Internet Explorer 10+

## Troubleshooting

### Connection Issues

-   Check if server is running on port 3001
-   Verify WebSocket endpoint: `ws://localhost:3001/ws`
-   Check browser console for WebSocket errors

### Missing Notifications

-   Verify server logs show "Broadcasting data change" messages
-   Check if multiple browser tabs are open (each creates separate connection)
-   Ensure operations are going through the HTTP API (not direct data manipulation)

### Performance

-   WebSocket connections are lightweight
-   Heartbeat messages are small (< 100 bytes)
-   Data messages include full graph state for consistency
