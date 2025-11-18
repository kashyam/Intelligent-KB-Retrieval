# Use a minimal Python base image
# FROM python:3.12-slim
FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04

WORKDIR /app

# Install system dependencies for OCR (OpenCV, etc.) and ffmpeg (for pydub)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    tesseract-ocr \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Install uv, a fast Python package installer
RUN pip install --no-cache-dir "uv>=0.4.0"

ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
RUN python3 -m venv $VIRTUAL_ENV

# Copy dependency definition files
# Using uv.lock ensures reproducible builds. If uv.lock is not present, this will be skipped.
COPY pyproject.toml uv.lock* ./

# Install Python dependencies using uv
# This is faster and cleaner than manual venv creation
RUN uv sync --frozen

# Copy the application code into the container
COPY . .

# Expose the port the app runs on
EXPOSE 8002

ENV UV_NO_LINKED_VENV=1

# Run the FastAPI application using uvicorn
# 'uv run' ensures it uses the correct virtual environment
CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8002"]
