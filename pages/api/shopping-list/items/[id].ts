import { NextApiRequest, NextApiResponse } from 'next'
import { authQuery } from '../../../../lib/auth-db'
import { requireAuth } from '../../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Item ID is required' })
  }

  if (req.method === 'PUT') {
    // Update item quantity
    try {
      const { quantity } = req.body

      if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ success: false, message: 'Valid quantity is required' })
      }

      // Verify user owns this item
      const itemResult = await authQuery(
        `SELECT sli.* FROM shopping_list_items sli
         JOIN shopping_lists sl ON sli.shopping_list_id = sl.id
         WHERE sli.id = $1 AND sl.user_id = $2`,
        [id, user.id]
      )

      if (itemResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Item not found' })
      }

      await authQuery(
        'UPDATE shopping_list_items SET quantity = $1 WHERE id = $2',
        [quantity, id]
      )

      return res.status(200).json({
        success: true,
        message: 'Item quantity updated'
      })
    } catch (error) {
      console.error('Error updating item quantity:', error)
      return res.status(500).json({ success: false, message: 'Failed to update item quantity' })
    }
  }

  if (req.method === 'PATCH') {
    // Check out item
    try {
      const { is_checked_out } = req.body

      if (typeof is_checked_out !== 'boolean') {
        return res.status(400).json({ success: false, message: 'is_checked_out boolean is required' })
      }

      // Verify user owns this item
      const itemResult = await authQuery(
        `SELECT sli.* FROM shopping_list_items sli
         JOIN shopping_lists sl ON sli.shopping_list_id = sl.id
         WHERE sli.id = $1 AND sl.user_id = $2`,
        [id, user.id]
      )

      if (itemResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Item not found' })
      }

      await authQuery(
        'UPDATE shopping_list_items SET is_checked_out = $1 WHERE id = $2',
        [is_checked_out, id]
      )

      // If item was checked out, check if all items in the list are now checked out
      if (is_checked_out) {
        const shoppingListId = itemResult.rows[0].shopping_list_id
        
        // Check if all items in this shopping list are checked out
        const allItemsResult = await authQuery(
          'SELECT COUNT(*) as total_items, COUNT(CASE WHEN is_checked_out = true THEN 1 END) as checked_out_items FROM shopping_list_items WHERE shopping_list_id = $1',
          [shoppingListId]
        )
        
        const { total_items, checked_out_items } = allItemsResult.rows[0]
        
        // If all items are checked out, remove the shopping list
        if (parseInt(total_items) > 0 && parseInt(total_items) === parseInt(checked_out_items)) {
          await authQuery(
            'UPDATE shopping_lists SET is_active = false WHERE id = $1',
            [shoppingListId]
          )
          
          return res.status(200).json({
            success: true,
            message: 'Item checked out and shopping list completed',
            list_completed: true
          })
        }
      }

      return res.status(200).json({
        success: true,
        message: is_checked_out ? 'Item checked out' : 'Item unchecked'
      })
    } catch (error) {
      console.error('Error checking out item:', error)
      return res.status(500).json({ success: false, message: 'Failed to check out item' })
    }
  }

  if (req.method === 'DELETE') {
    // Remove item from list
    try {
      // Verify user owns this item
      const itemResult = await authQuery(
        `SELECT sli.* FROM shopping_list_items sli
         JOIN shopping_lists sl ON sli.shopping_list_id = sl.id
         WHERE sli.id = $1 AND sl.user_id = $2`,
        [id, user.id]
      )

      if (itemResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Item not found' })
      }

      await authQuery(
        'DELETE FROM shopping_list_items WHERE id = $1',
        [id]
      )

      return res.status(200).json({
        success: true,
        message: 'Item removed from shopping list'
      })
    } catch (error) {
      console.error('Error removing item:', error)
      return res.status(500).json({ success: false, message: 'Failed to remove item' })
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' })
}

export default requireAuth(handler) 