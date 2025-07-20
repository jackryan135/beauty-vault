import { NextApiRequest, NextApiResponse } from 'next'
import { db, initializeDatabase } from '../../../lib/db'
import { ProductFetcher } from '../../../lib/product-fetcher'

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

  if (req.method === 'GET') {
    try {
      const { rows } = await db.query('SELECT * FROM products ORDER BY created_at DESC')
      res.status(200).json(rows)
    } catch (error) {
      console.error('Error fetching products:', error)
      // Return empty array instead of error to prevent frontend crash
      res.status(200).json([])
    }
  } else if (req.method === 'POST') {
    try {
      const { sku } = req.body

      if (!sku) {
        return res.status(400).json({ error: 'SKU is required' })
      }

      // Check if product already exists
      const existingProduct = await db.query('SELECT * FROM products WHERE sku = $1', [sku])

      if (existingProduct.rows.length > 0) {
        // Update existing product - SCAN IN (increase quantity)
        const product = existingProduct.rows[0]
        const newEntryCount = (product.metadata?.entry_count || 0) + 1
        const newQuantity = product.quantity + 1

        const { rows } = await db.query(
          'UPDATE products SET quantity = $1, is_active = $2, metadata = $3, updated_at = NOW() WHERE sku = $4 RETURNING *',
          [newQuantity, true, { ...product.metadata, entry_count: newEntryCount }, sku]
        )

        return res.status(200).json({
          ...rows[0],
          action: 'scanned_in',
          message: `Product scanned in. Quantity: ${newQuantity}`
        })
      }

      // Create new product - FIRST TIME ADD
      console.log(`Fetching product information for SKU: ${sku}`)
      const productFetcher = ProductFetcher.getInstance()
      const productInfo = await productFetcher.fetchProduct(sku)

      const { rows } = await db.query(
        'INSERT INTO products (sku, name, brand, price, image_url, quantity, is_active, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          sku, 
          productInfo.name, 
          productInfo.brand, 
          productInfo.price, 
          productInfo.image_url, 
          1, 
          true, 
          { 
            entry_count: 1,
            description: productInfo.description,
            category: productInfo.category,
            size: productInfo.size,
            rating: productInfo.rating,
            reviews: productInfo.reviews,
            source: productInfo.description ? 'real_data' : 'ai_generated',
            found: productInfo.found
          }
        ]
      )

      res.status(200).json({
        ...rows[0],
        action: 'added',
        message: productInfo.found ? 'Product added to catalog' : 'Product added (information not found)',
        productInfo: {
          description: productInfo.description,
          category: productInfo.category,
          size: productInfo.size,
          rating: productInfo.rating,
          reviews: productInfo.reviews,
          found: productInfo.found
        }
      })
    } catch (error) {
      console.error('Error adding product:', error)
      res.status(500).json({ error: 'Failed to add product' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
} 