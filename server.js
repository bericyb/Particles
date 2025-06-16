const http = require('http');

let storedData = []; // In-memory storage

const server = http.createServer((req, res) => {
	// CORS headers for all requests
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (req.method === 'OPTIONS') {
		res.writeHead(204);
		res.end();
		return;
	}

	// GET /data
	if (req.method === 'GET' && req.url === '/data') {
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(storedData));
		return;
	}

	// POST /data
	if (req.method === 'POST' && req.url === '/data') {
		let body = '';
		req.on('data', chunk => (body += chunk.toString()));
		req.on('end', () => {
			try {
				const parsed = JSON.parse(body);
				storedData = parsed;
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify({ success: true }));
			} catch (err) {
				res.writeHead(400);
				res.end('Invalid JSON');
			}
		});
		return;
	}

	// GET /example
	if (req.method === 'GET' && req.url === '/example') {
		const exampleData = {
			"root":
			{
				x: 100,
				y: 150,
				color: "lime",
				title: "Example Node",
				radius: 20,
				edges: [
					{ key: 2, label: "Talks to" },
					{ key: 3, label: "Related to" }
				]
			}
		};
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(exampleData));
		return;
	}

	// 404 fallback
	res.writeHead(404);
	res.end();
});

server.listen(3001, () => {
	console.log('Server running at http://localhost:3001');
});
