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
- **Add Node Functionality**: Extend the visualization with new data points
- **Save/Load Maps**: Save particle maps to local JSON files and load them back
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

Run the start script to launch both the backend server and frontend:

```bash
./start.sh
```

This will:
- Start the backend server on port 3001
- Launch a static file server to serve the frontend
- Open the application in your default web browser

### Interacting with the Visualization

- **Pan**: Click and drag on empty space to move the canvas
- **Zoom**: Use the mouse wheel to zoom in and out
- **Select Node**: Double-click on a particle to view its details in a modal
- **Move Node**: Click and drag a particle to reposition it
- **Add Node**: Click the "Add Particles" button to add a new particle
- **Sort Particles**: Click the "Sort Particles" button to arrange nodes by connection count (centrality-based sorting)
- **Save Map**: Click the "Save Map" button to save the current particle map as a JSON file
- **Open Map**: Click the "Open Map" button to load a previously saved particle map JSON file

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

- `GET /data`: Retrieve all stored particle data
- `POST /data`: Update all stored particle data
- `DELETE /data`: Clear all particle data
- `GET /particle/:key`: Get a specific particle by key
- `POST /particle/:key`: Add or update a specific particle
- `DELETE /particle/:key`: Delete a specific particle
- `GET /example`: Get example particle data
- `GET /stats`: Get particle statistics (count, etc.)

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
  .then(stats => console.log(`Particle count: ${stats.particleCount}`));
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

- `get-particles`: Retrieve all particle data
- `update-particles`: Update all particle data
- `add-particle`: Add or update a single particle
- `get-particle`: Get specific particle by key
- `delete-particle`: Delete specific particle
- `get-example`: Get example particle data
- `clear-particles`: Clear all particle data
- `get-stats`: Get particle statistics

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
│   │   ├── index.js              # Main JavaScript file for the frontend
│   │   ├── utils.js              # Utility functions for particle creation
│   │   └── repel_attract.js      # Physics simulation for particle movement
│   └── server/                   # Backend TypeScript files
│       ├── server.ts             # Main HTTP server entry point
│       ├── mcp-server.ts         # Standalone MCP server entry point
│       ├── types.ts              # Shared TypeScript type definitions
│       ├── services/
│       │   └── particleService.ts # Shared business logic layer
│       ├── routes/
│       │   ├── index.ts          # HTTP route definitions
│       │   └── handlers.ts       # HTTP route handler functions
│       └── mcp/
│           ├── mcpServer.ts      # MCP server configuration
│           └── tools.ts          # MCP tool definitions
├── dist/                         # Compiled TypeScript output
├── package.json                  # Node.js dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── MCP_INTEGRATION.md            # Detailed MCP integration documentation
└── start.sh                     # Script to start frontend and backend
```

### Key Components

- **Frontend** (`src/public/`):
  - `index.html`: Defines the canvas and UI elements
  - `index.js`: Handles user interaction and animation
  - `utils.js`: Contains functions for creating and drawing particles
  - `repel_attract.js`: Implements the physics simulation

- **Backend** (`src/server/`):
  - `server.ts`: Main HTTP server with Express.js
  - `mcp-server.ts`: Standalone MCP server entry point
  - `services/particleService.ts`: Unified business logic for both HTTP and MCP
  - `routes/`: HTTP route definitions and handlers
  - `mcp/`: MCP server configuration and tool definitions
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

## Recent Updates

### Graph Rendering and Data Handling Fixes (December 2024)

We've recently implemented significant fixes to improve the reliability and functionality of the graph visualization:

#### Issues Resolved:
1. **Initial Render Problem**: Fixed issue where nodes wouldn't render on initial page load despite successful data fetching
2. **Node Label Display**: Corrected node labels to show user-provided titles instead of UUID keys
3. **Data Format Compatibility**: Enhanced support for multiple data formats (new graph format, legacy Map format, and legacy object format)

#### Key Improvements:
- ✅ **Robust Data Handling**: The application now seamlessly handles both new graph format (`{nodes: {...}, edges: {...}}`) and legacy particle formats
- ✅ **Proper Label Display**: Node labels now correctly display meaningful titles instead of technical UUIDs
- ✅ **Backward Compatibility**: All existing data continues to work without migration
- ✅ **Comprehensive Testing**: Added automated test suite to prevent regressions
- ✅ **Enhanced Documentation**: Detailed technical documentation for troubleshooting and development

#### Technical Details:
- **Format Detection**: Intelligent detection of data format (graph vs legacy) ensures proper rendering
- **Label Logic**: Implemented `node.title || nodeKey` pattern for consistent label display
- **Event Handling**: Updated all click, drag, and interaction handlers to work with multiple data formats
- **Schema Consistency**: Aligned MCP server tools with HTTP endpoints for consistent behavior

#### Testing:
Run the comprehensive test suite to verify functionality:
```bash
npm install --save-dev jsdom
node tests/test-graph-fixes.js
```

For detailed technical information about these fixes, see [GRAPH_FIXES_DOCUMENTATION.md](./GRAPH_FIXES_DOCUMENTATION.md).

## Acknowledgements

- This project was created to provide a simple, local solution for interactive data visualization.
