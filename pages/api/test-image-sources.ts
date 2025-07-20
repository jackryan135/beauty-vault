import { NextApiRequest, NextApiResponse } from 'next'
import { checkImageAccessibility, generateSephoraImageUrl, getBestImageUrl } from '../../lib/image-sources'

/**
 * Test endpoint for image source accessibility
 * Useful for debugging image loading issues
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { productName, brand, url } = req.query

  if (!productName || !brand) {
    return res.status(400).json({ error: 'productName and brand are required' })
  }

  try {
    const results: {
      productName: string
      brand: string
      sephoraUrl: string
      tests: any
      bestImageUrl?: string
    } = {
      productName: productName as string,
      brand: brand as string,
      sephoraUrl: generateSephoraImageUrl(productName as string, brand as string),
      tests: {}
    }

    const sephoraUrl = generateSephoraImageUrl(productName as string, brand as string)
    results.tests.sephora = await checkImageAccessibility(sephoraUrl)

    if (url) {
      results.tests.providedUrl = await checkImageAccessibility(url as string)
    }

    const placeholderUrl = `https://placehold.co/400x400/fce7f3/ec4899?text=${encodeURIComponent(productName as string)}`
    results.tests.placeholder = await checkImageAccessibility(placeholderUrl)

    results.bestImageUrl = await getBestImageUrl(productName as string, brand as string, url as string)

    res.status(200).json(results)
  } catch (error) {
    console.error('Image source test error:', error)
    res.status(500).json({ error: 'Failed to test image sources' })
  }
} 