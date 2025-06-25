import axios, { AxiosInstance, AxiosResponse } from 'axios';

/**
 * HTTP client for making requests to the particles HTTP server
 */
class ParticlesHttpClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * GET /data - Retrieve all stored particle data
   */
  async getAllParticles(): Promise<any> {
    const response = await this.client.get('/data');
    return response.data;
  }

  /**
   * POST /data - Update the stored particle data
   */
  async updateParticles(data: any): Promise<any> {
    const response = await this.client.post('/data', data);
    return response.data;
  }

  /**
   * GET /example - Get example particle data
   */
  async getExampleData(): Promise<any> {
    const response = await this.client.get('/example');
    return response.data;
  }

  /**
   * POST /particle/:key - Add or update a single particle
   */
  async addParticle(key: string, particle: any): Promise<any> {
    const response = await this.client.post(`/particle/${key}`, particle);
    return response.data;
  }

  /**
   * GET /particle/:key - Get a specific particle
   */
  async getParticle(key: string): Promise<any> {
    try {
      const response = await this.client.get(`/particle/${key}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { success: false, message: 'Particle not found' };
      }
      throw error;
    }
  }

  /**
   * DELETE /particle/:key - Delete a specific particle
   */
  async deleteParticle(key: string): Promise<any> {
    try {
      const response = await this.client.delete(`/particle/${key}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { success: false, message: 'Particle not found' };
      }
      throw error;
    }
  }

  /**
   * DELETE /data - Clear all particle data
   */
  async clearAllParticles(): Promise<any> {
    const response = await this.client.delete('/data');
    return response.data;
  }

  /**
   * GET /stats - Get particle statistics
   */
  async getStats(): Promise<any> {
    const response = await this.client.get('/stats');
    return response.data;
  }

  // New graph-based methods

  /**
   * GET /graph - Get complete graph data
   */
  async getGraph(): Promise<any> {
    const response = await this.client.get('/graph');
    return response.data;
  }

  /**
   * POST /graph - Update complete graph data
   */
  async updateGraph(graphData: any): Promise<any> {
    const response = await this.client.post('/graph', graphData);
    return response.data;
  }

  /**
   * POST /edge - Add a new edge
   */
  async addEdge(source: string, target: string, options: any = {}): Promise<any> {
    const response = await this.client.post('/edge', {
      source,
      target,
      ...options
    });
    return response.data;
  }

  /**
   * DELETE /edge/:edgeId - Remove an edge
   */
  async removeEdge(edgeId: string): Promise<any> {
    try {
      const response = await this.client.delete(`/edge/${edgeId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { success: false, message: 'Edge not found' };
      }
      throw error;
    }
  }

  /**
   * GET /node/:key/edges - Get all edges for a specific node
   */
  async getNodeEdges(nodeKey: string): Promise<any> {
    const response = await this.client.get(`/node/${nodeKey}/edges`);
    return response.data;
  }

  /**
   * GET /edges/:nodeA/:nodeB - Get edges between two specific nodes
   */
  async getEdgesBetween(nodeA: string, nodeB: string): Promise<any> {
    const response = await this.client.get(`/edges/${nodeA}/${nodeB}`);
    return response.data;
  }

  /**
   * GET /graph/stats - Get detailed graph statistics
   */
  async getGraphStats(): Promise<any> {
    const response = await this.client.get('/graph/stats');
    return response.data;
  }

  /**
   * Check if the HTTP server is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/stats');
      return true;
    } catch (error: any) {
      console.error(`HTTP server not reachable at ${this.baseURL}:`, error.message);
      return false;
    }
  }
}

// Create and export a singleton instance
export const httpClient = new ParticlesHttpClient(
  process.env.PARTICLES_HTTP_URL || 'http://localhost:3001'
);
