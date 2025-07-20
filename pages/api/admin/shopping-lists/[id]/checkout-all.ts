import { NextApiRequest, NextApiResponse } from 'next'
import { authQuery } from '../../../../../lib/auth-db'
import { requireAdmin } from '../../../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'List ID is required' })
  }

  if (req.method === 'POST') {
    // Check out all items in the list
    try {
      // Get all items in the list with product information
      const itemsResult = await authQuery(
        `SELECT sli.quantity as item_quantity, sli.product_id, p.quantity as product_quantity, p.is_active, p.status, p.metadata 
         FROM shopping_list_items sli 
         JOIN products p ON sli.product_id = p.id 
         WHERE sli.shopping_list_id = $1 AND sli.is_checked_out = false`,
        [id]
      )

      // Scan out each product
      for (const item of itemsResult.rows) {
        const newQuantity = Math.max(0, item.product_quantity - item.item_quantity)
        const isActive = newQuantity > 0
        const newStatus = isActive ? item.status : 'used_up'

        await authQuery(
          'UPDATE products SET quantity = $1, is_active = $2, status = $3, metadata = $4, updated_at = NOW() WHERE id = $5',
          [
            newQuantity,
            isActive,
            newStatus,
            {
              ...item.metadata,
              last_used: new Date().toISOString(),
              usage_count: (item.metadata?.usage_count || 0) + item.item_quantity
            },
            item.product_id
          ]
        )
      }

      // Mark all items as checked out
      await authQuery(
        'UPDATE shopping_list_items SET is_checked_out = true WHERE shopping_list_id = $1',
        [id]
      )

      return res.status(200).json({
        success: true,
        message: 'All items checked out and products scanned out'
      })
    } catch (error) {
      console.error('Error checking out all items:', error)
      return res.status(500).json({ success: false, message: 'Failed to check out all items' })
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' })
}

export default requireAdmin(handler) 