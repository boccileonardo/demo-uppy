# Makefile for Demo Uppy Docker operations

.PHONY: help build up down logs restart clean dev prod backend frontend

# Default target
help:
	@echo "Demo Uppy Docker Management"
	@echo ""
	@echo "Available targets:"
	@echo "  clean      - Stop and clean up volumes"
	@echo "  dev        - Start development environment"
	@echo "  prod       - Start production environment"
	@echo ""

# Clean up everything
clean:
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v || true
	docker system prune -f

# Development mode
dev:
	docker-compose -f docker-compose.dev.yml up --build

# Production mode with multi-stage optimized build
prod:
	docker-compose up -d --build
