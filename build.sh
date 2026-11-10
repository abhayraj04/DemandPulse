#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=== DemandVision Pro Build Script ==="

echo "--> 1. Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "--> 2. Installing Frontend dependencies..."
cd frontend
npm ci || npm install

echo "--> 3. Building React Frontend..."
npm run build
cd ..

echo "--> 4. Verifying Build Assets..."
if [ ! -d "frontend/dist" ] || [ ! -f "frontend/dist/index.html" ]; then
  echo "Error: frontend/dist/index.html was not created!"
  exit 1
fi

echo "=== DemandVision Pro Build Complete Successfully! ==="
