import { Router, Request, Response } from 'express';
import path from 'path';
import {
  getAllParticles,
  updateParticles,
  getExampleData,
  addParticle,
  getParticle,
  deleteParticle,
  clearAllParticles,
  getStats,
  getGraph,
  updateGraph,
  addEdge,
  removeEdge,
  getNodeEdges,
  getEdgesBetween,
  getGraphStats,
  debugGraphService
} from './handlers';

const router = Router();

// Legacy particle data routes (maintained for backward compatibility)
router.get('/data', getAllParticles);
router.post('/data', updateParticles);
router.delete('/data', clearAllParticles);

// Individual particle routes (legacy)
router.get('/particle/:key', getParticle);
router.post('/particle/:key', addParticle);
router.delete('/particle/:key', deleteParticle);

// New graph-based routes
router.get('/graph', getGraph);
router.post('/graph', updateGraph);
router.get('/graph/stats', getGraphStats);

// Edge management routes
router.post('/edge', addEdge);
router.delete('/edge/:edgeId', removeEdge);
router.get('/node/:key/edges', getNodeEdges);
router.get('/edges/:nodeA/:nodeB', getEdgesBetween);

// Utility routes
router.get('/example', getExampleData);
router.get('/stats', getStats);
router.get('/debug', debugGraphService);

// Serve tree.html on /tree route
router.get('/tree', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../../src/public/tree.html'));
});

export default router;
