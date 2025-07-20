#!/bin/bash

# Build verification script for Vercel deployment

echo "🔍 Verifying build process..."

# Check if all required dependencies are installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Installing dependencies..."
    npm ci
fi

# Check TypeScript
echo "🔧 Checking TypeScript..."
npx tsc --noEmit

# Check ESLint
echo "🔍 Running ESLint..."
npm run lint

# Run build
echo "🏗️ Running production build..."
npm run build

echo "✅ Build verification complete!" 