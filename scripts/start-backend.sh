#!/bin/bash

# Start the backend server
echo "Starting FastAPI backend server..."
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
