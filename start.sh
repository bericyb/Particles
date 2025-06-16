#!/bin/bash

# Start the backend server
node server.js &

# Save backend PID
BACKEND_PID=$!

# Start the static file server (serving public/)
npx serve

# Save frontend PID
FRONTEND_PID=$!

# Wait until user presses Ctrl+C
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID" SIGINT
wait
