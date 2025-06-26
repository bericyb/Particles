# Particles

## Overview

Particles is an interactive data visualization tool designed for local use in a web browser. It allows users to visualize data as a network of connected nodes (particles) that can be manipulated in real-time. This tool is particularly useful for exploring and understanding relationships between data points through an intuitive, visual interface.

The project provides a simple yet powerful way to:
- Visualize network graphs and relationship maps
- Explore connections between data points
- Manipulate and reorganize data visualization in real-time
- Interact with data through an intuitive interface

![Particles Visualization](https://via.placeholder.com/800x400?text=Particles+Visualization) <!-- Consider replacing with an actual screenshot -->

## Features

- **Interactive Canvas**: Pan and zoom functionality for exploring large data sets
- **Particle Visualization**: Data points represented as particles with visible connections (edges) between them
- **Drag and Drop**: Ability to drag particles to reorganize the visualization
- **Information Display**: Modal popup with detailed information when clicking on particles
- **Physics Simulation**: Attractive forces between particles for automatic layout organization
- **Particle Sorting**: Centrality-based sorting algorithm that arranges nodes by connection count
- **Particle Shuffling**: Random redistribution of particles for exploring different layouts
- **Add Node Functionality**: Advanced particle creation with JSON data support and edge connections
- **Clear Particles**: Remove all particles from the visualization
- **Save/Load Maps**: Save particle maps to local JSON files and load them back
- **Label Toggles**: Show/hide node labels and edge labels independently
- **Tree View**: Alternative hierarchical view of the data structure
- **Local Backend Server**: Store and retrieve particle data through a simple API
- **MCP Integration**: Model Context Protocol support for AI tool integration
- **Dual Interface**: Both HTTP REST API and MCP protocol support
- **Standalone Operation**: Works entirely locally without requiring external services

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v12 or higher)
- npm (comes with Node.js)

### Setup

1. Clone the repository or download the source code
2. Navigate to the project directory
3. Install the required dependencies:

```bash
npm install
```

## Usage

### Starting the Application

Run the start script to launch the HTTP server:

```bash
npm run start
```

This will:
- Start the HTTP server on port 3001
- Serve the frontend static files from `src/public/`
- Make the application available at `http://localhost:3001`

For development with auto-reload:

```bash
npm run dev
```

To access the application, open your web browser and navigate to `http://localhost:3001`.

### Interacting with the Visualization

- **Pan**: Click and drag on empty space to move the canvas
- **Zoom**: Use the mouse wheel to zoom in and out
- **Select Node**: Double-click on a particle to view its details in a modal
- **Move Node**: Click and drag a particle to reposition it
- **Add Particles**: Click the "Add Particles" button to open an advanced form for creating new particles with JSON data and edge connections
- **Sort Particles**: Click the "Sort Particles" button to arrange nodes by connection count (centrality-based sorting)
- **Shuffle Particles**: Click the "Shuffle Particles" button to randomly redistribute particles across the canvas
- **Clear Particles**: Click the "Clear Particles" button to remove all particles from the visualization
- **Save Map**: Click the "Save Map" button to save the current particle map as a JSON file
- **Open Map**: Click the "Open Map" button to load a previously saved particle map JSON file
- **Node Labels**: Click the "Node Labels" button to toggle the visibility of particle titles
- **Edge Labels**: Click the "Edge Labels" button to toggle the visibility of connection labels
- **Tree View**: Click the "Tree" button to switch to an alternative hierarchical view of the data

### Particle Sorting Algorithm

The particle sorting feature implements a **centrality-based layout algorithm** that organizes nodes based on their connection count (degree centrality):

- **High-centrality nodes** (many connections) are positioned closer to the center
- **Low-centrality nodes** (few connections) are positioned toward the edges
- Nodes with the same connection count form **concentric rings** around the center
- The algorithm includes **collision detection** to prevent node overlap
- **Smooth animation** transitions nodes to their target positions
- All position changes are **automatically saved** to the backend

**How it works:**
1. Calculate degree centrality for each node (number of connections)
2. Group nodes by centrality level
3. Position high-centrality nodes in inner rings, low-centrality nodes in outer rings
4. Apply repulsion forces to prevent overlap
5. Animate nodes smoothly to their target positions

This creates an intuitive visual hierarchy where the most connected (important) nodes are prominently displayed in the center, making it easy to identify key nodes in your network.

### Backend API

The application includes a TypeScript-based backend server with comprehensive HTTP REST API endpoints:

#### HTTP Endpoints

**Core Data Operations:**
- `GET /data`: Retrieve all stored graph data
- `POST /data`: Update all stored graph data
- `DELETE /data`: Clear all graph data
- `GET /example`: Get example graph data
- `GET /stats`: Get basic statistics (node count)

**Node Operations:**
- `GET /particle/:key`: Get a specific node by key
- `POST /particle/:key`: Add or update a specific node
- `DELETE /particle/:key`: Delete a specific node

**Graph Operations:**
- `GET /graph`: Get complete graph data with nodes and edges
- `POST /graph`: Update complete graph data
- `GET /graph/stats`: Get detailed graph statistics

**Edge Operations:**
- `POST /edge`: Add a new edge between two nodes
- `DELETE /edge/:edgeId`: Remove an edge by its ID
- `GET /node/:key/edges`: Get all edges connected to a specific node
- `GET /edges/:nodeA/:nodeB`: Get edges between two specific nodes

**Debug:**
- `GET /debug`: Debug endpoint for testing GraphService directly

Example API usage:

```javascript
// Fetch all particle data
fetch('http://localhost:3001/data')
  .then(res => res.json())
  .then(data => console.log(data));

// Add a single particle
fetch('http://localhost:3001/particle/node1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    x: 100, y: 200, color: 'blue', 
    title: 'My Node', radius: 15, edges: []
  })
})
  .then(res => res.json())
  .then(result => console.log(result));

// Get statistics
fetch('http://localhost:3001/stats')
  .then(res => res.json())
  .then(stats => console.log(`Node count: ${stats.nodeCount}`));
```

### MCP Integration

The server now supports **Model Context Protocol (MCP)** for AI tool integration, providing the same functionality through MCP tools that can be used by AI assistants like Cline.

#### Running the MCP Server

```bash
# Development mode
npm run mcp:dev

# Production mode
npm run build
npm run mcp
```

#### Available MCP Tools

**Core Data Tools:**
- `get-data`: Retrieve all stored graph data
- `update-data`: Update all graph data with new dataset
- `clear-data`: Clear all graph data
- `get-example`: Get example graph data for testing
- `get-stats`: Get graph statistics including node count

**Node Tools:**
- `add-node`: Add or update a single node
- `get-node`: Get a specific node by key
- `delete-node`: Delete a specific node by key

**Graph Tools:**
- `get-graph`: Retrieve complete graph data with nodes and edges
- `update-graph`: Update complete graph data with new nodes and edges
- `get-graph-stats`: Get detailed graph statistics including node and edge counts

**Edge Tools:**
- `add-edge`: Add a new edge between two nodes
- `remove-edge`: Remove an edge by its ID
- `get-node-edges`: Get all edges connected to a specific node
- `get-edges-between`: Get edges between two specific nodes

#### MCP Configuration

To use with Cline or other MCP clients, add to your MCP configuration:

```json
{
  "mcpServers": {
    "particles-server": {
      "command": "node",
      "args": ["dist/server/mcp-server.js"],
      "cwd": "/path/to/particles/project"
    }
  }
}
```

Both HTTP and MCP interfaces share the same data store, ensuring consistency across all access methods.

## Project Structure

```
/
├── src/
│   ├── public/                    # Frontend files
│   │   ├── index.html            # Main HTML file
│   │   ├── index.css             # CSS styles
│   │   ├── graph.js              # Main JavaScript file for graph visualization
│   │   ├── utils.js              # Utility functions for particle creation
│   │   ├── repel_attract.js      # Physics simulation for particle movement
│   │   ├── sort-particles.js     # Particle sorting functionality
│   │   ├── shuffle-particles.js  # Particle shuffling functionality
│   │   ├── tree.html             # Tree view interface
│   │   └── tree.js               # Tree view functionality
│   └── server/                   # Backend TypeScript files
│       ├── http-server.ts        # HTTP server entry point
│       ├── mcp-server.ts         # Standalone MCP server entry point
│       ├── server.ts             # Shared server utilities
│       ├── types.ts              # Shared TypeScript type definitions
│       ├── services/
│       │   └── graphService.ts   # Shared business logic layer
│       ├── routes/
│       │   ├── index.ts          # HTTP route definitions
│       │   └── handlers.ts       # HTTP route handler functions
│       └── mcp/
│           ├── httpClient.ts     # HTTP client for MCP server
│           ├── mcpServer.ts      # MCP server configuration
│           └── tools.ts          # MCP tool definitions
├── tests/                        # Test files
├── dist/                         # Compiled TypeScript output
├── package.json                  # Node.js dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── MCP_INTEGRATION.md            # Detailed MCP integration documentation
```

### Key Components

- **Frontend** (`src/public/`):
  - `index.html`: Defines the canvas and UI elements with buttons for all functionality
  - `graph.js`: Main JavaScript file handling graph visualization, user interaction, and animation
  - `utils.js`: Contains functions for creating and drawing particles
  - `repel_attract.js`: Implements the physics simulation for particle movement
  - `sort-particles.js`: Centrality-based particle sorting functionality
  - `shuffle-particles.js`: Random particle shuffling functionality
  - `tree.html` & `tree.js`: Alternative tree view interface

- **Backend** (`src/server/`):
  - `http-server.ts`: HTTP server entry point with Express.js
  - `mcp-server.ts`: Standalone MCP server entry point
  - `server.ts`: Shared server utilities
  - `services/graphService.ts`: Unified business logic for both HTTP and MCP interfaces
  - `routes/`: HTTP route definitions and handlers
  - `mcp/`: MCP server configuration, tools, and HTTP client
  - `types.ts`: Shared TypeScript interfaces

- **Architecture Benefits**:
  - **Separation of Concerns**: Clear separation between HTTP routes, MCP tools, and business logic
  - **Code Reusability**: Both HTTP and MCP interfaces use the same service layer
  - **Type Safety**: Full TypeScript support with shared type definitions
  - **Maintainability**: Modular structure makes it easy to extend and modify

## Technologies Used

- **HTML5 Canvas**: For rendering the particle visualization
- **JavaScript (ES6+)**: For frontend logic and interaction
- **TypeScript**: For type-safe backend development
- **Node.js**: For the backend server runtime
- **Express.js**: HTTP server framework for REST API
- **Model Context Protocol (MCP)**: AI tool integration protocol
- **Zod**: Runtime type validation for MCP inputs
- **HTTP Server**: RESTful API for data operations

## Contributing

Contributions to improve Particles are welcome. Please feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is available as open source under the terms of the [MIT License](https://opensource.org/licenses/MIT).


## Acknowledgements

- This project was created to provide a simple, local solution for interactive data visualization.
