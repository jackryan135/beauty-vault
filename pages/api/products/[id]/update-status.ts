import { NextApiRequest, NextApiResponse } from 'next'
import { db, initializeDatabase } from '../../../../lib/db'

// Initialize database on first API call
let dbInitialized = false

async function ensureDatabaseInitialized() {
  if (!dbInitialized) {
    try {
      await initializeDatabase()
      dbInitialized = true
    } catch (error) {
      console.error('Database initialization failed:', error)
      // Continue with mock database if initialization fails
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure database is initialized before any operations
  await ensureDatabaseInitialized()

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query
  const { status } = req.body

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Product ID is required' })
  }

  if (!status || !['in_vault', 'on_shelf'].includes(status)) {
    return res.status(400).json({ message: 'Valid status is required (in_vault or on_shelf)' })
  }

  try {
    const { rows } = await db.query(
      'UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    )

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.status(200).json({ 
      success: true, 
      data: rows[0],
      message: `Product status updated to ${status}` 
    })
  } catch (error) {
    console.error('Error updating product status:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
} 