import { NextApiRequest, NextApiResponse } from 'next'
import { db, initializeDatabase } from '../../../lib/db'
import { Pool } from 'pg'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    console.log('Starting database clear operation...')
    
    // Create a direct connection for this operation
    const pool = new Pool({
      host: process.env.LOCAL_DB_HOST || 'localhost',
      port: parseInt(process.env.LOCAL_DB_PORT || '5432'),
      database: process.env.LOCAL_DB_NAME || 'olivias_beauty_vault',
      user: process.env.LOCAL_DB_USER || 'postgres',
      password: process.env.LOCAL_DB_PASSWORD || 'password',
      ssl: false,
      max: 1,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000,
    })
    
    console.log('Created direct database connection')
    
    const client = await pool.connect()
    try {
      console.log('Connected to database for clear operation')
      
      // First, let's check if we can query the table
      const countResult = await client.query('SELECT COUNT(*) FROM products')
      console.log('Current product count:', countResult.rows[0].count)
      
      // Then try the delete
      const result = await client.query('DELETE FROM products')
      console.log('DELETE query completed:', result)
      
      res.status(200).json({ 
        message: 'Database cleared successfully',
        deletedCount: result.rowCount || 'all products'
      })
    } finally {
      client.release()
      await pool.end()
      console.log('Database connection closed')
    }
  } catch (error) {
    console.error('Error clearing database:', error)
    res.status(500).json({ 
      error: 'Failed to clear database',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 