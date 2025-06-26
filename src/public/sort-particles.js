// Grid-based particle sorting algorithm
// Arranges particles in clusters with connection-based hierarchy

export class ParticleSorter {
    constructor(canvas) {
        this.canvas = canvas;
        this.isAnimating = false;
        this.animationSpeed = 0.05; // Faster than shuffle (0.02)
        this.nodeSpacing = 300; // Fixed spacing between nodes
        this.clusterSpacing = 600; // Spacing between clusters
        this.topMargin = 80; // Top margin to account for buttons
        this.leftMargin = 30; // Left margin
        this.diagonalOffset = 30; // Vertical offset for diagonal staircase effect
    }

    /**
     * Detect connected components (clusters) in the particle graph
     * @param {Map} particles - Map of particles
     * @returns {Array} - Array of clusters, each containing an array of particle keys
     */
    detectClusters(particles) {
        const visited = new Set();
        const clusters = [];
        
        // Helper function for depth-first search
        const dfs = (nodeKey, currentCluster) => {
            if (visited.has(nodeKey)) return;
            
            visited.add(nodeKey);
            currentCluster.push(nodeKey);
            
            const particle = particles.get(nodeKey);
            if (particle && particle.edges) {
                for (const edge of particle.edges) {
                    if (particles.has(edge.key) && !visited.has(edge.key)) {
                        dfs(edge.key, currentCluster);
                    }
                }
            }
        };
        
        // Find all connected components
        for (const [key] of particles) {
            if (!visited.has(key)) {
                const cluster = [];
                dfs(key, cluster);
                if (cluster.length > 0) {
                    clusters.push(cluster);
                }
            }
        }
        
        return clusters;
    }

    /**
     * Calculate total connection count for a cluster
     * @param {Array} clusterNodes - Array of node keys in the cluster
     * @param {Map} particles - Map of particles
     * @returns {number} - Total connection count for the cluster
     */
    calculateClusterConnectionCount(clusterNodes, particles) {
        let totalConnections = 0;
        for (const nodeKey of clusterNodes) {
            const particle = particles.get(nodeKey);
            if (particle && particle.edges) {
                totalConnections += particle.edges.length;
            }
        }
        return totalConnections;
    }

    /**
     * Sort clusters by their total connection count (descending)
     * @param {Array} clusters - Array of clusters
     * @param {Map} particles - Map of particles
     * @returns {Array} - Sorted clusters
     */
    sortClustersByConnectionCount(clusters, particles) {
        return clusters.sort((a, b) => {
            const aConnections = this.calculateClusterConnectionCount(a, particles);
            const bConnections = this.calculateClusterConnectionCount(b, particles);
            return bConnections - aConnections; // Descending order
        });
    }

    /**
     * Group nodes within a cluster by their connection count
     * @param {Array} clusterNodes - Array of node keys in the cluster
     * @param {Map} particles - Map of particles
     * @returns {Array} - Array of connection levels, each containing nodes with same connection count
     */
    groupNodesByConnectionCount(clusterNodes, particles) {
        // Create a map of connection count to nodes
        const connectionGroups = new Map();
        
        for (const nodeKey of clusterNodes) {
            const particle = particles.get(nodeKey);
            const connectionCount = particle && particle.edges ? particle.edges.length : 0;
            
            if (!connectionGroups.has(connectionCount)) {
                connectionGroups.set(connectionCount, []);
            }
            connectionGroups.get(connectionCount).push(nodeKey);
        }
        
        // Sort by connection count (descending) and return as array
        const sortedConnectionCounts = Array.from(connectionGroups.keys()).sort((a, b) => b - a);
        return sortedConnectionCounts.map(count => connectionGroups.get(count));
    }

    /**
     * Calculate grid positions for all particles
     * @param {Map} particles - Map of particles
     * @returns {Map} - Map of particle keys to target positions
     */
    calculateGridPositions(particles) {
        const positions = new Map();
        
        // Detect and sort clusters
        const clusters = this.detectClusters(particles);
        const sortedClusters = this.sortClustersByConnectionCount(clusters, particles);
        
        console.log(`Detected ${clusters.length} clusters for grid sorting`);
        
        let currentClusterX = this.leftMargin;
        
        for (const cluster of sortedClusters) {
            // Group nodes in this cluster by connection count
            const connectionLevels = this.groupNodesByConnectionCount(cluster, particles);
            
            // Calculate cluster width to determine next cluster position
            let maxNodesInLevel = Math.max(...connectionLevels.map(level => level.length));
            let clusterWidth = maxNodesInLevel * this.nodeSpacing;
            
            // Position nodes in this cluster
            let currentY = this.topMargin;
            
            for (const level of connectionLevels) {
                // Start each level at the leftmost position of the cluster (no centering)
                const levelStartX = currentClusterX;
                
                // Position each node in this level with diagonal staircase effect
                for (let i = 0; i < level.length; i++) {
                    const nodeKey = level[i];
                    const x = levelStartX + (i * this.nodeSpacing);
                    const y = currentY + (i * this.diagonalOffset); // Add diagonal offset for staircase effect
                    
                    // Only clamp Y position to stay within canvas bounds, allow X to extend beyond
                    const particle = particles.get(nodeKey);
                    const radius = particle ? particle.radius : 20;
                    const clampedY = Math.max(radius, Math.min(this.canvas.height - radius, y));
                    
                    positions.set(nodeKey, { x: x, y: clampedY });
                }
                
                // Move to next level (row)
                currentY += this.nodeSpacing;
            }
            
            // Move to next cluster position
            currentClusterX += clusterWidth + this.clusterSpacing;
        }
        
        return positions;
    }

    /**
     * Animate particles to their target positions
     * @param {Map} particles - Map of particles
     * @param {Map} targets - Map of target positions
     * @param {Function} updateCallback - Callback to trigger redraw
     */
    animateToTargets(particles, targets, updateCallback) {
        return new Promise((resolve) => {
            const animate = () => {
                let allReachedTarget = true;
                
                for (const [key, particle] of particles) {
                    const target = targets.get(key);
                    if (!target) continue;
                    
                    const dx = target.x - particle.x;
                    const dy = target.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Check if particle is close enough to target
                    if (distance > 1) {
                        allReachedTarget = false;
                        
                        // Move particle toward target
                        particle.x += dx * this.animationSpeed;
                        particle.y += dy * this.animationSpeed;
                    } else {
                        // Snap to target if very close
                        particle.x = target.x;
                        particle.y = target.y;
                    }
                }
                
                // Trigger redraw
                if (updateCallback) {
                    updateCallback();
                }
                
                // Continue animation or resolve
                if (allReachedTarget) {
                    resolve();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        });
    }

    /**
     * Start the sorting process
     * @param {Map} particles - Map of particles to sort
     * @param {Function} updateCallback - Callback to trigger redraw
     * @param {Function} serverUpdateCallback - Callback to update server
     */
    async startSorting(particles, updateCallback, serverUpdateCallback) {
        if (this.isAnimating) {
            console.log('Sorting already in progress');
            return;
        }
        
        console.log('Starting particle grid sorting...');
        this.isAnimating = true;
        
        // Calculate target positions
        const targets = this.calculateGridPositions(particles);
        
        // Animate particles to their target positions
        await this.animateToTargets(particles, targets, updateCallback);
        
        // Update server with final positions
        if (serverUpdateCallback) {
            for (const [key, particle] of particles) {
                await serverUpdateCallback(key, particle);
            }
        }
        
        this.isAnimating = false;
        console.log('Particle grid sorting completed');
    }

    /**
     * Stop the current sorting animation
     */
    stopSorting() {
        this.isAnimating = false;
    }

    /**
     * Check if sorting is currently in progress
     * @returns {boolean}
     */
    isSorting() {
        return this.isAnimating;
    }
}
