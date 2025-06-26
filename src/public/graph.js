import { addRandomParticles, drawParticles } from './utils.js';
import { repelAndAttract } from './repel_attract.js';
import { ParticleShuffler } from './shuffle-particles.js';
import { ParticleSorter } from './sort-particles.js';

// UUID v4 generator function
function generateUUID() {
    if (crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback UUID v4 implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
}

let treeBtn = document.getElementById('treeBtn');

let addParticleBtn = document.getElementById('addParticleBtn');
let sortParticlesBtn = document.getElementById('sortParticlesBtn');
let shuffleParticlesBtn = document.getElementById('shuffleParticlesBtn');
let clearParticlesBtn = document.getElementById('clearParticleBtn');
let saveMapBtn = document.getElementById('saveMapBtn');
let openMapBtn = document.getElementById('openMapBtn');
let toggleNodeLabelsBtn = document.getElementById('toggleNodeLabelsBtn');
let toggleEdgeLabelsBtn = document.getElementById('toggleEdgeLabelsBtn');

// Label visibility state
let showNodeLabels = true;
let showEdgeLabels = true;

// WebSocket connection for real-time updates
let ws = null;
let wsReconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 1000; // Start with 1 second

function connectWebSocket() {
    try {
        ws = new WebSocket('ws://localhost:3001/ws');

        ws.onopen = function (event) {
            console.log('WebSocket connected');
            wsReconnectAttempts = 0; // Reset reconnect attempts on successful connection
            showNotification('Real-time updates connected', 2000);
        };

        ws.onmessage = function (event) {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onclose = function (event) {
            console.log('WebSocket disconnected');
            ws = null;

            // Attempt to reconnect if not too many attempts
            if (wsReconnectAttempts < maxReconnectAttempts) {
                wsReconnectAttempts++;
                const delay =
                    reconnectDelay * Math.pow(2, wsReconnectAttempts - 1); // Exponential backoff
                console.log(
                    `Attempting to reconnect WebSocket in ${delay}ms (attempt ${wsReconnectAttempts}/${maxReconnectAttempts})`
                );
                setTimeout(connectWebSocket, delay);
            } else {
                console.warn('Max WebSocket reconnection attempts reached');
                showNotification(
                    'Real-time updates disconnected. Please refresh the page.',
                    5000
                );
            }
        };

        ws.onerror = function (error) {
            console.error('WebSocket error:', error);
        };
    } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        // Fall back to HTTP polling or show error message
        showNotification(
            'Failed to establish real-time connection. Using fallback mode.',
            3000
        );
    }
}

function handleWebSocketMessage(message) {
    switch (message.type) {
        case 'connection_established':
            console.log('WebSocket connection established');
            break;

        case 'data_changed':
            console.log(
                'Data changed:',
                message.operation,
                message.nodeKey || 'all'
            );

            // Update local particles data
            if (message.data) {
                particles = message.data;
                console.log('Updated particles from WebSocket:', particles);
            }

            // Show notification based on operation
            let notificationText = '';
            switch (message.operation) {
                case 'add':
                    notificationText = `Node "${message.nodeKey}" added`;
                    break;
                case 'update':
                    notificationText = `Node "${message.nodeKey}" updated`;
                    break;
                case 'delete':
                    notificationText = `Node "${message.nodeKey}" deleted`;
                    break;
                case 'clear':
                    notificationText = 'All particles cleared';
                    break;
                case 'bulk_update':
                    notificationText = 'Graph data updated';
                    break;
                default:
                    notificationText = 'Graph data changed';
            }

            showNotification(notificationText, 2000);
            break;

        case 'heartbeat':
            // Respond to server heartbeat
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(
                    JSON.stringify({
                        type: 'heartbeat',
                        timestamp: Date.now(),
                    })
                );
            }
            break;

        default:
            console.log('Unknown WebSocket message type:', message.type);
    }
}

// Initialize WebSocket connection
connectWebSocket();

// Fetch initial graph data from backend (fallback)
var particles = { nodes: {}, edges: {} };
fetch('http://localhost:3001/data')
	.then(res => {
		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status}`);
		}
		return res.json();
	})
	.then(data => {
		console.log('Fetched graph data:', data);
		
		// Expect GraphData format: {nodes: {}, edges: {}}
		if (data && data.nodes && data.edges) {
			particles = data;
			console.log('Using backend graph data:', particles);
		} else {
			particles = { nodes: {}, edges: {} };
			console.log('No valid graph data found, using empty graph');
		}
	})
	.catch(error => {
		console.warn('Failed to fetch graph data from backend:', error);
		console.log('Falling back to empty graph');
		particles = { nodes: {}, edges: {} };
	});

const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize particle shuffler and sorter
const particleShuffler = new ParticleShuffler(canvas);
const particleSorter = new ParticleSorter(canvas);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let modalContent = {};
let particleModal = document.getElementById('particleModal');
let particleModalBody = document.getElementById('particleModalBody');
let addParticlesModal = document.getElementById('addParticlesModal');
let addParticleForm = document.getElementById('addParticleForm');
let cancelAddParticleBtn = document.getElementById('cancelAddParticle');
let notification = document.getElementById('notification');
let notificationMessage = document.getElementById('notificationMessage');

// Function to show notifications
function showNotification(message, duration = 3000) {
    notificationMessage.textContent = message;
    notification.classList.remove('hidden');
    notification.style.display = 'block'; // Ensure it's visible

    setTimeout(() => {
        notification.classList.add('hidden');
        // After the fade out animation completes, set display to none
        setTimeout(() => {
            if (notification.classList.contains('hidden')) {
                notification.style.display = 'none';
            }
        }, 500);
    }, duration);
}

// Save map functionality
saveMapBtn.addEventListener('click', () => {
    saveParticleMap();
});

// Open map functionality
openMapBtn.addEventListener('click', () => {
    openParticleMap();
});

// Toggle node labels functionality
toggleNodeLabelsBtn.addEventListener('click', () => {
    showNodeLabels = !showNodeLabels;

    // Update button appearance
    if (showNodeLabels) {
        toggleNodeLabelsBtn.classList.remove('inactive');
        showNotification('Node labels enabled', 2000);
    } else {
        toggleNodeLabelsBtn.classList.add('inactive');
        showNotification('Node labels disabled', 2000);
    }
});

// Toggle edge labels functionality
toggleEdgeLabelsBtn.addEventListener('click', () => {
    showEdgeLabels = !showEdgeLabels;

    // Update button appearance
    if (showEdgeLabels) {
        toggleEdgeLabelsBtn.classList.remove('inactive');
        showNotification('Edge labels enabled', 2000);
    } else {
        toggleEdgeLabelsBtn.classList.add('inactive');
        showNotification('Edge labels disabled', 2000);
    }
});

// Sort particles functionality
sortParticlesBtn.addEventListener('click', async () => {
    if (particleSorter.isSorting()) {
        showNotification('Sorting already in progress...', 2000);
        return;
    }

    if (!particles.nodes || Object.keys(particles.nodes).length === 0) {
        showNotification(
            'No particles to sort. Add some particles first.',
            3000
        );
        return;
    }

    try {
        // Disable the sort button during sorting
        sortParticlesBtn.disabled = true;
        sortParticlesBtn.textContent = 'Sorting...';

        showNotification(
            'Starting particle grid sorting by connection count...',
            3000
        );

        // Start the sorting process
        await particleSorter.startSorting(
            particles,
            () => {}, // Update callback - drawing happens automatically in animate loop
            async (key, particle) => {
                // Server update callback
                try {
                    await updateParticleOnServer(key, particle);
                } catch (error) {
                    console.error(
                        `Failed to update particle ${key} on server:`,
                        error
                    );
                }
            }
        );

        showNotification(
            'Particle grid sorting completed! Nodes are now arranged in clusters with connection-based hierarchy.',
            5000
        );
    } catch (error) {
        console.error('Error during particle sorting:', error);
        showNotification('Failed to sort particles. Please try again.', 4000);
    } finally {
        // Re-enable the sort button
        sortParticlesBtn.disabled = false;
        sortParticlesBtn.textContent = 'Sort Particles';
    }
});

// Shuffle particles functionality
shuffleParticlesBtn.addEventListener('click', async () => {
    if (!particles.nodes || Object.keys(particles.nodes).length === 0) {
        showNotification(
            'No particles to shuffle. Add some particles first.',
            3000
        );
        return;
    }

    // Stop any current shuffling to allow rapid button spamming
    if (particleShuffler.isShuffling()) {
        particleShuffler.stopShuffling();
        // Brief delay to ensure cleanup
        await new Promise((resolve) => setTimeout(resolve, 50));
    }

    try {
        // Update button state but don't disable it (allows spamming)
        shuffleParticlesBtn.textContent = 'Shuffling...';

        showNotification(
            'Starting particle shuffling by connection count...',
            2000
        );

        // Start the shuffling process
        await particleShuffler.startShuffling(
            particles,
            () => {}, // Update callback - drawing happens automatically in animate loop
            async (key, particle) => {
                // Server update callback
                try {
                    await updateParticleOnServer(key, particle);
                } catch (error) {
                    console.error(
                        `Failed to update particle ${key} on server:`,
                        error
                    );
                }
            }
        );

        showNotification(
            'Particle shuffling completed! Nodes with more connections are now closer to the center.',
            3000
        );
    } catch (error) {
        console.error('Error during particle shuffling:', error);
        showNotification(
            'Failed to shuffle particles. Please try again.',
            4000
        );
    } finally {
        // Reset button text
        shuffleParticlesBtn.textContent = 'Shuffle Particles';
    }
});

// Clear particles functionality
clearParticlesBtn.addEventListener('click', async () => {
    if (!particles.nodes || Object.keys(particles.nodes).length === 0) {
        showNotification('No particles to clear.', 2000);
        return;
    }

    // Show confirmation dialog
    const nodeCount = Object.keys(particles.nodes).length;
    const confirmMessage = `Are you sure you want to clear all particles?\n\nThis will remove all ${nodeCount} particles and their connections. This action cannot be undone.`;
    const confirmed = confirm(confirmMessage);

    if (!confirmed) {
        return;
    }

    try {
        // Disable the clear button during operation
        clearParticlesBtn.disabled = true;
        clearParticlesBtn.textContent = 'Clearing...';

        showNotification('Clearing all particles...', 2000);

        // Clear particles on server
        const response = await fetch('http://localhost:3001/data', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Clear local particles
        particles = { nodes: {}, edges: {} };

        showNotification('All particles cleared successfully!', 4000);
        console.log('All particles cleared successfully');
    } catch (error) {
        console.error('Error clearing particles:', error);
        showNotification('Failed to clear particles. Please try again.', 4000);

        // Optionally refetch data to ensure consistency
        try {
            const dataResponse = await fetch('http://localhost:3001/data');
            if (dataResponse.ok) {
                const data = await dataResponse.json();
                if (data && data.nodes) {
                    particles = data;
                } else {
                    particles = { nodes: {}, edges: {} };
                }
            }
        } catch (refetchError) {
            console.error(
                'Error refetching data after clear failure:',
                refetchError
            );
        }
    } finally {
        // Re-enable the clear button
        clearParticlesBtn.disabled = false;
        clearParticlesBtn.textContent = 'Clear Particles';
    }
});

// Function to save particle map to JSON file
function saveParticleMap() {
    try {
        // Save the graph data directly
        const particleData = particles;

        // Convert to JSON string with pretty formatting
        const jsonData = JSON.stringify(particleData, null, 2);

        // Create a blob with the JSON data
        const blob = new Blob([jsonData], { type: 'application/json' });

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);

        // Create a temporary anchor element to trigger download
        const a = document.createElement('a');
        a.href = url;
        const filename = `particles-map-${Date.now()}.json`;
        a.download = filename;

        // Append to body, click to download, then remove
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up the URL object
        URL.revokeObjectURL(url);

        console.log('Particle map saved successfully');
        showNotification(
            `Map saved as "${filename}" in your downloads folder!`,
            5000
        );
    } catch (error) {
        console.error('Error saving particle map:', error);
        showNotification('Failed to save map. Please try again.');
    }
}

// Function to open particle map from JSON file
function openParticleMap() {
    try {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';

        // Add event listener for when a file is selected
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Read the file
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    // Parse the JSON data
                    const jsonData = JSON.parse(event.target.result);

                    // Update server with new data
                    const response = await fetch('http://localhost:3001/data', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(jsonData),
                    });

                    if (!response.ok) {
                        throw new Error(
                            `HTTP error! status: ${response.status}`
                        );
                    }

                    // Update local state
                    if (jsonData && jsonData.nodes) {
                        particles = jsonData;
                    } else {
                        particles = { nodes: {}, edges: {} };
                    }

                    console.log('Particle map loaded successfully');
                    showNotification(
                        `Map "${file.name}" loaded successfully!`,
                        5000
                    );
                } catch (error) {
                    console.error('Error loading particle map:', error);
                    showNotification(
                        'Failed to load map. The file may be invalid.'
                    );
                }
            };

            reader.onerror = () => {
                console.error('Error reading file');
                showNotification('Failed to read file. Please try again.');
            };

            // Start reading the file
            reader.readAsText(file);
        });

        // Trigger the file input click
        fileInput.click();
    } catch (error) {
        console.error('Error opening file dialog:', error);
        showNotification('Failed to open file dialog. Please try again.');
    }
}

// Particle modal event listeners
particleModal.addEventListener('click', (e) => {
    if (e.target === particleModal) {
        particleModal.classList.add('hidden');
    }
});

// Add particles modal event listeners
addParticlesModal.addEventListener('click', (e) => {
    if (e.target === addParticlesModal) {
        addParticlesModal.classList.add('hidden');
        resetFormMode();
    }
});

// Add particle button event listener
addParticleBtn.addEventListener('click', async () => {
    resetFormMode();
    await loadAvailableParticles();
    addParticlesModal.classList.remove('hidden');
});

// Cancel button event listener
cancelAddParticleBtn.addEventListener('click', () => {
    addParticlesModal.classList.add('hidden');
    addParticleForm.reset();
    clearEdgesSection();
    resetFormMode();
    resetAdvancedSettings();
});

// Advanced settings toggle functionality
document.getElementById('advancedToggle').addEventListener('click', () => {
    const toggleBtn = document.getElementById('advancedToggle');
    const advancedSettings = document.getElementById('advancedSettings');

    if (advancedSettings.classList.contains('collapsed')) {
        // Expand
        advancedSettings.classList.remove('collapsed');
        toggleBtn.classList.add('expanded');
    } else {
        // Collapse
        advancedSettings.classList.add('collapsed');
        toggleBtn.classList.remove('expanded');
    }
});

function clearEdgesSection() {
    // Clear search input
    document.getElementById('edgeSearch').value = '';
    // Re-render to show all particles and reset checkboxes
    renderAvailableParticles();
}

// Helper function to reset form mode to "add"
function resetFormMode() {
    addParticlesModal.dataset.mode = 'add';
    document.querySelector('#addParticlesModal h2').textContent =
        'Add New Particle';
    document.querySelector(
        "#addParticleForm button[type='submit']"
    ).textContent = 'Add Particle';
    currentEditingKey = null; // Clear the editing key
}

// Helper function to set form mode to "update"
function setUpdateFormMode() {
    addParticlesModal.dataset.mode = 'update';
    document.querySelector('#addParticlesModal h2').textContent =
        'Update Particle';
    document.querySelector(
        "#addParticleForm button[type='submit']"
    ).textContent = 'Update Particle';
}

// Helper function to reset advanced settings to collapsed state
function resetAdvancedSettings() {
    const toggleBtn = document.getElementById('advancedToggle');
    const advancedSettings = document.getElementById('advancedSettings');

    // Collapse the advanced settings
    advancedSettings.classList.add('collapsed');
    toggleBtn.classList.remove('expanded');
}

// Edges functionality
let availableParticles = [];
let currentEditingKey = null; // Store the key of the particle being edited

async function loadAvailableParticles() {
    try {
        const response = await fetch('http://localhost:3001/data');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Handle graph format
        let nodes;
        if (data && data.nodes) {
            nodes = data.nodes;
        } else {
            nodes = data;
        }

        availableParticles = Object.entries(nodes).map(([key, particle]) => ({
            key,
            title: particle.title || key,
            ...particle,
        }));

        renderAvailableParticles();
    } catch (error) {
        console.error('Error loading available particles:', error);
        availableParticles = [];
        renderAvailableParticles();
    }
}

function renderAvailableParticles(searchTerm = '') {
    const container = document.getElementById('edgesContainer');
    const emptyDiv = document.getElementById('edgesEmpty');

    // Filter particles based on search term
    const filteredParticles = availableParticles.filter(
        (particle) =>
            particle.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            particle.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredParticles.length === 0) {
        emptyDiv.style.display = 'block';
        emptyDiv.textContent = searchTerm
            ? 'No particles match your search'
            : 'No existing particles available for connections';
        // Clear any existing edge items
        const existingItems = container.querySelectorAll('.edge-item');
        existingItems.forEach((item) => item.remove());
        return;
    }

    emptyDiv.style.display = 'none';

    // Clear existing edge items
    const existingItems = container.querySelectorAll('.edge-item');
    existingItems.forEach((item) => item.remove());

    // Create edge items for filtered particles
    filteredParticles.forEach((particle) => {
        const edgeItem = document.createElement('div');
        edgeItem.className = 'edge-item';

        edgeItem.innerHTML = `
			<input type="checkbox" class="edge-checkbox" name="edge-${particle.key}" id="edge-${particle.key}">
			<div class="edge-key">${particle.key}</div>
			<div class="edge-title">${particle.title}</div>
			<input type="text" class="edge-label-input" name="label-${particle.key}" placeholder="Edge label" disabled>
		`;

        container.appendChild(edgeItem);

        // Add event listener to enable/disable label input based on checkbox
        const checkbox = edgeItem.querySelector('.edge-checkbox');
        const labelInput = edgeItem.querySelector('.edge-label-input');

        checkbox.addEventListener('change', () => {
            labelInput.disabled = !checkbox.checked;
            if (!checkbox.checked) {
                labelInput.value = '';
            }
        });
    });
}

// Add search functionality
document.getElementById('edgeSearch').addEventListener('input', (e) => {
    renderAvailableParticles(e.target.value);
});

// New edge management functions
async function createEdge(source, target, options = {}) {
	try {
		const response = await fetch('http://localhost:3001/edge', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				source,
				target,
				label: options.label || '',
				directed: options.directed !== undefined ? options.directed : true,
				weight: options.weight,
				metadata: options.metadata
			})
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();
		return result.edgeId;
	} catch (error) {
		console.error('Failed to create edge:', error);
		throw error;
	}
}

async function deleteEdge(edgeId) {
	try {
		const response = await fetch(`http://localhost:3001/edge/${edgeId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return true;
	} catch (error) {
		console.error('Failed to delete edge:', error);
		throw error;
	}
}

async function getNodeEdges(nodeKey) {
	try {
		const response = await fetch(`http://localhost:3001/node/${nodeKey}/edges`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.json();
	} catch (error) {
		console.error('Failed to get node edges:', error);
		throw error;
	}
}

// Form submission event listener
addParticleForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	
	const formData = new FormData(addParticleForm);
	
	// Collect edges from checked items
	const selectedEdges = [];
	document.querySelectorAll('input[name^="edge-"]:checked').forEach(checkbox => {
		const particleKey = checkbox.name.replace('edge-', '');
		const labelInput = document.querySelector(`input[name="label-${particleKey}"]`);
		selectedEdges.push({
			key: particleKey,
			label: labelInput.value.trim() || ""
		});
	});
	
	// Parse and validate JSON data field
	let parsedData = undefined;
	const dataFieldValue = formData.get('data');
	if (dataFieldValue && dataFieldValue.trim()) {
		try {
			parsedData = JSON.parse(dataFieldValue.trim());
		} catch (error) {
			alert(`Invalid JSON data: ${error.message}\n\nPlease check your JSON syntax and try again.`);
			return;
		}
	}
	
	// Create node data (without edges)
	const nodeData = {
		x: parseFloat(formData.get('x')),
		y: parseFloat(formData.get('y')),
		title: formData.get('title'),
		radius: parseFloat(formData.get('radius')),
		data: parsedData
	};
	
	const isUpdate = addParticlesModal.dataset.mode === "update";
	let key;
	
	if (isUpdate) {
		// For updates, get the key from the stored variable
		key = currentEditingKey;
	} else {
		// For new particles, generate a UUID
		key = generateUUID();
	}
	
	try {
		// Step 1: Add/update the node
		const nodeResponse = await fetch(`http://localhost:3001/particle/${key}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(nodeData)
		});
		
		if (!nodeResponse.ok) {
			throw new Error(`HTTP error! status: ${nodeResponse.status}`);
		}
		
		// Step 2: Handle edge management for updates
		if (isUpdate) {
			// Get current edges for this node
			const currentEdges = await getNodeEdges(key);
			
			// Delete edges that are no longer selected
			for (const edge of currentEdges) {
				const isStillSelected = selectedEdges.some(selected => 
					(edge.source === key && edge.target === selected.key) ||
					(edge.target === key && edge.source === selected.key)
				);
				
				if (!isStillSelected) {
					await deleteEdge(edge.id);
				}
			}
		}
		
		// Step 3: Create new edges
		for (const selectedEdge of selectedEdges) {
			try {
				await createEdge(key, selectedEdge.key, {
					label: selectedEdge.label,
					directed: true
				});
			} catch (edgeError) {
				console.warn(`Failed to create edge from ${key} to ${selectedEdge.key}:`, edgeError);
			}
		}
		
		// Step 4: Refetch all data to update local state
		const dataResponse = await fetch('http://localhost:3001/data');
		if (!dataResponse.ok) {
			throw new Error(`HTTP error! status: ${dataResponse.status}`);
		}
		
		const data = await dataResponse.json();
		if (data && data.nodes && data.edges) {
			particles = data;
		} else {
			particles = { nodes: {}, edges: {} };
		}
		
		// Close modal and reset form
		addParticlesModal.classList.add("hidden");
		addParticleForm.reset();
		resetFormMode();
		
		console.log(`Particle ${isUpdate ? 'updated' : 'added'} successfully`);
		showNotification(`Node ${isUpdate ? 'updated' : 'created'} successfully!`, 3000);
		
	} catch (error) {
		console.error(`Error ${isUpdate ? 'updating' : 'adding'} particle:`, error);
		showNotification(`Failed to ${isUpdate ? 'update' : 'add'} particle. Please try again.`, 4000);
	}
});

function handleClick(event) {
	const bounding = canvas.getBoundingClientRect()
	const x = (event.clientX - bounding.left - offsetX) / scale;
	const y = (event.clientY - bounding.top - offsetY) / scale;

	// Check if user clicked on a node
	for (const [key, particle] of Object.entries(particles.nodes)) {
		if (particle.x + particle.radius >= x && particle.x - particle.radius <= x && particle.y + particle.radius >= y && particle.y - particle.radius <= y) {
			console.log("Click!")
			
			// Format the data field for display
			let dataSection = '';
			if (particle.data !== undefined && particle.data !== null) {
				try {
					const formattedData = JSON.stringify(particle.data, null, 2);
					dataSection = `
						<div class="node-data-section">
							<h3>Data:</h3>
							<pre class="node-data-content">${formattedData}</pre>
						</div>
					`;
                } catch (error) {
                    dataSection = `
						<div class="node-data-section">
							<h3>Data:</h3>
							<p class="node-data-error">Error displaying data: ${error.message}</p>
						</div>
					`;
                }
            } else {
                dataSection = `
					<div class="node-data-section">
						<h3>Data:</h3>
						<p class="node-data-empty">No data attached to this node</p>
					</div>
				`;
            }

            particleModalBody.innerHTML = `
				<h2>Node: ${key}</h2>
				<div class="node-basic-info">
					<p><strong>Title:</strong> ${particle.title}</p>
					<p><strong>Position:</strong> (${Math.round(particle.x)}, ${Math.round(
                particle.y
            )})</p>
					<p><strong>Radius:</strong> ${particle.radius}</p>
					<p><strong>Color:</strong> ${particle.color || 'default'}</p>
				</div>
				${dataSection}
				<div class="modal-actions">
					<button id="editParticleBtn" class="edit-btn">
						<svg width="16" height="16" viewBox="0 0 16 16">
							<path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 00-.064.108l-.558 1.953 1.953-.558a.253.253 0 00.108-.064Zm1.238-3.763a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086z"></path>
						</svg>
						Edit
					</button>
					<button id="deleteParticleBtn" class="delete-btn">
						<svg width="16" height="16" viewBox="0 0 16 16">
							<path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 1.152l.557 10.056A2 2 0 0 0 5.046 16h5.908a2 2 0 0 0 1.993-1.792l.557-10.056A.58.58 0 0 0 13.494 2.5H11ZM4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.058l-.5-8.5a.5.5 0 1 0-.998.058Zm6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528ZM8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5Z"/>
						</svg>
						Delete
					</button>
				</div>
				`;

            // Add event listeners for both buttons
            setTimeout(() => {
                document
                    .getElementById('editParticleBtn')
                    .addEventListener('click', () => {
                        editParticle(key);
                    });

                document
                    .getElementById('deleteParticleBtn')
                    .addEventListener('click', () => {
                        deleteParticle(key);
                    });
            }, 0);

            particleModal.classList.remove('hidden');
            return;
        }
    }
}

// Function to handle editing a particle
async function editParticle(key) {
	try {
		// Close the particle info modal
		particleModal.classList.add("hidden");
		
		// Get the current particle data
		const particle = particles.nodes[key];
		
		if (!particle) {
			console.error(`Particle with key ${key} not found`);
			return;
		}
		
		// Store the key for the update operation
		currentEditingKey = key;
		
		// Set form mode to "update"
		setUpdateFormMode();
		
		// Populate form fields
		const form = document.getElementById("addParticleForm");
		form.elements["title"].value = particle.title || "";
		form.elements["x"].value = particle.x || 100;
		form.elements["y"].value = particle.y || 100;
		form.elements["radius"].value = particle.radius || 20;
		
		// Populate data field if it exists
		if (particle.data !== undefined && particle.data !== null) {
			try {
				form.elements["data"].value = JSON.stringify(particle.data, null, 2);
			} catch (error) {
				console.warn('Error serializing particle data for editing:', error);
				form.elements["data"].value = '';
			}
		} else {
			form.elements["data"].value = '';
		}
		
		// Load available particles for edges
		await loadAvailableParticles();
		
		// Get current edges for this node and populate checkboxes
		try {
			const currentEdges = await getNodeEdges(key);
			
			// Wait a bit for the edge items to be rendered
			setTimeout(() => {
				currentEdges.forEach(edge => {
					// Determine the target node (the other end of the edge)
					const targetKey = edge.source === key ? edge.target : edge.source;
					const checkbox = document.getElementById(`edge-${targetKey}`);
					if (checkbox) {
						checkbox.checked = true;
						const labelInput = document.querySelector(`input[name="label-${targetKey}"]`);
						if (labelInput) {
							labelInput.disabled = false;
							labelInput.value = edge.label || "";
						}
					}
				});
			}, 100);
		} catch (error) {
			console.warn('Failed to load current edges for editing:', error);
		}
		
		// Show the modal
		addParticlesModal.classList.remove("hidden");
	} catch (error) {
		console.error("Error preparing particle for editing:", error);
	}
}

// Function to handle deleting a particle
async function deleteParticle(key) {
	try {
		// Get the particle data for confirmation message
		const particle = particles.nodes[key];
		
		if (!particle) {
			console.error(`Particle with key ${key} not found`);
			return;
		}
		
		// Show confirmation dialog
		const confirmMessage = `Are you sure you want to delete the node "${key}"?\n\nThis will also remove all connected edges and cannot be undone.`;
		const confirmed = confirm(confirmMessage);
		
		if (!confirmed) {
			return;
		}
		
		// Close the particle info modal
		particleModal.classList.add("hidden");
		
		// Delete particle on server
		const response = await fetch(`http://localhost:3001/particle/${key}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		
		const result = await response.json();
		
		if (result.success) {
			// Remove from local state
			delete particles.nodes[key];
			
			// Show success notification
			showNotification(`Node "${key}" deleted successfully`, 4000);
			console.log(`Particle ${key} deleted successfully`);
		} else {
			throw new Error(result.message || 'Failed to delete particle');
		}
		
	} catch (error) {
		console.error('Error deleting particle:', error);
		showNotification('Failed to delete node. Please try again.', 4000);
		
		// Optionally refetch data to ensure consistency
		try {
			const dataResponse = await fetch('http://localhost:3001/data');
			if (dataResponse.ok) {
				const data = await dataResponse.json();
				if (data && data.nodes) {
					particles = data;
				} else {
					particles = { nodes: {}, edges: {} };
				}
			}
		} catch (refetchError) {
			console.error('Error refetching data after delete failure:', refetchError);
		}
	}
}

canvas.addEventListener('dblclick', (event) =>
    handleClick(event, modalContent)
);

let scale = 1;
let offsetX = 0;
let offsetY = 0;

let isDragging = false;
let startX, startY;
let draggingObject = null;
let draggingOffset = {
    x: 0,
    y: 0,
};

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
        const response = await fetch(
            `http://localhost:3001/particle/${particleKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(particle),
            }
        );

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
        if (
            originalPosition &&
            draggedParticleKey &&
            particles.nodes[draggedParticleKey]
        ) {
            const particle = particles.nodes[draggedParticleKey];
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
	for (let [key, particle] of Object.entries(particles.nodes)) {
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
        console.log(
            `Particle ${draggedParticleKey} drag ended (mouse left canvas), scheduling server update`
        );
        debouncedUpdateParticle(draggedParticleKey, draggingObject);
    }

    draggingObject = null;
    isDragging = false;
});

canvas.addEventListener(
    'wheel',
    (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = e.deltaY < 0 ? 1.01 : 0.99;
        zoomAt(mouseX, mouseY, zoomFactor);
    },
    { passive: false }
);

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

const ctx = canvas.getContext('2d');
ctx.fillStyle = 'green';
ctx.fillRect(10, 10, 150, 100);
function animate() {
    requestAnimationFrame(animate);
    draw();
}

animate();

function draw(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    // repelAndAttract(canvas, particles, 10);
    drawParticles(ctx, particles, showNodeLabels, showEdgeLabels);
    ctx.restore();
}
