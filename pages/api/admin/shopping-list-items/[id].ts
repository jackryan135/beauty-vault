import { NextApiRequest, NextApiResponse } from 'next'
import { authQuery } from '../../../../lib/auth-db'
import { requireAdmin } from '../../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse, user: any) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, message: 'Item ID is required' })
  }

  if (req.method === 'PATCH') {
    // Check out item
    try {
      const { is_checked_out } = req.body

      if (typeof is_checked_out !== 'boolean') {
        return res.status(400).json({ success: false, message: 'is_checked_out boolean is required' })
      }

      if (is_checked_out) {
        // Get the shopping list item to find the product
        const itemResult = await authQuery(
          'SELECT sli.quantity as item_quantity, sli.product_id, p.quantity as product_quantity, p.is_active, p.status, p.metadata FROM shopping_list_items sli JOIN products p ON sli.product_id = p.id WHERE sli.id = $1',
          [id]
        )

        if (itemResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Shopping list item not found' })
        }

        const item = itemResult.rows[0]

        // Scan out the product (reduce quantity)
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

      await authQuery(
        'UPDATE shopping_list_items SET is_checked_out = $1 WHERE id = $2',
        [is_checked_out, id]
      )

      // If item was checked out, check if all items in the list are now checked out
      if (is_checked_out) {
        // Get the shopping list ID for this item
        const listIdResult = await authQuery(
          'SELECT shopping_list_id FROM shopping_list_items WHERE id = $1',
          [id]
        )
        
        if (listIdResult.rows.length > 0) {
          const shoppingListId = listIdResult.rows[0].shopping_list_id
          
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
              message: 'Item checked out, product scanned out, and shopping list completed',
              list_completed: true
            })
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: is_checked_out ? 'Item checked out and product scanned out' : 'Item unchecked'
      })
    } catch (error) {
      console.error('Error checking out item:', error)
      return res.status(500).json({ success: false, message: 'Failed to check out item' })
    }
  }

  if (req.method === 'DELETE') {
    // Remove item from list
    try {
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

export default requireAdmin(handler) 