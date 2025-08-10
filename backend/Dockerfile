# Production-optimized Dockerfile following UV best practices
# Uses multi-stage build with non-editable installs for production
# https://docs.astral.sh/uv/guides/integration/docker/

# Builder stage
FROM python:3.12-slim AS builder

# Install uv by copying from the official image (recommended approach)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Enable bytecode compilation for better performance
ENV UV_COMPILE_BYTECODE=1

# Configure UV for better Docker performance
ENV UV_LINK_MODE=copy

# Install dependencies in non-editable mode
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project --no-editable

# Copy the project source code
COPY . .

# Install the project itself in non-editable mode
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-editable

# Production stage
FROM python:3.12-slim

# Copy only the virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Set working directory
WORKDIR /app

# Create uploads directory
RUN mkdir -p uploads

# Add the virtual environment to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Expose port
EXPOSE 8000

# Run the application directly from the virtual environment
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
