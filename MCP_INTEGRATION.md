# MCP Integration Documentation

This document explains the Model Context Protocol (MCP) integration added to the Particles server.

## Overview

The Particles server now supports both HTTP REST API and MCP (Model Context Protocol) interfaces, sharing the same underlying business logic through a unified service layer.

## Architecture

```
src/server/
├── server.ts              # Main HTTP server entry point
├── mcp-server.ts          # Standalone MCP server entry point
├── services/
│   └── particleService.ts # Shared business logic
├── routes/
│   ├── index.ts           # HTTP route definitions
│   └── handlers.ts        # HTTP route handlers
├── mcp/
│   ├── mcpServer.ts       # MCP server configuration
│   └── tools.ts           # MCP tool definitions
└── types.ts               # Shared TypeScript types
```

## Running the Servers

### HTTP Server (Default)
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### MCP Server
```bash
# Development mode
npm run mcp:dev

# Production mode
npm run build
npm run mcp
```

### Both Servers (HTTP + MCP)
```bash
# Run HTTP server with MCP flag
npm run build
node dist/server/server.js --mcp
```

## Available MCP Tools

The MCP server provides the following tools that mirror the HTTP API functionality:

### 1. get-particles
- **Description**: Retrieve all stored particle data
- **Input**: None
- **Output**: JSON object containing all particles

### 2. update-particles
- **Description**: Update all particle data with new dataset
- **Input**: 
  - `data`: Object containing particle data
- **Output**: Success/failure response

### 3. add-particle
- **Description**: Add or update a single particle
- **Input**:
  - `key`: String identifier for the particle
  - `particle`: Particle object with x, y, color, title, radius, edges
- **Output**: Success/failure response

### 4. get-particle
- **Description**: Get a specific particle by key
- **Input**:
  - `key`: String identifier for the particle
- **Output**: Particle object or error message

### 5. delete-particle
- **Description**: Delete a specific particle by key
- **Input**:
  - `key`: String identifier for the particle
- **Output**: Success/failure response

### 6. get-example
- **Description**: Get example particle data for testing
- **Input**: None
- **Output**: Example particle data object

### 7. clear-particles
- **Description**: Clear all particle data
- **Input**: None
- **Output**: Success/failure response

### 8. get-stats
- **Description**: Get particle statistics including count
- **Input**: None
- **Output**: Statistics object with particle count

## HTTP API Endpoints

The HTTP server provides these endpoints (unchanged from original functionality):

- `GET /data` - Get all particles
- `POST /data` - Update all particles
- `DELETE /data` - Clear all particles
- `GET /particle/:key` - Get specific particle
- `POST /particle/:key` - Add/update specific particle
- `DELETE /particle/:key` - Delete specific particle
- `GET /example` - Get example data
- `GET /stats` - Get statistics

## Data Synchronization

Both HTTP and MCP interfaces share the same in-memory data store through the `ParticleService` singleton. This means:

- Changes made via HTTP API are immediately available through MCP tools
- Changes made via MCP tools are immediately available through HTTP API
- Data consistency is maintained across both interfaces

## Example Usage

### Using MCP Tools (via Cline or other MCP clients)

```typescript
// Get all particles
use_mcp_tool("particles-server", "get-particles", {})

// Add a new particle
use_mcp_tool("particles-server", "add-particle", {
  "key": "node1",
  "particle": {
    "x": 100,
    "y": 200,
    "color": "blue",
    "title": "My Node",
    "radius": 15,
    "edges": []
  }
})

// Get statistics
use_mcp_tool("particles-server", "get-stats", {})
```

### Using HTTP API

```bash
# Get all particles
curl http://localhost:3001/data

# Add a new particle
curl -X POST http://localhost:3001/particle/node1 \
  -H "Content-Type: application/json" \
  -d '{
    "x": 100,
    "y": 200,
    "color": "blue",
    "title": "My Node",
    "radius": 15,
    "edges": []
  }'

# Get statistics
curl http://localhost:3001/stats
```

## Configuration for MCP Clients

To use this MCP server with Cline or other MCP clients, add it to your MCP configuration:

```json
{
  "mcpServers": {
    "particles-server": {
      "command": "node",
      "args": ["/path/to/your/project/dist/server/mcp-server.js"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

## Benefits of This Architecture

1. **Code Reusability**: Both interfaces use the same business logic
2. **Consistency**: Data operations behave identically across protocols
3. **Maintainability**: Single source of truth for particle operations
4. **Extensibility**: Easy to add new features to both interfaces
5. **Flexibility**: Choose the interface that best fits your use case

## Development Notes

- The `ParticleService` class handles all business logic
- HTTP handlers are thin wrappers around service methods
- MCP tools are thin wrappers around service methods
- TypeScript types are shared across all components
- Zod schemas provide runtime validation for MCP inputs
