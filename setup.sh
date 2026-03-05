#!/bin/bash

echo "🔧 Starting project setup..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing dependencies..."
    npm install --save
    
    echo "✅ All dependencies installed successfully."
else
    echo "✅ node_modules already exists. Skipping installation."
fi

# Create uploads folder if it does not exist
if [ ! -d "uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir uploads
fi

echo "🚀 Setup completed!"