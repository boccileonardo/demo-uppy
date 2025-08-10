# Docker Deployment Guide

This guide explains how to deploy the Demo Uppy application using Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Architecture

The application consists of two main services:

- **Backend**: FastAPI application using UV package manager with optimized builds
- **Frontend**: React/Vite application served by Nginx

## Quick Start

1. **Production deployment (recommended):**
   ```bash
   docker-compose up -d --build
   ```

2. **Development environment (with hot reloading):**
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## UV Optimizations

The backend uses the latest UV best practices:
- Official UV container image for installation
- Cache mounts for faster builds
- Bytecode compilation for better performance
- Multi-stage builds for smaller production images

## Useful Commands

```bash
# Start production environment
docker-compose up -d --build

# Start development environment  
docker-compose -f docker-compose.dev.yml up

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean up everything
docker-compose down -v && docker system prune -f

# Using the management script
./docker.sh prod    # Production
./docker.sh dev     # Development  
./docker.sh clean   # Cleanup
```

## Production Deployment

For production, the default docker-compose.yml uses:
- Multi-stage builds for smaller images
- Non-editable package installs
- Optimized UV configuration
- Health checks for monitoring

Change the `SECRET_KEY` environment variable for production use.
