const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function initDockerDB() {
  console.log('🐳 Initializing Docker database...');
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Import the auth database utility
    const { authQuery } = require('../lib/auth-db');
    
    console.log('📝 Creating authentication tables...');
    
    // Execute the schema statements one by one
    const statements = [
      // Create users table
      `CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'guest' CHECK (role IN ('admin', 'guest')),
        session_token VARCHAR(255),
        session_expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Create shopping_lists table
      `CREATE TABLE IF NOT EXISTS shopping_lists (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // Create shopping_list_items table
      `CREATE TABLE IF NOT EXISTS shopping_list_items (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        is_checked_out BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(shopping_list_id, product_id)
      )`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token)`,
      `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
      `CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_id ON shopping_lists(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_shopping_lists_is_active ON shopping_lists(is_active)`,
      `CREATE INDEX IF NOT EXISTS idx_shopping_list_items_shopping_list_id ON shopping_list_items(shopping_list_id)`,
      `CREATE INDEX IF NOT EXISTS idx_shopping_list_items_product_id ON shopping_list_items(product_id)`,
      
      // Create trigger function if it doesn't exist
      `CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'`,
      
      // Create triggers
      `DROP TRIGGER IF EXISTS update_users_updated_at ON users`,
      `CREATE TRIGGER update_users_updated_at 
          BEFORE UPDATE ON users 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()`,
      
      `DROP TRIGGER IF EXISTS update_shopping_lists_updated_at ON shopping_lists`,
      `CREATE TRIGGER update_shopping_lists_updated_at 
          BEFORE UPDATE ON shopping_lists 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()`,
      
      `DROP TRIGGER IF EXISTS update_shopping_list_items_updated_at ON shopping_list_items`,
      `CREATE TRIGGER update_shopping_list_items_updated_at 
          BEFORE UPDATE ON shopping_list_items 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()`,
      
      // Insert default admin user
      `INSERT INTO users (name, password, role) VALUES ('Olivia', 'wally', 'admin') ON CONFLICT DO NOTHING`
    ];
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`  ${i + 1}/${statements.length}: Executing...`);
        await authQuery(statement);
      } catch (error) {
        // Ignore errors for statements that might already exist
        if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
          console.error(`  Error executing statement: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Docker database initialization complete!');
    console.log('');
    console.log('🎉 Authentication system is ready:');
    console.log('   - Admin password: wally');
    console.log('   - Guest password: winnie');
    
  } catch (error) {
    console.error('❌ Error initializing Docker database:', error);
    process.exit(1);
  }
}

initDockerDB(); 