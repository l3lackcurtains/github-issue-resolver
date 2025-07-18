#!/bin/bash

echo "Building GitHub Issue Resolver..."

# Clean previous build
echo "Cleaning previous build..."
rm -rf dist/

# Run TypeScript compiler
echo "Compiling TypeScript..."
npx tsc

# Copy non-TypeScript files
echo "Copying configuration files..."
cp -r config/ dist/ 2>/dev/null || true

# Make CLI executable
echo "Making CLI executable..."
chmod +x dist/cli/index.js

# Create symlink for global usage (optional)
if [ "$1" = "--global" ]; then
    echo "Creating global symlink..."
    npm link
fi

echo "✅ Build completed successfully!"
echo ""
echo "Built files are in the 'dist' directory"
echo "Run with: node dist/main.js"
echo "Or use CLI: ./dist/cli/index.js"