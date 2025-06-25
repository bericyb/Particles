# Particles Server Architecture

## Overview

The Particles server has been refactored to separate the HTTP server and MCP server into independent processes, with the MCP server acting as a client to the HTTP server.

## Architecture

```
┌─────────────────────────────────────┐
│           HTTP Server               │
│         (Port 3001)                 │
│                                     │
│  ┌─────────────────────────────────┐│
│  │        REST API                 ││
│  │  GET    /data                   ││
│  │  POST   /data                   ││
│  │  GET    /particle/:key          ││
│  │  POST   /particle/:key          ││
│  │  DELETE /particle/:key          ││
│  │  DELETE /data                   ││
│  │  GET    /stats                  ││
│  │  GET    /example                ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │    Particle Service             ││
│  │  (Business Logic)               ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
                    ▲
                    │ HTTP Requests
                    │
┌─────────────────────────────────────┐
│           MCP Server                │
│        (Stdio Transport)            │
│                                     │
│  ┌─────────────────────────────────┐│
│  │        MCP Tools                ││
│  │  get-particles                  ││
│  │  update-particles               ││
│  │  add-particle                   ││
│  │  get-particle                   ││
│  │  delete-particle                ││
│  │  clear-particles                ││
│  │  get-stats                      ││
│  │  get-example                    ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │      HTTP Client                ││
│  │   (Axios-based)                 ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Key Components

### 1. HTTP Server (`src/server/http-server.ts`)
- **Purpose**: Standalone Express server providing REST API
- **Port**: 3001 (configurable via `PORT` environment variable)
- **Features**: 
  - CORS enabled
  - JSON middleware
  - Static file serving
  - Error handling
  - All particle management endpoints

### 2. MCP Server (`src/server/mcp-server.ts`)
- **Purpose**: Standalone MCP server for tool integration
- **Transport**: Stdio (for MCP protocol)
- **Features**:
  - All MCP tools as HTTP wrappers
  - Error handling and response formatting
  - Configurable HTTP server URL

### 3. HTTP Client (`src/server/mcp/httpClient.ts`)
- **Purpose**: Axios-based client for MCP server to communicate with HTTP server
- **Features**:
  - Timeout handling (10s)
  - Error handling with proper HTTP status codes
  - Health check functionality
  - Configurable base URL via `PARTICLES_HTTP_URL` environment variable

### 4. MCP Tools (`src/server/mcp/tools.ts`)
- **Purpose**: MCP tool definitions that wrap HTTP API calls
- **Features**:
  - Input validation using Zod schemas
  - Consistent error handling
  - Proper MCP response formatting

## Running the Servers

### Development Mode

**HTTP Server:**
```bash
npm run http:dev
```

**MCP Server:**
```bash
npm run mcp:dev
```

**Both (in separate terminals):**
```bash
# Terminal 1
npm run http:dev

# Terminal 2  
npm run mcp:dev
```

### Production Mode

**HTTP Server:**
```bash
npm run http
```

**MCP Server:**
```bash
npm run mcp
```

## Configuration

### Environment Variables

- `PORT`: HTTP server port (default: 3001)
- `PARTICLES_HTTP_URL`: Base URL for HTTP server (default: http://localhost:3001)

### Example Configuration

```bash
# Custom HTTP server port
PORT=8080 npm run http:dev

# MCP server pointing to custom HTTP server
PARTICLES_HTTP_URL=http://localhost:8080 npm run mcp:dev
```

## API Endpoints

### HTTP REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/data` | Get all particles |
| POST | `/data` | Update all particles |
| GET | `/particle/:key` | Get specific particle |
| POST | `/particle/:key` | Add/update particle |
| DELETE | `/particle/:key` | Delete particle |
| DELETE | `/data` | Clear all particles |
| GET | `/stats` | Get particle statistics |
| GET | `/example` | Get example data |

### MCP Tools

| Tool Name | Description | HTTP Equivalent |
|-----------|-------------|-----------------|
| `get-particles` | Get all particles | `GET /data` |
| `update-particles` | Update all particles | `POST /data` |
| `add-particle` | Add/update particle | `POST /particle/:key` |
| `get-particle` | Get specific particle | `GET /particle/:key` |
| `delete-particle` | Delete particle | `DELETE /particle/:key` |
| `clear-particles` | Clear all particles | `DELETE /data` |
| `get-stats` | Get statistics | `GET /stats` |
| `get-example` | Get example data | `GET /example` |

## Benefits of This Architecture

1. **Separation of Concerns**: HTTP API and MCP server are independent
2. **Single Source of Truth**: All business logic resides in HTTP server
3. **Scalability**: HTTP server can be scaled independently
4. **Testing**: HTTP API can be tested independently
5. **Consistency**: MCP tools guaranteed to behave like HTTP API
6. **Flexibility**: MCP server can connect to different HTTP server instances

## Testing

### HTTP API Testing
```bash
# Get stats
curl -X GET http://localhost:3001/stats

# Get all particles
curl -X GET http://localhost:3001/data

# Add a particle
curl -X POST http://localhost:3001/particle/test \
  -H "Content-Type: application/json" \
  -d '{"x":100,"y":100,"color":"red","title":"Test","radius":10,"edges":[]}'
```

### MCP Server Testing
The MCP server can be tested using any MCP client (like Cline) once both servers are running.

## Migration Notes

- Old `server.ts` is preserved but no longer used
- All MCP tools now use HTTP client instead of direct service calls
- Package.json scripts updated to support new architecture
- No breaking changes to existing HTTP API or MCP tool interfaces
