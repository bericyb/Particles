// Graph-centric types
export interface Edge {
  id: string;           // UUID for edge
  source: string;       // Source node key
  target: string;       // Target node key
  label?: string;       // Edge label
  directed: boolean;    // Direction flag
  weight?: number;      // Optional weight
  metadata?: any;       // Additional properties
}

export interface Node {
  x: number;
  y: number;
  color?: string;
  title: string;
  radius: number;
  data?: any;          // Optional data field for JSON data
}

export interface GraphData {
  nodes: { [key: string]: Node };
  edges: { [edgeId: string]: Edge };
}

export interface EdgeOptions {
  label?: string;
  directed?: boolean;
  weight?: number;
  metadata?: any;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
}
