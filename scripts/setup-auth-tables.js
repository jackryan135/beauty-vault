const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function setupAuthTables() {
  console.log('🔐 Setting up authentication tables...');
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Import the auth database utility
    const { authQuery } = require('../lib/auth-db');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`  ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          await authQuery(statement);
        } catch (error) {
          // Ignore errors for statements that might already exist
          if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
            console.error(`  Error executing statement: ${error.message}`);
          }
        }
      }
    }
    
    console.log('✅ Authentication tables setup complete!');
    console.log('');
    console.log('🎉 You can now use the authentication system:');
    console.log('   - Admin password: wally');
    console.log('   - Guest password: winnie');
    
  } catch (error) {
    console.error('❌ Error setting up authentication tables:', error);
    process.exit(1);
  }
}

setupAuthTables(); 