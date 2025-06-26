// Centrality-based particle shuffling algorithm
// Moves nodes with higher connections toward center, lower connections toward edges

export class ParticleShuffler {
    constructor(canvas) {
        this.canvas = canvas;
        this.isAnimating = false;
        this.animationSpeed = 0.15; // Controls how fast particles move to target positions (increased from 0.02)
        this.centerForceStrength = 0.8; // How strongly high-centrality nodes are pulled to center
        this.edgeForceStrength = 0.6; // How strongly low-centrality nodes are pushed to edges
        this.repulsionStrength = 50; // Node-to-node repulsion to prevent overlap
        this.minRadius = 100; // Minimum distance from center for any node
        this.maxRadius = null; // Will be calculated based on canvas size
        
        // New cluster separation properties
        this.clusterSeparationDistance = 400; // Minimum distance between cluster centers
        this.clusterBoundaryPadding = 80; // Buffer space around each cluster
        this.interClusterRepulsion = 200; // Force strength between different clusters
        this.enableClusterSeparation = true; // Toggle cluster separation feature
        
        // Animation control
        this.shouldStop = false; // Flag to interrupt current animation
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
     * Calculate optimal positions for cluster centers
     * @param {Array} clusters - Array of clusters
     * @returns {Array} - Array of cluster center positions {x, y}
     */
    calculateClusterCenters(clusters) {
        const centers = [];
        const numClusters = clusters.length;
        
        // Calculate safe boundaries for cluster centers (accounting for cluster radius)
        const maxClusterRadius = this.minRadius * 2; // Conservative estimate
        const safeMargin = maxClusterRadius + 50; // Extra padding
        const safeBounds = {
            minX: safeMargin,
            maxX: this.canvas.width - safeMargin,
            minY: safeMargin,
            maxY: this.canvas.height - safeMargin
        };
        
        if (numClusters === 1) {
            // Single cluster - center it on the canvas
            centers.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 2
            });
        } else if (numClusters === 2) {
            // Two clusters - position them on opposite sides
            const centerY = this.canvas.height / 2;
            const maxSeparation = safeBounds.maxX - safeBounds.minX;
            const separation = Math.min(this.clusterSeparationDistance, maxSeparation * 0.6);
            
            const leftX = Math.max(safeBounds.minX, this.canvas.width / 2 - separation / 2);
            const rightX = Math.min(safeBounds.maxX, this.canvas.width / 2 + separation / 2);
            
            centers.push({ x: leftX, y: centerY });
            centers.push({ x: rightX, y: centerY });
        } else {
            // Multiple clusters - distribute them in a circle or grid pattern
            const canvasCenter = {
                x: this.canvas.width / 2,
                y: this.canvas.height / 2
            };
            
            // Calculate radius for cluster center distribution (more conservative)
            const maxDistributionRadius = Math.min(
                (safeBounds.maxX - safeBounds.minX) / 2,
                (safeBounds.maxY - safeBounds.minY) / 2
            );
            const distributionRadius = Math.min(
                maxDistributionRadius,
                Math.min(this.canvas.width, this.canvas.height) * 0.25
            );
            
            if (numClusters <= 6) {
                // Circular distribution for small number of clusters
                const angleStep = (2 * Math.PI) / numClusters;
                for (let i = 0; i < numClusters; i++) {
                    const angle = i * angleStep;
                    const x = canvasCenter.x + Math.cos(angle) * distributionRadius;
                    const y = canvasCenter.y + Math.sin(angle) * distributionRadius;
                    
                    // Ensure center is within safe bounds
                    centers.push({
                        x: Math.max(safeBounds.minX, Math.min(safeBounds.maxX, x)),
                        y: Math.max(safeBounds.minY, Math.min(safeBounds.maxY, y))
                    });
                }
            } else {
                // Grid distribution for many clusters
                const cols = Math.ceil(Math.sqrt(numClusters));
                const rows = Math.ceil(numClusters / cols);
                const cellWidth = (safeBounds.maxX - safeBounds.minX) / cols;
                const cellHeight = (safeBounds.maxY - safeBounds.minY) / rows;
                
                for (let i = 0; i < numClusters; i++) {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    centers.push({
                        x: safeBounds.minX + (col + 0.5) * cellWidth,
                        y: safeBounds.minY + (row + 0.5) * cellHeight
                    });
                }
            }
        }
        
        return centers;
    }

    /**
     * Calculate the effective radius for a cluster based on its size
     * @param {Array} clusterNodes - Array of node keys in the cluster
     * @param {Map} particles - Map of particles
     * @returns {number} - Effective radius for the cluster
     */
    calculateClusterRadius(clusterNodes, particles) {
        const baseRadius = this.minRadius;
        const sizeMultiplier = Math.sqrt(clusterNodes.length) * 0.5;
        return Math.max(baseRadius, baseRadius * sizeMultiplier);
    }

    /**
     * Calculate degree centrality for each particle
     * @param {Map} particles - Map of particles
     * @returns {Map} - Map of particle keys to centrality scores
     */
    calculateCentrality(particles) {
        const centrality = new Map();
        
        for (const [key, particle] of particles) {
            const edgeCount = particle.edges ? particle.edges.length : 0;
            centrality.set(key, edgeCount);
        }
        
        return centrality;
    }

    /**
     * Calculate target positions based on centrality and cluster separation
     * @param {Map} particles - Map of particles
     * @param {Map} centrality - Map of centrality scores
     * @returns {Map} - Map of particle keys to target positions
     */
    calculateTargetPositions(particles, centrality) {
        const targets = new Map();
        
        if (!this.enableClusterSeparation) {
            // Use original single-cluster algorithm
            return this.calculateSingleClusterTargets(particles, centrality);
        }
        
        // Detect clusters
        const clusters = this.detectClusters(particles);
        console.log(`Detected ${clusters.length} clusters:`, clusters.map(c => c.length));
        
        // Check if we should use single cluster algorithm
        // Use single cluster if: only 1 cluster, OR 1 large cluster + only isolated nodes
        const shouldUseSingleCluster = clusters.length === 1 || 
            (clusters.length > 1 && clusters.filter(c => c.length > 1).length === 1);
        
        if (shouldUseSingleCluster) {
            // Single cluster or one main cluster with isolated nodes - use original algorithm
            return this.calculateSingleClusterTargets(particles, centrality);
        }
        
        // Multiple clusters - calculate positions for each cluster
        const clusterCenters = this.calculateClusterCenters(clusters);
        
        clusters.forEach((clusterNodes, clusterIndex) => {
            const clusterCenter = clusterCenters[clusterIndex];
            const clusterRadius = this.calculateClusterRadius(clusterNodes, particles);
            
            // Calculate centrality within this cluster
            const clusterCentrality = new Map();
            const clusterParticles = new Map();
            
            for (const nodeKey of clusterNodes) {
                const particle = particles.get(nodeKey);
                clusterParticles.set(nodeKey, particle);
                clusterCentrality.set(nodeKey, centrality.get(nodeKey) || 0);
            }
            
            // Calculate positions within cluster boundary
            const clusterTargets = this.calculateClusterLocalTargets(
                clusterParticles, 
                clusterCentrality, 
                clusterCenter, 
                clusterRadius
            );
            
            // Add cluster targets to main targets map
            for (const [key, target] of clusterTargets) {
                targets.set(key, { 
                    ...target, 
                    clusterId: clusterIndex,
                    clusterCenter: clusterCenter
                });
            }
        });
        
        return targets;
    }

    /**
     * Calculate target positions for a single cluster (original algorithm)
     * @param {Map} particles - Map of particles
     * @param {Map} centrality - Map of centrality scores
     * @returns {Map} - Map of particle keys to target positions
     */
    calculateSingleClusterTargets(particles, centrality) {
        const targets = new Map();
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Calculate max radius based on canvas size, accounting for particle sizes
        const maxParticleRadius = Math.max(...Array.from(particles.values()).map(p => p.radius || 20));
        const canvasBoundary = Math.min(this.canvas.width, this.canvas.height) / 2;
        this.maxRadius = Math.max(this.minRadius + 50, canvasBoundary - maxParticleRadius - 20);
        
        // Find min and max centrality for normalization
        const centralityValues = Array.from(centrality.values());
        const minCentrality = Math.min(...centralityValues);
        const maxCentrality = Math.max(...centralityValues);
        const centralityRange = maxCentrality - minCentrality || 1; // Avoid division by zero
        
        // Group particles by centrality level for better distribution
        const centralityGroups = new Map();
        for (const [key, score] of centrality) {
            if (!centralityGroups.has(score)) {
                centralityGroups.set(score, []);
            }
            centralityGroups.get(score).push(key);
        }
        
        // Sort centrality levels from highest to lowest
        const sortedCentralityLevels = Array.from(centralityGroups.keys()).sort((a, b) => b - a);
        
        for (const centralityLevel of sortedCentralityLevels) {
            const particlesAtLevel = centralityGroups.get(centralityLevel);
            
            // Normalize centrality to 0-1 range (1 = highest centrality, 0 = lowest)
            const normalizedCentrality = centralityRange === 0 ? 0.5 : 
                (centralityLevel - minCentrality) / centralityRange;
            
            // Calculate target radius (high centrality = small radius, low centrality = large radius)
            // Add a small buffer to ensure nodes are positioned beyond minimum radius
            const targetRadius = this.minRadius + 10 + (this.maxRadius - this.minRadius - 10) * (1 - normalizedCentrality);
            
            // Distribute particles at this centrality level around a circle
            const angleStep = (2 * Math.PI) / particlesAtLevel.length;
            
            particlesAtLevel.forEach((key, index) => {
                const particle = particles.get(key);
                const angle = index * angleStep + Math.random() * 0.5; // Add slight randomness
                let x = centerX + Math.cos(angle) * targetRadius;
                let y = centerY + Math.sin(angle) * targetRadius;
                
                // Ensure the particle stays within canvas bounds
                const particleRadius = particle.radius || 20;
                x = Math.max(particleRadius, Math.min(this.canvas.width - particleRadius, x));
                y = Math.max(particleRadius, Math.min(this.canvas.height - particleRadius, y));
                
                targets.set(key, { x, y, radius: targetRadius });
            });
        }
        
        return targets;
    }

    /**
     * Calculate target positions within a specific cluster
     * @param {Map} clusterParticles - Map of particles in this cluster
     * @param {Map} clusterCentrality - Map of centrality scores for cluster nodes
     * @param {Object} clusterCenter - Center position {x, y} for this cluster
     * @param {number} clusterRadius - Maximum radius for this cluster
     * @returns {Map} - Map of particle keys to local target positions
     */
    calculateClusterLocalTargets(clusterParticles, clusterCentrality, clusterCenter, clusterRadius) {
        const targets = new Map();
        
        // Find min and max centrality within cluster for normalization
        const centralityValues = Array.from(clusterCentrality.values());
        const minCentrality = Math.min(...centralityValues);
        const maxCentrality = Math.max(...centralityValues);
        const centralityRange = maxCentrality - minCentrality || 1;
        
        // Group particles by centrality level
        const centralityGroups = new Map();
        for (const [key, score] of clusterCentrality) {
            if (!centralityGroups.has(score)) {
                centralityGroups.set(score, []);
            }
            centralityGroups.get(score).push(key);
        }
        
        // Sort centrality levels from highest to lowest
        const sortedCentralityLevels = Array.from(centralityGroups.keys()).sort((a, b) => b - a);
        
        // Scale the radius based on cluster size
        const minLocalRadius = Math.min(30, clusterRadius * 0.2);
        const maxLocalRadius = clusterRadius - this.clusterBoundaryPadding;
        
        for (const centralityLevel of sortedCentralityLevels) {
            const particlesAtLevel = centralityGroups.get(centralityLevel);
            
            // Normalize centrality to 0-1 range
            const normalizedCentrality = centralityRange === 0 ? 0.5 : 
                (centralityLevel - minCentrality) / centralityRange;
            
            // Calculate target radius within cluster (high centrality = small radius)
            const localRadius = minLocalRadius + (maxLocalRadius - minLocalRadius) * (1 - normalizedCentrality);
            
            // Distribute particles at this centrality level around cluster center
            const angleStep = (2 * Math.PI) / particlesAtLevel.length;
            
            particlesAtLevel.forEach((key, index) => {
                const angle = index * angleStep + Math.random() * 0.3; // Add slight randomness
                const x = clusterCenter.x + Math.cos(angle) * localRadius;
                const y = clusterCenter.y + Math.sin(angle) * localRadius;
                
                targets.set(key, { x, y, radius: localRadius });
            });
        }
        
        return targets;
    }

    /**
     * Apply repulsion forces between particles to prevent overlap
     * @param {Map} particles - Map of particles
     * @param {Map} targets - Map of target positions
     */
    applyRepulsionForces(particles, targets) {
        const keys = Array.from(particles.keys());
        const maxIterations = 5; // Reduced from 10 for faster processing
        
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            let hasOverlaps = false;
            
            for (let i = 0; i < keys.length; i++) {
                for (let j = i + 1; j < keys.length; j++) {
                    const key1 = keys[i];
                    const key2 = keys[j];
                    const particle1 = particles.get(key1);
                    const particle2 = particles.get(key2);
                    const target1 = targets.get(key1);
                    const target2 = targets.get(key2);
                    
                    if (!target1 || !target2) continue;
                    
                    const dx = target1.x - target2.x;
                    const dy = target1.y - target2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Check if particles are from different clusters
                    const differentClusters = this.enableClusterSeparation && 
                        target1.clusterId !== undefined && 
                        target2.clusterId !== undefined && 
                        target1.clusterId !== target2.clusterId;
                    
                    let repulsionForce = this.repulsionStrength;
                    let minDistance = (particle1.radius + particle2.radius) * 2.2; // Slightly increased spacing
                    
                    if (differentClusters) {
                        // Apply stronger repulsion between different clusters
                        repulsionForce = this.interClusterRepulsion;
                        minDistance = Math.max(minDistance, this.clusterSeparationDistance * 0.5);
                    }
                    
                    if (distance < minDistance) {
                        hasOverlaps = true;
                        
                        if (distance === 0) {
                            // Handle exact overlap by adding small random offset
                            const angle = Math.random() * 2 * Math.PI;
                            const offset = minDistance * 0.6;
                            target1.x += Math.cos(angle) * offset;
                            target1.y += Math.sin(angle) * offset;
                            target2.x -= Math.cos(angle) * offset;
                            target2.y -= Math.sin(angle) * offset;
                        } else {
                            const force = (minDistance - distance) / distance * repulsionForce * 0.1;
                            const forceX = dx * force;
                            const forceY = dy * force;
                            
                            target1.x += forceX;
                            target1.y += forceY;
                            target2.x -= forceX;
                            target2.y -= forceY;
                        }
                    }
                }
            }
            
            // If no overlaps detected, we can stop early
            if (!hasOverlaps) {
                break;
            }
        }
    }

    /**
     * Enforce canvas boundary constraints for all target positions
     * @param {Map} particles - Map of particles
     * @param {Map} targets - Map of target positions
     */
    enforceCanvasBounds(particles, targets) {
        for (const [key, target] of targets) {
            const particle = particles.get(key);
            if (!particle) continue;
            
            // Ensure particle stays within canvas bounds, accounting for its radius
            const minX = particle.radius;
            const maxX = this.canvas.width - particle.radius;
            const minY = particle.radius;
            const maxY = this.canvas.height - particle.radius;
            
            // Clamp position to valid bounds
            target.x = Math.max(minX, Math.min(maxX, target.x));
            target.y = Math.max(minY, Math.min(maxY, target.y));
        }
    }

    /**
     * Start the shuffling animation
     * @param {Map} particles - Map of particles to shuffle
     * @param {Function} updateCallback - Callback to trigger redraw
     * @param {Function} serverUpdateCallback - Callback to update server
     */
    async startShuffling(particles, updateCallback, serverUpdateCallback) {
        // Stop any current animation and reset flags
        this.shouldStop = false;
        this.isAnimating = true;
        
        console.log('Starting particle shuffling...');
        const startTime = performance.now();
        
        // Calculate centrality and target positions
        const centrality = this.calculateCentrality(particles);
        const targets = this.calculateTargetPositions(particles, centrality);
        
        // Apply repulsion forces to prevent overlap
        this.applyRepulsionForces(particles, targets);
        
        // Animate particles to their target positions
        const animationCompleted = await this.animateToTargets(particles, targets, updateCallback);
        
        // Only update server if animation completed successfully (wasn't interrupted)
        if (animationCompleted && serverUpdateCallback) {
            // Batch server updates for better performance
            const updatePromises = [];
            for (const [key, particle] of particles) {
                updatePromises.push(serverUpdateCallback(key, particle));
            }
            
            try {
                await Promise.all(updatePromises);
            } catch (error) {
                console.error('Error updating particles on server:', error);
            }
        }
        
        this.isAnimating = false;
        const endTime = performance.now();
        console.log(`Particle shuffling completed in ${Math.round(endTime - startTime)}ms`);
    }

    /**
     * Animate particles to their target positions
     * @param {Map} particles - Map of particles
     * @param {Map} targets - Map of target positions
     * @param {Function} updateCallback - Callback to trigger redraw
     * @returns {Promise<boolean>} - Returns true if animation completed, false if interrupted
     */
    animateToTargets(particles, targets, updateCallback) {
        return new Promise((resolve) => {
            const animate = () => {
                // Check if animation should be stopped
                if (this.shouldStop || !this.isAnimating) {
                    resolve(false); // Animation was interrupted
                    return;
                }
                
                let allReachedTarget = true;
                
                for (const [key, particle] of particles) {
                    const target = targets.get(key);
                    if (!target) continue;
                    
                    const dx = target.x - particle.x;
                    const dy = target.y - particle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Check if particle is close enough to target
                    if (distance > 2) {
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
                    resolve(true); // Animation completed successfully
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        });
    }

    /**
     * Stop the current shuffling animation
     */
    stopShuffling() {
        this.shouldStop = true;
        this.isAnimating = false;
    }

    /**
     * Check if shuffling is currently in progress
     * @returns {boolean}
     */
    isShuffling() {
        return this.isAnimating;
    }
}
