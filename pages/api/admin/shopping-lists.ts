import { NextApiRequest, NextApiResponse } from 'next'
import { authQuery } from '../../../lib/auth-db'
import { requireAdmin } from '../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse, user: { id: string; role: string }) {
  if (req.method === 'GET') {
    // Get all active shopping lists
    try {
      const listsResult = await authQuery(
        `SELECT sl.*, u.name as user_name,
                sli.id as item_id, sli.quantity, sli.is_checked_out,
                p.id as product_id, p.name, p.brand, p.price, p.image_url, p.sku
         FROM shopping_lists sl
         JOIN users u ON sl.user_id = u.id
         LEFT JOIN shopping_list_items sli ON sl.id = sli.shopping_list_id
         LEFT JOIN products p ON sli.product_id = p.id
         WHERE sl.is_active = true
         ORDER BY sl.created_at DESC, sli.created_at DESC`,
        []
      )

      // Group by shopping list
      const shoppingListsMap = new Map()
      
      listsResult.rows.forEach(row => {
        if (!shoppingListsMap.has(row.id)) {
          shoppingListsMap.set(row.id, {
            id: row.id,
            user_id: row.user_id,
            name: row.name,
            is_active: row.is_active,
            created_at: row.created_at,
            updated_at: row.updated_at,
            user_name: row.user_name,
            items: []
          })
        }
        
        if (row.item_id) {
          shoppingListsMap.get(row.id).items.push({
            id: row.item_id,
            shopping_list_id: row.id,
            product_id: row.product_id,
            quantity: row.quantity,
            is_checked_out: row.is_checked_out,
            created_at: row.created_at,
            updated_at: row.updated_at,
            product: {
              id: row.product_id,
              name: row.name,
              brand: row.brand,
              price: row.price,
              image_url: row.image_url,
              sku: row.sku
            }
          })
        }
      })

      const shoppingLists = Array.from(shoppingListsMap.values())

      // Set cache control headers to prevent caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')

      return res.status(200).json({
        success: true,
        shopping_lists: shoppingLists
      })
    } catch (error) {
      console.error('Error fetching shopping lists:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch shopping lists' })
    }
  }

  if (req.method === 'DELETE') {
    // Clear a shopping list
    try {
      const { list_id } = req.query

      if (!list_id || typeof list_id !== 'string') {
        return res.status(400).json({ success: false, message: 'List ID is required' })
      }

      // Delete all items in the list
      await authQuery(
        'DELETE FROM shopping_list_items WHERE shopping_list_id = $1',
        [list_id]
      )

      // Mark list as inactive
      await authQuery(
        'UPDATE shopping_lists SET is_active = false WHERE id = $1',
        [list_id]
      )

      return res.status(200).json({
        success: true,
        message: 'Shopping list cleared'
      })
    } catch (error) {
      console.error('Error clearing shopping list:', error)
      return res.status(500).json({ success: false, message: 'Failed to clear shopping list' })
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' })
}

export default requireAdmin(handler) 