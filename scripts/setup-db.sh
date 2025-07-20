#!/bin/bash

# Olivia's Beauty Vault - Database Setup Script
# This script sets up a local PostgreSQL database for development

echo "🎨 Setting up Olivia's Beauty Vault Database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   On macOS: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# Check if PostgreSQL service is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL service is not running. Please start PostgreSQL first."
    echo "   On macOS: brew services start postgresql"
    echo "   On Ubuntu: sudo systemctl start postgresql"
    exit 1
fi

# Database configuration
DB_NAME="olivias_beauty_vault"
DB_USER="postgres"
DB_PASSWORD="password"

echo "📦 Creating database: $DB_NAME"

# Create database if it doesn't exist
psql -U $DB_USER -h localhost -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"

# Create products table
echo "🗂️  Creating products table..."
psql -U $DB_USER -h localhost -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS products (
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
"

# Create indexes
echo "📊 Creating indexes..."
psql -U $DB_USER -h localhost -d $DB_NAME -c "
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
"

echo "✅ Database setup complete!"
echo ""
echo "🎉 Olivia's Beauty Vault database is ready!"
echo ""
echo "📋 Next steps:"
echo "   1. Copy env.local.example to .env.local"
echo "   2. Update the database password in .env.local if needed"
echo "   3. Run 'npm run dev' to start the application"
echo ""
echo "💡 The database will automatically initialize when you start the app" 