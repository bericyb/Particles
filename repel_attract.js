const GRAVITY = 0.001

// Repel and attract
export function repelAndAttract(canvas, particles, NUM_PARTICLES) {
	for (var [key, particle] of particles) {
		var netForceX = 0
		var netForceY = 0
		for (const [_, nearParticle] of particles) {
			// Repulsive Force
			// netForceX = netForceX + ((Math.abs(particle.x - nearParticle.x) < NUM_PARTICLES * 1.5 ? (particle.x - nearParticle.x) : 0) * GRAVITY)
			// netForceY = netForceY + ((Math.abs(particle.y - nearParticle.y) < NUM_PARTICLES * 1.5 ? (particle.y - nearParticle.y) : 0) * GRAVITY)
			//
			// Attractive Force
			netForceX = netForceX - ((Math.abs(particle.x - nearParticle.x) > NUM_PARTICLES * 100 ? (particle.x - nearParticle.x) : 0) * GRAVITY)
			netForceY = netForceY - ((Math.abs(particle.y - nearParticle.y) > NUM_PARTICLES * 100 ? (particle.y - nearParticle.y) : 0) * GRAVITY)
		}
		if (particle.x < 100) {
			particle.x = 100
		}
		if (particle.x > canvas.width - 100) {
			particle.x = canvas.width - 100
		}
		particle.x = particle.x + ((netForceX > 0.5 || netForceX < -0.5) ? netForceX : 0)

		if (particle.y < 100) {
			particle.y = 100
		}
		if (particle.y > canvas.height - 100) {
			particle.y = canvas.height - 100
		}
		particle.y = particle.y + ((netForceY > 0.5 || netForceY < -0.5) ? netForceY : 0)
	}
}
