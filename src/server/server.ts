import express, { Request, Response } from 'express';
import path from 'path';
import routes from './routes';
import { startMcpServer } from './mcp/mcpServer';

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());

// CORS middleware
app.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  next();
});

// Serve static files from src/public directory
app.use(express.static(path.join(__dirname, '../../src/public')));

// Use the routes
app.use('/', routes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  });
});

// Error handler
app.use((error: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`HTTP Server running at http://localhost:${PORT}`);
});

// Start MCP server if running in MCP mode
if (process.argv.includes('--mcp')) {
  startMcpServer().catch(console.error);
} else {
  console.log('To run MCP server, use: npm run mcp');
}

export default app;
