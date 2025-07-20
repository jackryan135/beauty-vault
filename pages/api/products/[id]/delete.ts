import { NextApiRequest, NextApiResponse } from 'next'
import { authQuery } from '../../../../lib/auth-db'
import { requireAuth } from '../../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Product ID is required' })
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // Check if product exists
    const productResult = await authQuery(
      'SELECT * FROM products WHERE id = $1',
      [id]
    )

    if (productResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    const product = productResult.rows[0]

    // Delete the product
    await authQuery(
      'DELETE FROM products WHERE id = $1',
      [id]
    )

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      deletedProduct: product
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return res.status(500).json({ success: false, message: 'Failed to delete product' })
  }
}

export default requireAuth(handler) 