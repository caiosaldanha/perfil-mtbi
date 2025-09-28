#!/bin/bash

# Simple test script for MTBI Personality Test Application
echo "🧪 Testing MTBI Personality Test Application Setup"
echo "=================================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Check Docker Compose syntax
echo "✅ Validating Docker Compose configuration..."
if docker compose config > /dev/null 2>&1; then
    echo "✅ Docker Compose configuration is valid"
else
    echo "❌ Docker Compose configuration has errors"
    exit 1
fi

# Check Python syntax
echo "✅ Validating Python code syntax..."
if python3 -m py_compile backend/main.py frontend/app.py 2>/dev/null; then
    echo "✅ Python code syntax is valid"
else
    echo "❌ Python code has syntax errors"
    exit 1
fi

# Check if required files exist
echo "✅ Checking required files..."
required_files=(
    "docker-compose.yml"
    "backend/Dockerfile"
    "backend/main.py" 
    "backend/requirements.txt"
    "frontend/Dockerfile"
    "frontend/app.py"
    "frontend/requirements.txt"
    "database/init.sql"
    "README.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
        exit 1
    fi
done

echo ""
echo "🎉 All basic tests passed!"
echo ""
echo "To start the application, run:"
echo "  docker compose up --build"
echo ""
echo "Then access:"
echo "  Frontend: http://localhost:5000"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"