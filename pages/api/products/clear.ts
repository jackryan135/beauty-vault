import { NextApiRequest, NextApiResponse } from 'next'
import { db, initializeDatabase } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    // Ensure database is initialized
    await initializeDatabase()
    
    // Clear all products
    await db.query('DELETE FROM products')
    
    console.log('Database cleared successfully')
    
    res.status(200).json({ 
      message: 'Database cleared successfully',
      deletedCount: 'all products'
    })
  } catch (error) {
    console.error('Error clearing database:', error)
    res.status(500).json({ error: 'Failed to clear database' })
  }
} 