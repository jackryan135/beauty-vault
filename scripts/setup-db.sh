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

# Create products table with status column
echo "🗂️  Creating products table..."
psql -U $DB_USER -h localhost -d $DB_NAME -c "
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    image_url TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(20) NOT NULL DEFAULT 'in_vault' CHECK (status IN ('in_vault', 'on_shelf', 'used_up')),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
"

# Add status column to existing table if it doesn't exist
echo "🔄 Checking for status column migration..."
psql -U $DB_USER -h localhost -d $DB_NAME -c "
DO \$\$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'status') THEN
        ALTER TABLE products ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'in_vault';
    END IF;
END \$\$;
"

# Add check constraint if it doesn't exist
psql -U $DB_USER -h localhost -d $DB_NAME -c "
DO \$\$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'products_status_check') THEN
        ALTER TABLE products ADD CONSTRAINT products_status_check 
        CHECK (status IN ('in_vault', 'on_shelf', 'used_up'));
    END IF;
END \$\$;
"

# Create indexes
echo "📊 Creating indexes..."
psql -U $DB_USER -h localhost -d $DB_NAME -c "
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
"

# Create trigger function and trigger
echo "🔧 Creating trigger function and trigger..."
psql -U $DB_USER -h localhost -d $DB_NAME -c "
-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
\$\$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
"

# Update existing products to have proper status
echo "🔄 Updating existing products with proper status..."
psql -U $DB_USER -h localhost -d $DB_NAME -c "
-- Set used_up for inactive products
UPDATE products SET status = 'used_up' WHERE is_active = false AND status = 'in_vault';

-- Ensure all active products have either in_vault or on_shelf status
UPDATE products SET status = 'in_vault' WHERE is_active = true AND status IS NULL;
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