#!/bin/bash
# filepath: /home/leo/demo-uploader/scripts/start-app.sh

# Function to cleanup background processes
cleanup() {
    echo "Shutting down servers..."
    kill $backend_pid $frontend_pid 2>/dev/null
    exit 0
}

# Set trap to catch Ctrl+C (SIGINT) and call cleanup
trap cleanup SIGINT

# Start backend in background and capture PID
./scripts/start-backend.sh &
backend_pid=$!

# Start frontend in background and capture PID  
./scripts/start-frontend.sh &
frontend_pid=$!

# Wait for both processes
wait $backend_pid $frontend_pid