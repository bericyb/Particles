import { z } from 'zod';
import { httpClient } from './httpClient';

// Graph-based schemas
const NodeSchema = z.object({
  x: z.number(),
  y: z.number(),
  color: z.string().optional(),
  title: z.string(),
  radius: z.number(),
  data: z.any().optional()
});

const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  directed: z.boolean(),
  weight: z.number().optional(),
  metadata: z.any().optional()
});

const GraphDataSchema = z.object({
  nodes: z.record(z.string(), NodeSchema),
  edges: z.record(z.string(), EdgeSchema)
});

const EdgeOptionsSchema = z.object({
  label: z.string().optional(),
  directed: z.boolean().optional(),
  weight: z.number().optional(),
  metadata: z.any().optional()
});

/**
 * Get all data tool
 */
export const getDataTool = {
  name: "get-data",
  description: "Retrieve all stored graph data",
  inputSchema: {},
  handler: async () => {
    try {
      const data = await httpClient.getAllParticles();
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(data, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

/**
 * Update data tool
 */
export const updateDataTool = {
  name: "update-data",
  description: "Update all graph data with new dataset",
  inputSchema: {
    data: GraphDataSchema
  },
  handler: async ({ data }: { data: any }) => {
    try {
      const result = await httpClient.updateParticles(data);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

/**
 * Add single node tool
 */
export const addNodeTool = {
  name: "add-node",
  description: "Add or update a single node",
  inputSchema: {
    key: z.string(),
    node: NodeSchema
  },
  handler: async ({ key, node }: { key: string; node: any }) => {
    try {
      const result = await httpClient.addParticle(key, node);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

/**
 * Get single node tool
 */
export const getNodeTool = {
  name: "get-node",
  description: "Get a specific node by key",
  inputSchema: {
    key: z.string()
  },
  handler: async ({ key }: { key: string }) => {
    try {
      const node = await httpClient.getParticle(key);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(node, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

/**
 * Delete node tool
 */
export const deleteNodeTool = {
  name: "delete-node",
  description: "Delete a specific node by key",
  inputSchema: {
    key: z.string()
  },
  handler: async ({ key }: { key: string }) => {
    try {
      const result = await httpClient.deleteParticle(key);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

/**
 * Get example data tool
 */
export const getExampleTool = {
  name: "get-example",
  description: "Get example graph data for testing",
  inputSchema: {},
  handler: async () => {
    try {
      const exampleData = await httpClient.getExampleData();
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(exampleData, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

/**
 * Clear all data tool
 */
export const clearDataTool = {
  name: "clear-data",
  description: "Clear all graph data",
  inputSchema: {},
  handler: async () => {
    try {
      const result = await httpClient.clearAllParticles();
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

/**
 * Get statistics tool
 */
export const getStatsTool = {
  name: "get-stats",
  description: "Get graph statistics including node count",
  inputSchema: {},
  handler: async () => {
    try {
      const stats = await httpClient.getStats();
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(stats, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

// New graph-based tools

/**
 * Get complete graph data tool
 */
export const getGraphTool = {
  name: "get-graph",
  description: "Retrieve complete graph data with nodes and edges",
  inputSchema: {},
  handler: async () => {
    try {
      const graph = await httpClient.getGraph();
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(graph, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

/**
 * Update complete graph data tool
 */
export const updateGraphTool = {
  name: "update-graph",
  description: "Update complete graph data with new nodes and edges",
  inputSchema: {
    graph: GraphDataSchema
  },
  handler: async ({ graph }: { graph: any }) => {
    try {
      const result = await httpClient.updateGraph(graph);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

/**
 * Add edge tool
 */
export const addEdgeTool = {
  name: "add-edge",
  description: "Add a new edge between two nodes",
  inputSchema: {
    source: z.string(),
    target: z.string(),
    options: EdgeOptionsSchema.optional()
  },
  handler: async ({ source, target, options }: { source: string; target: string; options?: any }) => {
    try {
      const result = await httpClient.addEdge(source, target, options || {});
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

/**
 * Remove edge tool
 */
export const removeEdgeTool = {
  name: "remove-edge",
  description: "Remove an edge by its ID",
  inputSchema: {
    edgeId: z.string()
  },
  handler: async ({ edgeId }: { edgeId: string }) => {
    try {
      const result = await httpClient.removeEdge(edgeId);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

/**
 * Get node edges tool
 */
export const getNodeEdgesTool = {
  name: "get-node-edges",
  description: "Get all edges connected to a specific node",
  inputSchema: {
    nodeKey: z.string()
  },
  handler: async ({ nodeKey }: { nodeKey: string }) => {
    try {
      const edges = await httpClient.getNodeEdges(nodeKey);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(edges, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

/**
 * Get edges between nodes tool
 */
export const getEdgesBetweenTool = {
  name: "get-edges-between",
  description: "Get edges between two specific nodes",
  inputSchema: {
    nodeA: z.string(),
    nodeB: z.string()
  },
  handler: async ({ nodeA, nodeB }: { nodeA: string; nodeB: string }) => {
    try {
      const edges = await httpClient.getEdgesBetween(nodeA, nodeB);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(edges, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

/**
 * Get graph statistics tool
 */
export const getGraphStatsTool = {
  name: "get-graph-stats",
  description: "Get detailed graph statistics including node and edge counts",
  inputSchema: {},
  handler: async () => {
    try {
      const stats = await httpClient.getGraphStats();
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(stats, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ success: false, message: error.message }, null, 2)
        }]
      };
    }
  }
};

// Export all tools
export const allTools = [
  // Core data tools
  getDataTool,
  updateDataTool,
  addNodeTool,
  getNodeTool,
  deleteNodeTool,
  getExampleTool,
  clearDataTool,
  getStatsTool,
  
  // Graph-based tools
  getGraphTool,
  updateGraphTool,
  addEdgeTool,
  removeEdgeTool,
  getNodeEdgesTool,
  getEdgesBetweenTool,
  getGraphStatsTool
];
