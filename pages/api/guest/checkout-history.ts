import { NextApiRequest, NextApiResponse } from 'next'
import { authQuery } from '../../../lib/auth-db'
import { requireAuth } from '../../../lib/auth'

async function handler(req: NextApiRequest, res: NextApiResponse, user: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  if (user.role !== 'guest') {
    return res.status(403).json({ success: false, message: 'Guest access only' })
  }

  try {
    // Get all checked out items from the user's shopping lists with product details
    const historyResult = await authQuery(
      `SELECT 
        sli.quantity,
        sli.created_at as checkout_date,
        p.id as product_id,
        p.name,
        p.brand,
        p.price,
        p.image_url,
        p.sku
       FROM shopping_list_items sli
       JOIN shopping_lists sl ON sli.shopping_list_id = sl.id
       JOIN products p ON sli.product_id = p.id
       WHERE sl.user_id = $1 AND sli.is_checked_out = true
       ORDER BY sli.updated_at DESC`,
      [user.id]
    )

    // Calculate totals
    let totalItems = 0
    let totalValue = 0
    const items = historyResult.rows.map(row => {
      const itemTotal = parseFloat(row.price) * row.quantity
      totalItems += row.quantity
      totalValue += itemTotal
      
      return {
        id: row.product_id,
        name: row.name,
        brand: row.brand,
        price: parseFloat(row.price),
        quantity: row.quantity,
        item_total: itemTotal,
        image_url: row.image_url,
        sku: row.sku,
        checkout_date: row.checkout_date
      }
    })

    return res.status(200).json({
      success: true,
      checkout_history: {
        items,
        summary: {
          total_items: totalItems,
          total_value: totalValue,
          unique_products: items.length
        }
      }
    })
  } catch (error) {
    console.error('Error fetching checkout history:', error)
    return res.status(500).json({ success: false, message: 'Failed to fetch checkout history' })
  }
}

export default requireAuth(handler) 