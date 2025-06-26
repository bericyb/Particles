# Graph Data Structure Documentation

## Overview

This document defines the canonical graph data structure used throughout the Particles application. This structure is used consistently across all services: frontend, backend HTTP API, MCP server, and storage.

## Core Data Structure

### GraphData Interface

```typescript
interface GraphData {
  nodes: { [key: string]: Node };
  edges: { [edgeId: string]: Edge };
}
```

The `GraphData` structure is the root container for all graph information, consisting of two main collections:
- **nodes**: A dictionary of nodes indexed by their unique string keys
- **edges**: A dictionary of edges indexed by their unique UUID identifiers

### Node Interface

```typescript
interface Node {
  x: number;           // X coordinate for visual positioning
  y: number;           // Y coordinate for visual positioning
  color?: string;      // Optional color override (hex, rgb, or named color)
  title: string;       // Display name/label for the node
  radius: number;      // Visual radius for rendering
  data?: any;          // Optional JSON data field for arbitrary data storage
}
```

**Node Properties:**
- **x, y**: Required coordinates for visual positioning on canvas
- **color**: Optional color override. If not provided, color is calculated dynamically based on connection count
- **title**: Required display name shown in UI and labels
- **radius**: Required visual size for rendering the node
- **data**: Optional field for storing arbitrary JSON data associated with the node

### Edge Interface

```typescript
interface Edge {
  id: string;          // UUID identifier for the edge
  source: string;      // Key of the source node
  target: string;      // Key of the target node
  label?: string;      // Optional display label for the edge
  directed: boolean;   // Whether the edge is directional (shows arrow)
  weight?: number;     // Optional weight for algorithms and visual thickness
  metadata?: any;      // Optional arbitrary metadata storage
}
```

**Edge Properties:**
- **id**: Required UUID string that uniquely identifies the edge
- **source**: Required key referencing a node in the nodes collection
- **target**: Required key referencing a node in the nodes collection
- **label**: Optional text label displayed on the edge
- **directed**: Required boolean indicating if edge shows directional arrow
- **weight**: Optional numeric weight affecting visual thickness and algorithms
- **metadata**: Optional field for storing arbitrary edge-related data

## Example Data Structure

```json
{
  "nodes": {
    "node-1": {
      "x": 100,
      "y": 150,
      "color": "lime",
      "title": "Root Node",
      "radius": 20,
      "data": {
        "type": "root",
        "description": "Main entry point",
        "metadata": {
          "created": "2025-01-01",
          "importance": "high"
        }
      }
    },
    "node-2": {
      "x": 200,
      "y": 100,
      "title": "Child Node A",
      "radius": 15,
      "data": {
        "type": "child",
        "value": 42,
        "tags": ["important", "active"]
      }
    },
    "node-3": {
      "x": 200,
      "y": 200,
      "color": "red",
      "title": "Child Node B",
      "radius": 15
    }
  },
  "edges": {
    "550e8400-e29b-41d4-a716-446655440001": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "source": "node-1",
      "target": "node-2",
      "label": "connects to",
      "directed": true,
      "weight": 1.5
    },
    "550e8400-e29b-41d4-a716-446655440002": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "source": "node-1",
      "target": "node-3",
      "label": "relates to",
      "directed": false,
      "metadata": {
        "relationship": "parent-child",
        "strength": 0.8
      }
    }
  }
}
```

## API Endpoints

### Graph Operations

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/data` | Get complete graph data | - | `GraphData` |
| POST | `/data` | Update complete graph data | `GraphData` | `ApiResponse` |
| GET | `/graph` | Get complete graph data (alias) | - | `GraphData` |
| POST | `/graph` | Update complete graph data (alias) | `GraphData` | `ApiResponse` |
| DELETE | `/data` | Clear all graph data | - | `ApiResponse` |

### Node Operations

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/particle/:key` | Add/update single node | `Node` | `ApiResponse` |
| GET | `/particle/:key` | Get single node | - | `Node` |
| DELETE | `/particle/:key` | Delete node and connected edges | - | `ApiResponse` |

### Edge Operations

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/edge` | Create new edge | `EdgeCreationRequest` | `{success: boolean, edgeId: string}` |
| DELETE | `/edge/:edgeId` | Delete edge by ID | - | `ApiResponse` |
| GET | `/node/:key/edges` | Get all edges for a node | - | `Edge[]` |
| GET | `/edges/:nodeA/:nodeB` | Get edges between two nodes | - | `Edge[]` |

### Edge Creation Request

```typescript
interface EdgeCreationRequest {
  source: string;      // Source node key
  target: string;      // Target node key
  label?: string;      // Optional label
  directed?: boolean;  // Optional direction (defaults to true)
  weight?: number;     // Optional weight
  metadata?: any;      // Optional metadata
}
```

### API Response Format

```typescript
interface ApiResponse {
  success: boolean;
  message?: string;
}
```

## Data Flow

### 1. Frontend to Backend
- Frontend maintains local `particles` variable in `GraphData` format
- All API calls send/receive `GraphData` structure
- Node operations send individual `Node` objects
- Edge operations use dedicated edge endpoints

### 2. Backend Processing
- `GraphService` maintains canonical `GraphData` structure
- All operations validate against TypeScript interfaces
- Automatic edge cleanup when nodes are deleted
- UUID generation for new edges

### 3. MCP Integration
- MCP tools use Zod schemas matching TypeScript interfaces
- All operations proxy through HTTP API for consistency
- Schema validation ensures data integrity

## Migration from Legacy Format

### Legacy Format (DEPRECATED)
```javascript
// OLD - Do not use
{
  "particle-key": {
    x: 100,
    y: 100,
    title: "Node",
    radius: 20,
    edges: [
      { key: "other-particle", label: "connects to" }
    ]
  }
}
```

### Current Format
```javascript
// NEW - Current standard
{
  "nodes": {
    "particle-key": {
      x: 100,
      y: 100,
      title: "Node",
      radius: 20
    }
  },
  "edges": {
    "uuid-string": {
      id: "uuid-string",
      source: "particle-key",
      target: "other-particle",
      label: "connects to",
      directed: true
    }
  }
}
```

## Validation Rules

### Node Validation
- **x, y**: Must be numbers
- **title**: Must be non-empty string
- **radius**: Must be positive number
- **color**: If provided, must be valid CSS color
- **data**: If provided, must be valid JSON

### Edge Validation
- **id**: Must be valid UUID string
- **source, target**: Must reference existing nodes
- **directed**: Must be boolean
- **weight**: If provided, must be positive number
- **label**: If provided, must be string

### Graph Validation
- All edge source/target references must point to existing nodes
- Node keys must be unique within the nodes collection
- Edge IDs must be unique within the edges collection
- No circular references in directed graphs (optional constraint)

## Performance Considerations

### Indexing
- Nodes indexed by string keys for O(1) lookup
- Edges indexed by UUID for O(1) lookup
- Edge queries by node require O(n) scan of edges collection

### Memory Usage
- Each node stores position, visual, and optional data
- Each edge stores relationship and optional metadata
- Large graphs may require pagination or virtualization

### Network Transfer
- Complete graph structure transferred on initial load
- Individual operations send minimal data
- Consider compression for large datasets

## Best Practices

### Node Management
- Use descriptive, stable keys for nodes
- Keep node data field for domain-specific information
- Use consistent radius values for visual hierarchy

### Edge Management
- Always use directed=true unless specifically bidirectional
- Use labels for user-visible relationships
- Store algorithm data in metadata field

### API Usage
- Batch operations when possible using full graph updates
- Use individual node/edge operations for incremental changes
- Handle API errors gracefully with rollback logic

### Frontend Integration
- Maintain local state synchronized with server
- Debounce position updates during drag operations
- Validate data structure before API calls

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Canonical - All services must conform to this specification
