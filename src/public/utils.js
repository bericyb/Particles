const FULL_CIRCLE = (Math.PI / 180) * 360

// Function to calculate node color based on edge count
// Blue (#3b82f6) to Purple (#8b5cf6) gradient matching button colors
function calculateNodeColor(edgeCount, maxEdges = 10) {
	// Normalize edge count to 0-1 range
	const normalizedCount = Math.min(edgeCount / maxEdges, 1);
	
	// Button colors: Blue (#3b82f6) to Purple (#8b5cf6)
	const blueColor = { r: 59, g: 130, b: 246 };   // #3b82f6
	const purpleColor = { r: 139, g: 92, b: 246 }; // #8b5cf6
	
	// Interpolate between blue and purple based on edge count
	const r = Math.round(blueColor.r + (purpleColor.r - blueColor.r) * normalizedCount);
	const g = Math.round(blueColor.g + (purpleColor.g - blueColor.g) * normalizedCount);
	const b = Math.round(blueColor.b + (purpleColor.b - blueColor.b) * normalizedCount);
	
	return `rgb(${r}, ${g}, ${b})`;
}

export function addRandomParticles(particles, radius, numParticles) {
	for (var i = 0; i < numParticles; i++) {
		particles.set(i, {
			x: Math.random() * window.innerWidth,
			y: Math.random() * window.innerHeight,
			title: "temp",
			radius: radius,
			edges: [{ key: i + 1, label: "Talks to" }],
			// edges: [],
		})
	}
	return particles
}

// Helper function to calculate appropriate font size based on node radius
function calculateFontSize(radius) {
	// Scale font size proportionally with radius, with min/max bounds for readability
	return Math.max(8, Math.min(24, radius * 0.7));
}

// Helper function to set font with calculated size
function setScaledFont(ctx, radius) {
	const fontSize = calculateFontSize(radius);
	ctx.font = `${fontSize}px 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`;
}

export function drawParticles(ctx, particles, showNodeLabels = true, showEdgeLabels = true) {
	// Set default text alignment
	ctx.textAlign = "center"

	// Draw using GraphData format: {nodes: {}, edges: {}}
	drawGraph(ctx, particles, showNodeLabels, showEdgeLabels);
}

function drawGraph(ctx, graphData, showNodeLabels = true, showEdgeLabels = true) {
	const { nodes, edges } = graphData;

	// Calculate maximum edge count for better color distribution
	let maxEdges = 1;
	for (const [nodeKey, node] of Object.entries(nodes)) {
		const edgeCount = Object.values(edges).filter(edge => 
			edge.source === nodeKey || edge.target === nodeKey
		).length;
		maxEdges = Math.max(maxEdges, edgeCount);
	}

	// Draw edges first (so they appear behind nodes)
	for (const [edgeId, edge] of Object.entries(edges)) {
		const sourceNode = nodes[edge.source];
		const targetNode = nodes[edge.target];
		
		if (sourceNode && targetNode) {
			ctx.beginPath();
			ctx.strokeStyle = edge.directed ? "gray" : "lightblue";
			ctx.lineWidth = edge.weight ? Math.max(1, edge.weight) : 1;
			ctx.moveTo(sourceNode.x, sourceNode.y);
			ctx.lineTo(targetNode.x, targetNode.y);
			ctx.stroke();

			// Draw edge label if it exists and edge labels are enabled
			if (showEdgeLabels && edge.label) {
				const halfwayX = sourceNode.x + (targetNode.x - sourceNode.x) / 2;
				const halfwayY = sourceNode.y + (targetNode.y - sourceNode.y) / 2;
				ctx.fillStyle = "white";
				ctx.fillText(edge.label, halfwayX, halfwayY - 10);
			}

			// Draw arrow for directed edges
			if (edge.directed) {
				drawArrow(ctx, sourceNode, targetNode);
			}
		}
	}

	// Draw nodes
	for (const [nodeKey, node] of Object.entries(nodes)) {
		// Calculate dynamic color based on edge count
		const edgeCount = Object.values(edges).filter(edge => 
			edge.source === nodeKey || edge.target === nodeKey
		).length;
		const dynamicColor = node.color || calculateNodeColor(edgeCount, maxEdges);
		
		ctx.beginPath();
		ctx.arc(node.x, node.y, node.radius, 0, FULL_CIRCLE, 1);
		ctx.fillStyle = dynamicColor;
		ctx.fill();
		
		// Draw node label if node labels are enabled
		if (showNodeLabels) {
			// Set font size based on node radius
			setScaledFont(ctx, node.radius);
			ctx.fillStyle = "white";
			// Use node title if available, fallback to nodeKey
			const displayLabel = node.title || nodeKey;
			ctx.fillText(displayLabel, node.x, node.y - node.radius * 1.4);
		}
	}
}


function drawArrow(ctx, sourceNode, targetNode) {
	const angle = Math.atan2(targetNode.y - sourceNode.y, targetNode.x - sourceNode.x);
	const arrowLength = 15;
	const arrowAngle = Math.PI / 6;
	
	// Calculate arrow position (at edge of target node)
	const arrowX = targetNode.x - Math.cos(angle) * targetNode.radius;
	const arrowY = targetNode.y - Math.sin(angle) * targetNode.radius;
	
	ctx.beginPath();
	ctx.moveTo(arrowX, arrowY);
	ctx.lineTo(
		arrowX - arrowLength * Math.cos(angle - arrowAngle),
		arrowY - arrowLength * Math.sin(angle - arrowAngle)
	);
	ctx.moveTo(arrowX, arrowY);
	ctx.lineTo(
		arrowX - arrowLength * Math.cos(angle + arrowAngle),
		arrowY - arrowLength * Math.sin(angle + arrowAngle)
	);
	ctx.stroke();
}
