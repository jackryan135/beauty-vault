# Setup Guide

## Overview

This guide covers all setup options for Olivia's Beauty Vault, from simple development to production deployment.

## 🚀 Quick Development Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Basic Setup (Mock Database)
```bash
# Clone the repository
git clone <repository-url>
cd product-catalog

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will automatically use the mock database for development.

## 🐳 Docker Setup

### Prerequisites
- Docker and Docker Compose installed

### Local PostgreSQL with Docker
```bash
# Start PostgreSQL container
docker-compose up -d

# Configure environment
cp env.local.example .env.local
# Edit .env.local and set USE_LOCAL_DB=true

# Start the application
npm run dev
```

### Docker Configuration
The `docker-compose.yml` file includes:
- PostgreSQL 15 with persistent storage
- Port 5433 to avoid conflicts
- Default credentials (change for production)

### Docker Troubleshooting

#### Memory Issues
If you encounter memory issues:
```bash
# Increase Docker memory limit to 4GB
# In Docker Desktop: Settings > Resources > Memory

# Or use Docker with more memory
docker run --memory=4g postgres:15
```

#### Port Conflicts
If port 5433 is in use:
```bash
# Edit docker-compose.yml and change the port
ports:
  - "5434:5432"  # Use 5434 instead of 5433
```

#### Container Won't Start
```bash
# Check container logs
docker-compose logs postgres

# Remove and recreate container
docker-compose down -v
docker-compose up -d
```

## 🔧 Environment Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Database Configuration
USE_LOCAL_DB=false  # Set to true for local PostgreSQL
LOCAL_DB_HOST=localhost
LOCAL_DB_PORT=5433
LOCAL_DB_NAME=olivias_beauty_vault
LOCAL_DB_USER=postgres
LOCAL_DB_PASSWORD=password

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Node Environment
NODE_ENV=development
```

### Database Modes

1. **Mock Database** (`USE_LOCAL_DB=false`): Perfect for development
2. **Local PostgreSQL** (`USE_LOCAL_DB=true`): For database testing
3. **Vercel Postgres** (`POSTGRES_URL`): For production deployment

## 🤖 AI Integration Setup

### Google Gemini AI

The application includes Google Gemini AI integration for enhanced product information:

#### Setup Steps
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add `GEMINI_API_KEY` to your `.env.local` file
3. Restart the development server

#### Features
- **Product Information Generation**: AI searches for real product data
- **Text Cleaning**: AI cleans and formats product names and descriptions
- **Fallback System**: Works without AI using pattern matching
- **Rate Limit Handling**: Graceful fallback when API limits are reached

#### Troubleshooting
- **Model Not Found Error**: Fixed in latest code update
- **Rate Limits**: System automatically falls back to basic functionality
- **API Key Issues**: Check key validity and permissions

## 🗄️ Database Setup

### Database Schema

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Database Initialization

The application automatically:
- Creates the products table if it doesn't exist
- Sets up necessary indexes
- Handles connection pooling
- Provides mock database fallback

### Database Scripts

```bash
# Initialize database schema
npm run db:init

# Clear database (development only)
curl -X POST http://localhost:3000/api/products/clear
```

## 🖼️ Image Sources Configuration

### Multiple Image Sources

The application uses intelligent image source management:

1. **Sephora Images**: For beauty products (when accessible)
2. **Placeholder Services**: Reliable fallback options
3. **CORS Checking**: Validates image accessibility

### CORS Configuration

The system automatically:
- Checks image accessibility using HEAD requests
- Caches results to avoid repeated checks
- Falls back gracefully when images are unavailable

### Testing Image Sources

```bash
# Test image source accessibility
GET /api/test-image-sources?productName=Foundation&brand=Fenty%20Beauty
```

## 🚀 Production Deployment

### Vercel Deployment

1. **Connect Repository**
   - Connect your GitHub repository to Vercel
   - Vercel will automatically detect Next.js

2. **Add Database**
   - Add Vercel Postgres from the dashboard
   - Copy the connection string

3. **Set Environment Variables**
   ```env
   POSTGRES_URL=your_vercel_postgres_connection_string
   NODE_ENV=production
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Deploy**
   - Vercel will automatically build and deploy
   - Database schema will be created automatically

### Local Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables for Production

```env
# Required
POSTGRES_URL=your_production_database_url
NODE_ENV=production

# Optional
GEMINI_API_KEY=your_gemini_api_key_here
```

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

#### Port Conflicts
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5433

# Kill process or change port
kill -9 <PID>
```

#### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Use Node.js 16+ for best compatibility
nvm use 16
```

#### AI Integration Issues
- **Rate Limits**: System automatically falls back
- **Model Errors**: Check API key and model configuration
- **Network Issues**: Check internet connection

### Getting Help

1. **Check Logs**: Look at browser console and server logs
2. **Database Issues**: Use mock database for development
3. **AI Issues**: System works without AI
4. **Image Issues**: System has multiple fallbacks

### Support

- Check the [DEVELOPMENT.md](./DEVELOPMENT.md) for technical details
- Review error messages in browser console
- Check server logs for detailed error information 