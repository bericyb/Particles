import { addRandomParticles, drawParticles } from "./utils.js"

const RADIUS = 20;

var particles = new Map();

fetch('http://localhost:3001/data')
	.then(res => res.json())
	.then(data => {
		console.log(data)
		particles = new Map(Object.entries(data))
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
		if (particle.x + RADIUS >= x && particle.x - RADIUS <= x && particle.y + RADIUS >= y && particle.y - RADIUS <= y) {
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

canvas.addEventListener('mousedown', (e) => {
	isDragging = true
	const bounding = canvas.getBoundingClientRect()
	const x = (e.clientX - bounding.left - offsetX) / scale;
	const y = (e.clientY - bounding.top - offsetY) / scale;

	// Check if user clicked on a node
	for (let [key, particle] of particles) {
		if (particle.x + RADIUS >= x && particle.x - RADIUS <= x && particle.y + RADIUS >= y && particle.y - RADIUS <= y) {
			draggingObject = particle
			draggingOffset.x = x - particle.x
			draggingOffset.y = y - particle.y
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
	draggingObject = null
	isDragging = false
})

canvas.addEventListener('mouseleave', () => {
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
	drawParticles(ctx, particles);
	ctx.restore();
}
