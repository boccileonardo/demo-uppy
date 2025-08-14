# Makefile for Demo Uppy Docker operations

.PHONY: help build up down logs restart clean dev prod backend frontend env-check

# Default target
help:
	@echo "Demo Uppy Docker Management"
	@echo ""
	@echo "Available targets:"
	@echo "  env-check  - Check if required environment files exist"
	@echo "  clean      - Stop and clean up volumes"
	@echo "  dev        - Start development environment"
	@echo "  prod       - Start production environment"
	@echo "  logs-dev   - Show development logs"
	@echo "  logs-prod  - Show production logs"
	@echo "  stop-dev   - Stop development environment"
	@echo "  stop-prod  - Stop production environment"
	@echo ""

# Check if environment files exist
env-check:
	@echo "Checking environment files..."
	@if [ ! -f .env ]; then \
		echo "❌ .env not found!"; \
		echo "   Please create a .env file with your configuration"; \
		exit 1; \
	else \
		echo "✅ .env found"; \
	fi

# Clean up everything
clean:
	docker compose --env-file .env down -v 2>/dev/null || true
	docker compose -f docker-compose.dev.yml --env-file .env down -v 2>/dev/null || true
	docker system prune -f

# Development mode
dev: env-check
	docker compose -f docker-compose.dev.yml --env-file .env up --build

# Production mode with multi-stage optimized build
prod: env-check
	@if [ ! -f .env ]; then \
		echo "❌ .env file not found! Please copy .env.example to .env and customize it."; \
		echo "   Run: cp .env.example .env"; \
		exit 1; \
	fi
	docker compose --env-file .env up -d --build

# Development logs
logs-dev:
	docker compose -f docker-compose.dev.yml --env-file .env logs -f

# Production logs
logs-prod:
	docker compose --env-file .env logs -f

# Stop development environment
stop-dev:
	docker compose -f docker-compose.dev.yml --env-file .env down

# Stop production environment
stop-prod:
	docker compose --env-file .env down
