import { NextApiRequest, NextApiResponse } from 'next'
import { db, initializeDatabase } from '../../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' })
  }

  try {
    await initializeDatabase()

    const { name, brand, image_url, metadata } = req.body

    // Validate required fields
    if (!name || !brand) {
      return res.status(400).json({ error: 'Name and brand are required' })
    }

    // Update the product
    const result = await db.query(
      `UPDATE products 
       SET name = $1, brand = $2, image_url = $3, metadata = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, brand, image_url, JSON.stringify(metadata), id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    const updatedProduct = result.rows[0]

    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct
    })
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
} 