#!/bin/bash

# Setup Git Repository Script
# This script helps initialize a git repository and prepare it for GitHub

echo "🚀 Setting up Git repository for Olivia's Beauty Vault..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
else
    echo "✅ Git repository already initialized"
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "feat: initial commit - Olivia's Beauty Vault

- Product catalog management system
- AI-powered product information generation
- Beautiful Sephora-inspired UI
- PostgreSQL database integration
- Google Gemini AI integration
- Comprehensive documentation
- GitHub repository setup"

# Set up main branch (if not already set)
if git branch --show-current | grep -q "main"; then
    echo "✅ Already on main branch"
else
    echo "🔄 Renaming master to main..."
    git branch -M main
fi

echo ""
echo "🎉 Git repository setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Add the remote origin:"
echo "   git remote add origin https://github.com/yourusername/product-catalog.git"
echo "3. Push to GitHub:"
echo "   git push -u origin main"
echo ""
echo "Don't forget to:"
echo "- Update the repository URL in README.md"
echo "- Update your username in .github/dependabot.yml"
echo "- Update your username in .github/FUNDING.yml"
echo "- Update contact information in SECURITY.md and CODE_OF_CONDUCT.md"
echo ""
echo "Happy coding! 💄✨" 