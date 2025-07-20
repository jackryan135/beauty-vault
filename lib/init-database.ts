import { authQuery } from './auth-db'

export async function initializeDatabase() {
  console.log('🔧 Initializing database...')
  
  try {
    // Check if products table exists and what type of ID it uses
    const tableInfoResult = await authQuery(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'id'
    `)
    
    let needsMigration = false
    if (tableInfoResult.rows.length > 0) {
      const idType = tableInfoResult.rows[0].data_type
      if (idType !== 'uuid') {
        console.log(`⚠️  Products table uses ${idType} IDs, need to migrate to UUID`)
        needsMigration = true
      }
    }
    
    // Create or update products table with UUID
    console.log('📦 Setting up products table...')
    await authQuery(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        sku VARCHAR(255) NOT NULL UNIQUE,
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
      )
    `)
    
    // Add status column if it doesn't exist
    await authQuery(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'products' AND column_name = 'status') THEN
          ALTER TABLE products ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'in_vault';
        END IF;
      END $$;
    `)
    
    // Add status check constraint if it doesn't exist
    await authQuery(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                       WHERE constraint_name = 'products_status_check') THEN
          ALTER TABLE products ADD CONSTRAINT products_status_check 
          CHECK (status IN ('in_vault', 'on_shelf', 'used_up'));
        END IF;
      END $$;
    `)
    
    // Create users table
    console.log('👥 Setting up users table...')
    await authQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'guest' CHECK (role IN ('admin', 'guest')),
        session_token VARCHAR(255),
        session_expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    
    // Create shopping_lists table
    console.log('🛒 Setting up shopping_lists table...')
    await authQuery(`
      CREATE TABLE IF NOT EXISTS shopping_lists (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    
    // Create shopping_list_items table
    console.log('📝 Setting up shopping_list_items table...')
    await authQuery(`
      CREATE TABLE IF NOT EXISTS shopping_list_items (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        is_checked_out BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(shopping_list_id, product_id)
      )
    `)
    
    // Create indexes
    console.log('📊 Creating indexes...')
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)',
      'CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)',
      'CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)',
      'CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_shopping_lists_is_active ON shopping_lists(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_shopping_list_items_shopping_list_id ON shopping_list_items(shopping_list_id)',
      'CREATE INDEX IF NOT EXISTS idx_shopping_list_items_product_id ON shopping_list_items(product_id)'
    ]
    
    for (const index of indexes) {
      await authQuery(index)
    }
    
    // Create trigger function
    console.log('🔧 Setting up triggers...')
    await authQuery(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `)
    
    // Create triggers
    const triggers = [
      'DROP TRIGGER IF EXISTS update_products_updated_at ON products',
      'CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'DROP TRIGGER IF EXISTS update_users_updated_at ON users',
      'CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'DROP TRIGGER IF EXISTS update_shopping_lists_updated_at ON shopping_lists',
      'CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'DROP TRIGGER IF EXISTS update_shopping_list_items_updated_at ON shopping_list_items',
      'CREATE TRIGGER update_shopping_list_items_updated_at BEFORE UPDATE ON shopping_list_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()'
    ]
    
    for (const trigger of triggers) {
      await authQuery(trigger)
    }
    
    // Insert default admin user
    console.log('👑 Creating default admin user...')
    await authQuery(`
      INSERT INTO users (name, password, role) 
      VALUES ('Olivia', 'wally', 'admin') 
      ON CONFLICT DO NOTHING
    `)
    
    // Update existing products to have proper status
    console.log('🔄 Updating existing products...')
    await authQuery(`
      UPDATE products SET status = 'used_up' WHERE is_active = false AND status = 'in_vault'
    `)
    await authQuery(`
      UPDATE products SET status = 'in_vault' WHERE is_active = true AND status IS NULL
    `)
    
    console.log('✅ Database initialization complete!')
    return { success: true, needsMigration }
    
  } catch (error: any) {
    console.error('❌ Database initialization error:', error)
    throw error
  }
} 