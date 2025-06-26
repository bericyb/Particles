import { addRandomParticles, drawParticles } from "./utils.js"
import { repelAndAttract } from "./repel_attract.js"

// Define particle.radius constant for particle collision detection
const particle.radius = 20;

let treeBtn = document.getElementById("treeBtn");

let addParticleBtn = document.getElementById("addParticleBtn");
let sortParticlesBtn = document.getElementById("sortParticlesBtn");
let clearParticlesBtn = document.getElementById("clearParticlesBtn");



// Try to fetch particle data from backend, fallback to random particles
var particles = new Map();
fetch('http://localhost:3001/data')
	.then(res => {
		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status}`);
		}
		return res.json();
	})
	.then(data => {
		console.log('Fetched particle data:', data);
		
		// Check if we have any data from backend
		if (data && Object.keys(data).length > 0) {
			particles = new Map(Object.entries(data));
			console.log('Using backend particle data');
		} 
	})
	.catch(error => {
		console.warn('Failed to fetch particle data from backend:', error);
		console.log('Falling back to random particles');
		// particles = addRandomParticles(particles, 10, particle.radius);
	});

const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
});

let modalContent = {}
let modal = document.getElementById("modal");
let modalBody = document.getElementById("modalBody");

modal.addEventListener("click", (e) => {
	if (e.target === modal) {
		modal.classList.add("hidden")
	}
})

function handleClick(event) {
	const bounding = canvas.getBoundingClientRect()
	const x = (event.clientX - bounding.left - offsetX) / scale;
	const y = (event.clientY - bounding.top - offsetY) / scale;

	// Check if user clicked on a node
	for (const [key, particle] of particles) {
		if (particle.x + particle.radius >= x && particle.x - particle.radius <= x && particle.y + particle.radius >= y && particle.y - particle.radius <= y) {
			console.log("Click!")
			modalBody.innerHTML = `
				<h2>Node: ${key}</h2>
				<p>This is the inside of a node</p>
				`;
			modal.classList.remove("hidden");
			return
		}
	}
}

canvas.addEventListener("dblclick", (event) => handleClick(event, modalContent))

let scale = 1
let offsetX = 0
let offsetY = 0

let isDragging = false;
let startX, startY;
let draggingObject = null
let draggingOffset = {
	x: 0, y: 0,
}

// Debounce and server update functionality
let draggedParticleKey = null;
let originalPosition = null;
let updateTimeout = null;

// Debounce utility function
function debounce(func, delay) {
	let timeoutId;
	return function (...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func.apply(this, args), delay);
	};
}

// Server update function
async function updateParticleOnServer(particleKey, particle) {
	try {
		console.log(`Updating particle ${particleKey} on server:`, particle);
		const response = await fetch(`http://localhost:3001/particle/${particleKey}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(particle)
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		console.log('Server update successful:', result);
		
		// Clear the original position since update was successful
		originalPosition = null;
		draggedParticleKey = null;
		
	} catch (error) {
		console.error('Failed to update particle on server:', error);
		
		// Rollback to original position on error
		if (originalPosition && draggedParticleKey && particles.has(draggedParticleKey)) {
			const particle = particles.get(draggedParticleKey);
			particle.x = originalPosition.x;
			particle.y = originalPosition.y;
			console.log('Rolled back particle position due to server error');
		}
		
		// You could add user notification here
		// alert('Failed to save particle position. Position has been restored.');
	}
}

// Create debounced version of the update function
const debouncedUpdateParticle = debounce(updateParticleOnServer, 500);

canvas.addEventListener('mousedown', (e) => {
	isDragging = true
	const bounding = canvas.getBoundingClientRect()
	const x = (e.clientX - bounding.left - offsetX) / scale;
	const y = (e.clientY - bounding.top - offsetY) / scale;

	// Check if user clicked on a node
	for (let [key, particle] of particles) {
		if (particle.x + particle.radius >= x && particle.x - particle.radius <= x && particle.y + particle.radius >= y && particle.y - particle.radius <= y) {
			draggingObject = particle
			draggingOffset.x = x - particle.x
			draggingOffset.y = y - particle.y
			
			// Store the particle key and original position for server update
			draggedParticleKey = key;
			originalPosition = {
				x: particle.x,
				y: particle.y
			};
			
			return
		}
	}
	startX = e.clientX;
	startY = e.clientY;
})

canvas.addEventListener("mousemove", (e) => {
	if (draggingObject) {
		const bounding = canvas.getBoundingClientRect()
		const x = (e.clientX - bounding.left - offsetX) / scale;
		const y = (e.clientY - bounding.top - offsetY) / scale;
		draggingObject.x = x - draggingOffset.x
		draggingObject.y = y - draggingOffset.y
		return
	}
	if (!isDragging) return;

	const dx = ((e.clientX - startX) / scale)
	const dy = ((e.clientY - startY) / scale)

	offsetX += dx
	offsetY += dy

	startX = e.clientX
	startY = e.clientY
})

canvas.addEventListener("mouseup", (e) => {
	// If we were dragging a particle, trigger debounced server update
	if (draggingObject && draggedParticleKey) {
		console.log(`Particle ${draggedParticleKey} drag ended, scheduling server update`);
		debouncedUpdateParticle(draggedParticleKey, draggingObject);
	}
	
	draggingObject = null
	isDragging = false
})

canvas.addEventListener('mouseleave', () => {
	// If we were dragging a particle when mouse left canvas, trigger server update
	if (draggingObject && draggedParticleKey) {
		console.log(`Particle ${draggedParticleKey} drag ended (mouse left canvas), scheduling server update`);
		debouncedUpdateParticle(draggedParticleKey, draggingObject);
	}
	
	draggingObject = null
	isDragging = false
})

canvas.addEventListener('wheel', (e) => {
	e.preventDefault();
	const rect = canvas.getBoundingClientRect();
	const mouseX = e.clientX - rect.left;
	const mouseY = e.clientY - rect.top;

	const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
	zoomAt(mouseX, mouseY, zoomFactor);

}, { passive: false });

function zoomAt(mouseX, mouseY, zoomFactor) {
	// Convert screen (mouse) to world coords before zoom
	const worldX = (mouseX - offsetX) / scale;
	const worldY = (mouseY - offsetY) / scale;

	// Apply zoom
	scale *= zoomFactor;

	// Adjust offset so the world point under the cursor stays fixed
	offsetX = mouseX - worldX * scale;
	offsetY = mouseY - worldY * scale;
}

const ctx = canvas.getContext("2d");
ctx.fillStyle = ("green");
ctx.fillRect(10, 10, 150, 100);
function animate() {
	requestAnimationFrame(animate)
	draw()
}

animate()

function draw(timestamp) {
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	ctx.save();
	ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY)
	// repelAndAttract(canvas, particles, 10);
	drawParticles(ctx, particles);
	ctx.restore();
}
