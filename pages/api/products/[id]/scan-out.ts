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

  if (req.method === 'PATCH') {
    try {
      const { id } = req.query

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Product ID is required' })
      }

      // Get current product
      const { rows: currentProduct } = await db.query('SELECT * FROM products WHERE id = $1', [id])

      if (currentProduct.length === 0) {
        return res.status(404).json({ error: 'Product not found' })
      }

      const product = currentProduct[0] as any
      const newQuantity = Math.max(0, product.quantity - 1)
      const isActive = newQuantity > 0
      const newStatus = isActive ? product.status : 'used_up'

      // Update product quantity, status, and metadata
      const { rows } = await db.query(
        'UPDATE products SET quantity = $1, is_active = $2, status = $3, metadata = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
        [
          newQuantity,
          isActive,
          newStatus,
          {
            ...product.metadata,
            last_used: new Date().toISOString(),
            usage_count: (product.metadata?.usage_count || 0) + 1
          },
          id
        ]
      )

      res.status(200).json({
        ...rows[0],
        action: 'scanned_out',
        message: `Product scanned out. Quantity: ${newQuantity}`
      })
    } catch (error) {
      console.error('Error scanning out product:', error)
      res.status(500).json({ error: 'Failed to scan out product' })
    }
  } else {
    res.setHeader('Allow', ['PATCH'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
} 