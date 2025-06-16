const FULL_CIRCLE = (Math.PI / 180) * 360

export function addRandomParticles(particles, radius, numParticles) {
	for (var i = 0; i < numParticles; i++) {
		particles.set(i, {
			x: Math.random() * window.innerWidth,
			y: Math.random() * window.innerHeight,
			color: "lime",
			title: "temp",
			radius: radius,
			edges: [{ key: i + 1, label: "Talks to" }],
			// edges: [],
		})
	}
	return particles
}

export function drawParticles(ctx, particles) {
	ctx.font = 28 + "px serif"
	ctx.textAlign = "center"

	// Draw each particle
	for (const [key, particle] of particles) {
		for (const edge of particle.edges) {
			// Draw edges
			if (particles.has(edge.key)) {
				const edgeX = particles.get(edge.key).x
				const edgeY = particles.get(edge.key).y
				ctx.beginPath();
				ctx.strokeStyle = "gray"
				ctx.moveTo(particle.x, particle.y)
				ctx.lineTo(edgeX, edgeY)

				ctx.stroke();

				// Draw label halfway along the edge
				const halfwayX = particle.x + (edgeX - particle.x) / 2
				const halfwayY = particle.y + (edgeY - particle.y) / 2
				ctx.fillText(edge.label, halfwayX, halfwayY - particle.radius)
			}
		}
		ctx.beginPath()
		ctx.arc(particle.x, particle.y, particle.radius, 0, FULL_CIRCLE, 1)
		ctx.fillStyle = (particle.color)
		ctx.fill()
		ctx.fillText(key, particle.x, particle.y - particle.radius * 1.4);
	}
}

