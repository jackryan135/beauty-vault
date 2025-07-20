# GitHub Repository Setup Guide

This guide will help you set up your Olivia's Beauty Vault project on GitHub.

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)
```bash
# Run the setup script
./scripts/setup-git.sh
```

### Option 2: Manual Setup
```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "feat: initial commit - Olivia's Beauty Vault"

# Set main branch
git branch -M main
```

## 📋 Pre-Setup Checklist

Before pushing to GitHub, ensure you have:

- [ ] ✅ Created a `.gitignore` file (✅ Done)
- [ ] ✅ Added LICENSE file (✅ Done)
- [ ] ✅ Updated README.md with GitHub badges and links (✅ Done)
- [ ] ✅ Created GitHub Actions workflow (✅ Done)
- [ ] ✅ Added issue templates (✅ Done)
- [ ] ✅ Added pull request template (✅ Done)
- [ ] ✅ Created CODE_OF_CONDUCT.md (✅ Done)
- [ ] ✅ Created CONTRIBUTING.md (✅ Done)
- [ ] ✅ Created SECURITY.md (✅ Done)
- [ ] ✅ Created CHANGELOG.md (✅ Done)
- [ ] ✅ Set up Dependabot configuration (✅ Done)

## 🔧 GitHub Repository Creation

1. **Create New Repository**
   - Go to [GitHub](https://github.com)
   - Click "New repository"
   - Name: `product-catalog`
   - Description: `A beautiful, Sephora-inspired product catalog for managing your personal beauty collection`
   - Make it Public
   - **Don't** initialize with README, .gitignore, or license (we already have these)

2. **Add Topics** (after creation)
   - beauty
   - product-management
   - nextjs
   - typescript
   - tailwindcss
   - postgresql
   - ai
   - gemini
   - react
   - web-app

## 🔗 Connect Local Repository to GitHub

```bash
# Add remote origin
git remote add origin https://github.com/jackryan135/beauty-vault.git

# Push to GitHub
git push -u origin main
```

## ⚙️ Repository Settings

### Enable Features
- [ ] Issues
- [ ] Projects
- [ ] Discussions
- [ ] Wiki (optional)

### Branch Protection Rules
- [ ] Require status checks to pass before merging
- [ ] Require pull request reviews before merging
- [ ] Require 1 approving review
- [ ] Dismiss stale reviews when new commits are pushed

### Set Up GitHub Actions
The CI workflow will automatically run on:
- Push to `main` branch
- Pull requests to `main` branch

## 📝 Files to Update

After creating the repository, update these files with your information:

### 1. README.md
```markdown
git clone https://github.com/jackryan135/beauty-vault.git
```

### 2. .github/dependabot.yml
```yaml
reviewers:
  - "jackryan135"
assignees:
  - "jackryan135"
```

### 3. .github/FUNDING.yml
```yaml
github: [jackryan135]
```

### 4. SECURITY.md
```markdown
If you discover a security vulnerability within this project, please send an email to jackryan135@gmail.com.
```

### 5. CODE_OF_CONDUCT.md
```markdown
Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the community leaders responsible for enforcement at
jackryan135@gmail.com.
```

## 🎯 Post-Setup Tasks

### 1. Set Up Environment Variables
- Copy `env.example` to `.env.local`
- Add your actual environment variables
- **Never commit `.env.local` to git**

### 2. Configure GitHub Pages (Optional)
- Go to Settings > Pages
- Source: Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`

### 3. Set Up Vercel Deployment
- Connect your GitHub repository to Vercel
- Add environment variables in Vercel dashboard
- Deploy automatically on push to main

### 4. Enable Dependabot
- Dependabot will automatically create PRs for dependency updates
- Review and merge as needed

## 🔒 Security Considerations

- [ ] Never commit API keys or sensitive data
- [ ] Use environment variables for all secrets
- [ ] Regularly update dependencies
- [ ] Enable security alerts in GitHub
- [ ] Review Dependabot security updates

## 📊 Repository Analytics

After setup, you can view:
- Traffic analytics
- Contributors
- Code frequency
- Network graph
- Dependencies

## 🎉 Success!

Your Olivia's Beauty Vault is now ready for GitHub! The repository includes:

- ✅ Professional documentation
- ✅ GitHub Actions CI/CD
- ✅ Issue and PR templates
- ✅ Code of conduct and contributing guidelines
- ✅ Security policy
- ✅ Dependabot for dependency updates
- ✅ Comprehensive .gitignore
- ✅ MIT License

Happy coding! 💄✨ 