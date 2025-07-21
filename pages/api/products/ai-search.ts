import { NextApiRequest, NextApiResponse } from 'next'
import { searchProductByNameAndBrand, parseProductFromImage, enrichProductInfo } from '../../../lib/ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { type, name, brand, imageBase64 } = req.body

    if (!type || (type !== 'name' && type !== 'image')) {
      return res.status(400).json({ error: 'Invalid search type. Must be "name" or "image"' })
    }

    let result

    if (type === 'name') {
      if (!name || !brand) {
        return res.status(400).json({ error: 'Name and brand are required for name search' })
      }

      result = await searchProductByNameAndBrand(name, brand)
    } else if (type === 'image') {
      if (!imageBase64) {
        return res.status(400).json({ error: 'Image data is required for image search' })
      }

      result = await parseProductFromImage(imageBase64)
      
      // Add UPC field to the response if it exists
      if (result && result.found && result.upc) {
        result.upc = result.upc
      }
    }

    // Enrich the result with additional AI processing if we found a product
    if (result && result.found && result.name && result.brand) {
      try {
        const enrichedInfo = await enrichProductInfo(result.name, result.brand)
        
        // Merge enriched information with original result
        result = {
          ...result,
          name: enrichedInfo.cleanedName || result.name,
          description: enrichedInfo.description || result.description,
          price: enrichedInfo.price || result.price,
          size: enrichedInfo.size || result.size,
          category: enrichedInfo.category || result.category,
          ingredients: enrichedInfo.ingredients
        }
      } catch (error) {
        console.error('Error enriching product info:', error)
        // Continue with original result if enrichment fails
      }
    }

    if (!result) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.status(200).json(result)
  } catch (error) {
    console.error('AI search error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
} 