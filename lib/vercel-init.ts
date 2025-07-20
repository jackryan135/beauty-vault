import { initializeDatabase } from './init-database'

// This function will be called during Vercel deployment
export async function vercelDatabaseInit() {
  // Only run in production environment
  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 Vercel deployment detected, initializing database...')
    try {
      await initializeDatabase()
      console.log('✅ Vercel database initialization complete!')
    } catch (error) {
      console.error('❌ Vercel database initialization failed:', error)
      // Don't throw error in production to avoid deployment failure
    }
  }
}

// Auto-run on module import in production
if (process.env.NODE_ENV === 'production') {
  vercelDatabaseInit()
} 