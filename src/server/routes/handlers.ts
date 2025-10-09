import { Request, Response } from 'express';
import { graphService } from '../services/graphService';
import { GraphData, Node } from '../types';

/**
 * GET /data - Retrieve all stored data
 */
export const getAllParticles = (req: Request, res: Response) => {
  const data = graphService.getGraph();
  res.json(data);
};

/**
 * POST /data - Update the stored data
 */
export const updateParticles = (req: Request, res: Response) => {
  try {
    const newData: GraphData = req.body;
    const result = graphService.updateGraph(newData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in updateParticles handler:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Invalid data format' 
    });
  }
};

/**
 * GET /example - Get example data
 */
export const getExampleData = (req: Request, res: Response) => {
  const exampleData = graphService.getExampleData();
  res.json(exampleData);
};

/**
 * POST /particle/:key - Add or update a single node
 */
export const addParticle = (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const requestBody = req.body;
    
    console.log('addParticle handler called with key:', key);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Validate required fields
    if (!requestBody.title || requestBody.x === undefined || requestBody.y === undefined || requestBody.radius === undefined) {
      console.error('Missing required fields:', { title: requestBody.title, x: requestBody.x, y: requestBody.y, radius: requestBody.radius });
      res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: title, x, y, radius' 
      });
      return;
    }
    
    // Extract node data
    const node: Node = {
      x: parseFloat(requestBody.x) || 0,
      y: parseFloat(requestBody.y) || 0,
      color: requestBody.color || 'blue',
      title: requestBody.title || 'Untitled',
      radius: parseFloat(requestBody.radius) || 20,
      data: requestBody.data
    };
    
    console.log('Created node object:', JSON.stringify(node, null, 2));
    
    // Add the node
    const result = graphService.addNode(key, node);
    
    console.log('GraphService result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in addParticle handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error: ' + errorMessage 
    });
  }
};

/**
 * GET /particle/:key - Get a specific node
 */
export const getParticle = (req: Request, res: Response) => {
  const { key } = req.params;
  const node = graphService.getNode(key);
  
  if (node) {
    res.json(node);
  } else {
    res.status(404).json({ 
      success: false, 
      message: 'Node not found' 
    });
  }
};

/**
 * DELETE /particle/:key - Delete a specific node
 */
export const deleteParticle = (req: Request, res: Response) => {
  const { key } = req.params;
  const result = graphService.removeNode(key);
  
  if (result.success) {
    res.json(result);
  } else {
    res.status(404).json(result);
  }
};

/**
 * DELETE /data - Clear all data
 */
export const clearAllParticles = (req: Request, res: Response) => {
  const result = graphService.clearAll();
  res.json(result);
};

/**
 * GET /stats - Get statistics
 */
export const getStats = (req: Request, res: Response) => {
  const stats = graphService.getStats();
  res.json({ 
    success: true, 
    nodeCount: stats.nodeCount 
  });
};

// New graph-based handlers

/**
 * GET /graph - Get complete graph data
 */
export const getGraph = (req: Request, res: Response) => {
  const graph = graphService.getGraph();
  res.json(graph);
};

/**
 * POST /graph - Update complete graph data
 */
export const updateGraph = (req: Request, res: Response) => {
  try {
    const graphData = req.body;
    const result = graphService.updateGraph(graphData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in updateGraph handler:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Invalid graph data format' 
    });
  }
};

/**
 * POST /edge - Add a new edge
 */
export const addEdge = (req: Request, res: Response) => {
  try {
    const { source, target, label, directed, weight, metadata } = req.body;
    
    if (!source || !target) {
      res.status(400).json({
        success: false,
        message: 'Source and target are required'
      });
      return;
    }

    const edgeId = graphService.addEdge(source, target, {
      label,
      directed: directed !== undefined ? directed : true,
      weight,
      metadata
    });

    res.json({
      success: true,
      edgeId: edgeId
    });
  } catch (error) {
    console.error('Error in addEdge handler:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to add edge' 
    });
  }
};

/**
 * DELETE /edge/:edgeId - Remove an edge
 */
export const removeEdge = (req: Request, res: Response) => {
  try {
    const { edgeId } = req.params;
    const success = graphService.removeEdge(edgeId);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({
        success: false,
        message: 'Edge not found'
      });
    }
  } catch (error) {
    console.error('Error in removeEdge handler:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to remove edge' 
    });
  }
};

/**
 * GET /node/:key/edges - Get all edges for a specific node
 */
export const getNodeEdges = (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const edges = graphService.getNodeEdges(key);
    res.json(edges);
  } catch (error) {
    console.error('Error in getNodeEdges handler:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to get node edges' 
    });
  }
};

/**
 * GET /edges/:nodeA/:nodeB - Get edges between two specific nodes
 */
export const getEdgesBetween = (req: Request, res: Response) => {
  try {
    const { nodeA, nodeB } = req.params;
    const edges = graphService.getEdgesBetween(nodeA, nodeB);
    res.json(edges);
  } catch (error) {
    console.error('Error in getEdgesBetween handler:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to get edges between nodes' 
    });
  }
};

/**
 * GET /graph/stats - Get detailed graph statistics
 */
export const getGraphStats = (req: Request, res: Response) => {
  try {
    const stats = graphService.getStats();
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Error in getGraphStats handler:', error);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to get graph statistics' 
    });
  }
};

/**
 * GET /debug - Debug endpoint to test GraphService directly
 */
export const debugGraphService = (req: Request, res: Response) => {
  console.log('=== DEBUG ENDPOINT CALLED ===');
  
  // Test getExampleData
  const exampleData = graphService.getExampleData();
  console.log('GraphService.getExampleData() result:', JSON.stringify(exampleData, null, 2));
  
  // Test getGraph
  const graphData = graphService.getGraph();
  console.log('GraphService.getGraph() result:', JSON.stringify(graphData, null, 2));
  
  res.json({
    debug: true,
    exampleData: exampleData,
    graphData: graphData,
    timestamp: new Date().toISOString()
  });
};
