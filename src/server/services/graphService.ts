import { GraphData, Node, Edge, EdgeOptions, ApiResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { websocketService } from './websocketService';
import * as fs from 'fs/promises';
import * as path from 'path';

export class GraphService {
    private graphData: GraphData = { nodes: {}, edges: {} };
    private dataFilePath: string;

    constructor() {
        // Set the path to the data file in the project root
        this.dataFilePath = path.join(process.cwd(), 'job&data.json');
        // Note: Not automatically loading data file on startup
        // Use loadDataFromFile() method if you want to manually load existing data
    }

    /**
     * Load data from the job&data.json file
     */
    async loadDataFromFile(): Promise<void> {
        try {
            const data = await fs.readFile(this.dataFilePath, 'utf-8');
            const parsedData = JSON.parse(data);
            
            // Validate the structure
            if (parsedData && typeof parsedData === 'object' && 
                parsedData.nodes && parsedData.edges) {
                this.graphData = parsedData;
                console.log(`Loaded ${Object.keys(this.graphData.nodes).length} nodes and ${Object.keys(this.graphData.edges).length} edges from ${this.dataFilePath}`);
            } else {
                console.warn('Invalid data structure in data file, using empty graph');
            }
        } catch (error) {
            console.log(`No existing data file found at ${this.dataFilePath}, starting with empty graph`);
        }
    }

    /**
     * Save current data to the job&data.json file
     */
    private async saveDataToFile(): Promise<void> {
        try {
            await fs.writeFile(this.dataFilePath, JSON.stringify(this.graphData, null, 2));
            console.log(`Saved graph data to ${this.dataFilePath}`);
        } catch (error) {
            console.error('Failed to save data to file:', error);
        }
    }

    /**
     * Get the complete graph data
     */
    getGraph(): GraphData {
        return this.graphData;
    }

    /**
     * Update the entire graph data
     */
    updateGraph(data: GraphData): ApiResponse {
        try {
            this.graphData = data;

            // Save to file
            this.saveDataToFile();

            // Notify WebSocket clients of bulk update
            websocketService.notifyDataChange('bulk_update', this.graphData);

            return { success: true };
        } catch (error) {
            console.error('Error updating graph:', error);
            return {
                success: false,
                message: 'Failed to update graph data',
            };
        }
    }

    /**
     * Add or update a node
     */
    addNode(key: string, node: Node): ApiResponse {
        try {
            const isUpdate = this.graphData.nodes[key] !== undefined;
            this.graphData.nodes[key] = node;

            // Save to file
            this.saveDataToFile();

            // Notify WebSocket clients of node change
            websocketService.notifyDataChange(
                isUpdate ? 'update' : 'add',
                this.graphData,
                key
            );

            return { success: true };
        } catch (error) {
            console.error('Error adding node:', error);
            return {
                success: false,
                message: 'Failed to add node',
            };
        }
    }

    /**
     * Get a specific node by key
     */
    getNode(key: string): Node | null {
        return this.graphData.nodes[key] || null;
    }

    /**
     * Remove a node and all its connected edges
     */
    removeNode(key: string): ApiResponse {
        try {
            if (!this.graphData.nodes[key]) {
                return {
                    success: false,
                    message: 'Node not found',
                };
            }

            // Remove the node
            delete this.graphData.nodes[key];

            // Remove all edges connected to this node
            const edgesToRemove = Object.keys(this.graphData.edges).filter(
                (edgeId) => {
                    const edge = this.graphData.edges[edgeId];
                    return edge.source === key || edge.target === key;
                }
            );

            edgesToRemove.forEach((edgeId) => {
                delete this.graphData.edges[edgeId];
            });

            // Save to file
            this.saveDataToFile();

            // Notify WebSocket clients of node deletion
            websocketService.notifyDataChange('delete', this.graphData, key);

            return { success: true };
        } catch (error) {
            console.error('Error removing node:', error);
            return {
                success: false,
                message: 'Failed to remove node',
            };
        }
    }

    /**
     * Add an edge between two nodes
     */
    addEdge(source: string, target: string, options: EdgeOptions = {}): string {
        const edgeId = uuidv4();

        const edge: Edge = {
            id: edgeId,
            source,
            target,
            label: options.label || '',
            directed: options.directed !== undefined ? options.directed : true,
            weight: options.weight,
            metadata: options.metadata,
        };

        this.graphData.edges[edgeId] = edge;

        // Save to file
        this.saveDataToFile();

        return edgeId;
    }

    /**
     * Remove an edge by ID
     */
    removeEdge(edgeId: string): boolean {
        if (this.graphData.edges[edgeId]) {
            delete this.graphData.edges[edgeId];
            
            // Save to file
            this.saveDataToFile();
            
            return true;
        }
        return false;
    }

    /**
     * Get all edges for a specific node
     */
    getNodeEdges(nodeKey: string): Edge[] {
        return Object.values(this.graphData.edges).filter(
            (edge) => edge.source === nodeKey || edge.target === nodeKey
        );
    }

    /**
     * Get edges between two specific nodes
     */
    getEdgesBetween(nodeA: string, nodeB: string): Edge[] {
        return Object.values(this.graphData.edges).filter(
            (edge) =>
                (edge.source === nodeA && edge.target === nodeB) ||
                (edge.source === nodeB && edge.target === nodeA)
        );
    }

    /**
     * Remove all edges connected to a node
     */
    removeNodeEdges(nodeKey: string): number {
        const edgesToRemove = Object.keys(this.graphData.edges).filter(
            (edgeId) => {
                const edge = this.graphData.edges[edgeId];
                return edge.source === nodeKey || edge.target === nodeKey;
            }
        );

        edgesToRemove.forEach((edgeId) => {
            delete this.graphData.edges[edgeId];
        });

        if (edgesToRemove.length > 0) {
            // Save to file
            this.saveDataToFile();
        }

        return edgesToRemove.length;
    }

    /**
     * Get graph statistics
     */
    getStats(): { nodeCount: number; edgeCount: number } {
        return {
            nodeCount: Object.keys(this.graphData.nodes).length,
            edgeCount: Object.keys(this.graphData.edges).length,
        };
    }

    /**
     * Clear all graph data
     */
    clearAll(): ApiResponse {
        try {
            this.graphData = { nodes: {}, edges: {} };

            // Save to file
            this.saveDataToFile();

            // Notify WebSocket clients of data clear
            websocketService.notifyDataChange('clear', this.graphData);

            return { success: true };
        } catch (error) {
            console.error('Error clearing graph:', error);
            return {
                success: false,
                message: 'Failed to clear graph data',
            };
        }
    }

    /**
     * Get example graph data
     */
    getExampleData(): GraphData {
        const exampleGraph: GraphData = {
            nodes: {
                root: {
                    x: 100,
                    y: 150,
                    color: 'lime',
                    title: 'Example Node',
                    radius: 20,
                    data: {
                        type: 'root',
                        description: 'This is the main node',
                        metadata: {
                            created: '2025-01-01',
                            importance: 'high',
                        },
                    },
                },
                child1: {
                    x: 200,
                    y: 100,
                    color: 'blue',
                    title: 'Child Node 1',
                    radius: 15,
                    data: {
                        type: 'child',
                        value: 42,
                        tags: ['important', 'active'],
                    },
                },
                child2: {
                    x: 200,
                    y: 200,
                    color: 'red',
                    title: 'Child Node 2',
                    radius: 15,
                    data: {
                        type: 'child',
                        status: 'inactive',
                        properties: {
                            weight: 0.8,
                            priority: 'low',
                        },
                    },
                },
            },
            edges: {
                [uuidv4()]: {
                    id: uuidv4(),
                    source: 'root',
                    target: 'child1',
                    label: 'Talks to',
                    directed: true,
                },
                [uuidv4()]: {
                    id: uuidv4(),
                    source: 'root',
                    target: 'child2',
                    label: 'Related to',
                    directed: true,
                },
            },
        };

        return exampleGraph;
    }
}

// Create a singleton instance
export const graphService = new GraphService();