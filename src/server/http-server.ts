import express, { Request, Response } from 'express';
import path from 'path';
import { createServer } from 'http';
import routes from './routes';
import { websocketService } from './services/websocketService';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Middleware
app.use(express.json());

// CORS middleware
app.use((req: Request, res: Response, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
    );
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
        message: 'Endpoint not found',
    });
});

// Error handler
app.use((error: Error, req: Request, res: Response, next: any) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
websocketService.initialize(server);

// Start HTTP server
server.listen(PORT, () => {
    console.log(`HTTP Server running at http://localhost:${PORT}`);
    console.log(`WebSocket server available at ws://localhost:${PORT}/ws`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    websocketService.shutdown();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    websocketService.shutdown();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;
