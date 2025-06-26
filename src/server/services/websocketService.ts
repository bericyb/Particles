import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { GraphData } from '../types';

export interface WebSocketMessage {
    type: 'data_changed' | 'connection_established' | 'heartbeat';
    operation?: 'add' | 'update' | 'delete' | 'clear' | 'bulk_update';
    data?: GraphData;
    nodeKey?: string;
    timestamp: number;
}

export class WebSocketService {
    private wss: WebSocketServer | null = null;
    private clients: Set<WebSocket> = new Set();
    private heartbeatInterval: NodeJS.Timeout | null = null;

    /**
     * Initialize WebSocket server
     */
    initialize(server: Server): void {
        this.wss = new WebSocketServer({
            server,
            path: '/ws',
        });

        this.wss.on('connection', (ws: WebSocket) => {
            console.log('New WebSocket client connected');
            this.clients.add(ws);

            // Send connection established message
            this.sendToClient(ws, {
                type: 'connection_established',
                timestamp: Date.now(),
            });

            // Handle client messages
            ws.on('message', (data: Buffer) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleClientMessage(ws, message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            });

            // Handle client disconnect
            ws.on('close', () => {
                console.log('WebSocket client disconnected');
                this.clients.delete(ws);
            });

            // Handle errors
            ws.on('error', (error) => {
                console.error('WebSocket client error:', error);
                this.clients.delete(ws);
            });
        });

        // Start heartbeat to keep connections alive
        this.startHeartbeat();

        console.log('WebSocket server initialized on /ws');
    }

    /**
     * Handle messages from clients
     */
    private handleClientMessage(ws: WebSocket, message: any): void {
        switch (message.type) {
            case 'heartbeat':
                // Respond to heartbeat
                this.sendToClient(ws, {
                    type: 'heartbeat',
                    timestamp: Date.now(),
                });
                break;
            default:
                console.log('Unknown message type from client:', message.type);
        }
    }

    /**
     * Send message to a specific client
     */
    private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
        if (ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(message));
            } catch (error) {
                console.error('Error sending message to client:', error);
                this.clients.delete(ws);
            }
        }
    }

    /**
     * Broadcast message to all connected clients
     */
    private broadcast(message: WebSocketMessage): void {
        const deadClients: WebSocket[] = [];

        this.clients.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(JSON.stringify(message));
                } catch (error) {
                    console.error('Error broadcasting to client:', error);
                    deadClients.push(ws);
                }
            } else {
                deadClients.push(ws);
            }
        });

        // Clean up dead connections
        deadClients.forEach((ws) => {
            this.clients.delete(ws);
        });
    }

    /**
     * Notify clients of data changes
     */
    notifyDataChange(
        operation: 'add' | 'update' | 'delete' | 'clear' | 'bulk_update',
        data: GraphData,
        nodeKey?: string
    ): void {
        const message: WebSocketMessage = {
            type: 'data_changed',
            operation,
            data,
            nodeKey,
            timestamp: Date.now(),
        };

        console.log(
            `Broadcasting data change: ${operation}${
                nodeKey ? ` (${nodeKey})` : ''
            }`
        );
        this.broadcast(message);
    }

    /**
     * Start heartbeat to keep connections alive
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            this.broadcast({
                type: 'heartbeat',
                timestamp: Date.now(),
            });
        }, 30000); // Send heartbeat every 30 seconds
    }

    /**
     * Stop heartbeat and close all connections
     */
    shutdown(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        this.clients.forEach((ws) => {
            ws.close();
        });
        this.clients.clear();

        if (this.wss) {
            this.wss.close();
            this.wss = null;
        }

        console.log('WebSocket service shut down');
    }

    /**
     * Get number of connected clients
     */
    getClientCount(): number {
        return this.clients.size;
    }
}

// Create singleton instance
export const websocketService = new WebSocketService();
