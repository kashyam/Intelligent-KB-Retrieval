# Use a minimal Python base image
FROM python:3.12-slim

WORKDIR /app

# Install uv globally in the container's main python environment
RUN pip install "uv>=0.2.14"

# Set the virtual environment location within the app directory
ENV VIRTUAL_ENV=/app/.venv
# Ensure the venv is on the PATH for subsequent commands
ENV PATH="/app/.venv/bin:$PATH"

# Create the virtual environment directory
RUN python3 -m venv $VIRTUAL_ENV

# Copy just the dependency file (pyproject.toml)
COPY pyproject.toml ./

# Use uv to install dependencies directly into the system site-packages
# This ensures uvicorn is in a place where `python -m uvicorn` can find it
RUN uv sync

# Copy the application code
COPY . .

EXPOSE 8002

# The CMD now works seamlessl
# CMD ["python3", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8002"]
CMD ["uv", "run", "app.py"]
