import { NextApiRequest, NextApiResponse } from 'next'
import { authQuery } from '../../../lib/auth-db'
import { requireAuth } from '../../../lib/auth'
import { ShoppingListRequest } from '../../../types/product'

async function handler(req: NextApiRequest, res: NextApiResponse, user: any) {
  if (req.method === 'GET') {
    // Get user's shopping list
    try {
      const listResult = await authQuery(
        `SELECT sl.*, 
                sli.id as item_id, sli.quantity, sli.is_checked_out,
                p.id as product_id, p.name, p.brand, p.price, p.image_url, p.sku
         FROM shopping_lists sl
         LEFT JOIN shopping_list_items sli ON sl.id = sli.shopping_list_id
         LEFT JOIN products p ON sli.product_id = p.id
         WHERE sl.user_id = $1 AND sl.is_active = true
         ORDER BY sli.created_at DESC`,
        [user.id]
      )

      if (listResult.rows.length === 0) {
        return res.status(200).json({
          success: true,
          shopping_list: null
        })
      }

      // Group items by shopping list
      const shoppingList = {
        id: listResult.rows[0].id,
        user_id: listResult.rows[0].user_id,
        name: listResult.rows[0].name,
        is_active: listResult.rows[0].is_active,
        created_at: listResult.rows[0].created_at,
        updated_at: listResult.rows[0].updated_at,
        items: listResult.rows
          .filter(row => row.item_id) // Only include rows with items
          .map(row => ({
            id: row.item_id,
            shopping_list_id: row.id,
            product_id: row.product_id,
            quantity: row.quantity,
            is_checked_out: row.is_checked_out,
            created_at: row.created_at,
            updated_at: row.updated_at,
            product: row.product_id ? {
              id: row.product_id,
              name: row.name,
              brand: row.brand,
              price: row.price,
              image_url: row.image_url,
              sku: row.sku
            } : null
          }))
      }

      return res.status(200).json({
        success: true,
        shopping_list: shoppingList
      })
    } catch (error) {
      console.error('Error fetching shopping list:', error)
      return res.status(500).json({ success: false, message: 'Failed to fetch shopping list' })
    }
  }

  if (req.method === 'POST') {
    // Add item to shopping list
    try {
      const { product_id, quantity = 1 }: ShoppingListRequest = req.body

      if (!product_id) {
        return res.status(400).json({ success: false, message: 'Product ID is required' })
      }

      // Get or create shopping list for user
      let listResult = await authQuery(
        'SELECT * FROM shopping_lists WHERE user_id = $1 AND is_active = true',
        [user.id]
      )

      let shoppingListId: string
      if (listResult.rows.length === 0) {
        // Create new shopping list
        const newListResult = await authQuery(
          'INSERT INTO shopping_lists (user_id, name) VALUES ($1, $2) RETURNING *',
          [user.id, `${user.name}'s Shopping List`]
        )
        shoppingListId = newListResult.rows[0].id
      } else {
        shoppingListId = listResult.rows[0].id
      }

      // Check if item already exists in list
      const existingItemResult = await authQuery(
        'SELECT * FROM shopping_list_items WHERE shopping_list_id = $1 AND product_id = $2',
        [shoppingListId, product_id]
      )

      if (existingItemResult.rows.length > 0) {
        // Update quantity
        await authQuery(
          'UPDATE shopping_list_items SET quantity = quantity + $1 WHERE id = $2',
          [quantity, existingItemResult.rows[0].id]
        )
      } else {
        // Add new item
        await authQuery(
          'INSERT INTO shopping_list_items (shopping_list_id, product_id, quantity) VALUES ($1, $2, $3)',
          [shoppingListId, product_id, quantity]
        )
      }

      return res.status(200).json({
        success: true,
        message: 'Item added to shopping list'
      })
    } catch (error) {
      console.error('Error adding item to shopping list:', error)
      return res.status(500).json({ success: false, message: 'Failed to add item to shopping list' })
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' })
}

export default requireAuth(handler) 