# Use an official Python runtime as a parent image
FROM python:3.11-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=development

# Install curl and Node.js (v20)
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy python requirements first to leverage Docker cache
COPY requirements.txt .

# Install python dependencies and playwright browsers with system dependencies
RUN pip install --no-cache-dir -r requirements.txt && \
    playwright install --with-deps chromium

# Copy Node.js dependencies
COPY ui/package.json ./ui/

# Install Node dependencies
RUN cd ui && npm install

# Copy the rest of the application code
COPY . .

# Expose port for Vite dev server
EXPOSE 5173

# Start the dev server with host flag so it's accessible outside the container
CMD ["npm", "run", "dev", "--prefix", "ui", "--", "--host"]
