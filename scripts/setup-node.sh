#!/bin/bash

# Setup script to use Node.js 20 for this project
echo "Setting up Node.js 20 for Olivia's Beauty Vault..."

# Check if Node.js 20 is available via Homebrew
if [ -f "/usr/local/opt/node@20/bin/node" ]; then
    echo "✅ Node.js 20 found at /usr/local/opt/node@20/bin/node"
    echo "Current Node.js version: $(/usr/local/opt/node@20/bin/node --version)"
    echo ""
    echo "To use Node.js 20 in this session, run:"
    echo "export PATH=\"/usr/local/opt/node@20/bin:\$PATH\""
    echo ""
    echo "Or add this to your shell profile (~/.zshrc or ~/.bash_profile):"
    echo "export PATH=\"/usr/local/opt/node@20/bin:\$PATH\""
    echo ""
    echo "Then you can run:"
    echo "npm install"
    echo "npm run dev"
    echo "npm run build"
    echo "npm run lint"
else
    echo "❌ Node.js 20 not found. Please install it first:"
    echo "brew install node@20"
fi 