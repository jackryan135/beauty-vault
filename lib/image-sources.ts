export interface ImageSource {
  name: string
  baseUrl: string
  priority: number
  corsEnabled: boolean
}

/**
 * Image sources in order of preference
 */
const IMAGE_SOURCES: ImageSource[] = [
  {
    name: 'Sephora',
    baseUrl: 'https://www.sephora.com',
    priority: 1,
    corsEnabled: false
  },
  {
    name: 'Placeholder',
    baseUrl: 'https://placehold.co',
    priority: 2,
    corsEnabled: true
  },
  {
    name: 'DummyImage',
    baseUrl: 'https://dummyimage.com',
    priority: 3,
    corsEnabled: true
  }
]

/**
 * Cache for CORS check results
 */
const corsCache = new Map<string, boolean>()

/**
 * Checks if an image URL is accessible using server-side HEAD request
 */
export async function checkImageAccessibility(url: string): Promise<boolean> {
  if (!url) return false
  
  if (corsCache.has(url)) {
    return corsCache.get(url)!
  }
  
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProductCatalog/1.0)'
      }
    })
    
    const isAccessible = response.ok && response.headers.get('content-type')?.startsWith('image/')
    corsCache.set(url, isAccessible)
    return isAccessible
    
  } catch (error) {
    console.log(`CORS check failed for ${url}:`, error)
    corsCache.set(url, false)
    return false
  }
}

/**
 * Generates Sephora-style product image URLs
 * Note: This is a simplified implementation. Production would need Sephora API access.
 */
export function generateSephoraImageUrl(productName: string, brand: string): string {
  const cleanProductName = productName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
  
  const cleanBrand = brand.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30)
  
  const productId = `${cleanBrand}-${cleanProductName}`.replace(/[^a-z0-9-]/g, '')
  
  return `https://www.sephora.com/productimages/sku/s${productId}-main.jpg`
}

/**
 * Gets the best available image URL from multiple sources
 */
export async function getBestImageUrl(
  productName: string, 
  brand: string, 
  preferredUrl?: string
): Promise<string> {
  if (preferredUrl) {
    const isAccessible = await checkImageAccessibility(preferredUrl)
    if (isAccessible) {
      return preferredUrl
    }
  }
  
  if (isBeautyProduct(productName, brand)) {
    const sephoraUrl = generateSephoraImageUrl(productName, brand)
    const sephoraAccessible = await checkImageAccessibility(sephoraUrl)
    if (sephoraAccessible) {
      console.log(`Using Sephora image for ${productName}`)
      return sephoraUrl
    }
  }
  
  const placeholderUrl = `https://placehold.co/400x400/fce7f3/ec4899?text=${encodeURIComponent(productName)}`
  return placeholderUrl
}

/**
 * Determines if a product is likely a beauty product based on keywords
 */
function isBeautyProduct(productName: string, brand: string): boolean {
  const beautyKeywords = [
    // Skincare
    'foundation', 'concealer', 'powder', 'blush', 'bronzer', 'highlighter',
    'eyeshadow', 'mascara', 'eyeliner', 'lipstick', 'lip gloss', 'primer',
    'moisturizer', 'cleanser', 'serum', 'toner', 'mask', 'cream', 'lotion',
    'shampoo', 'conditioner', 'hair', 'nail', 'perfume', 'fragrance',
    'skincare', 'essence', 'eye cream', 'facial oil', 'treatment', 'sunscreen',
    'spf', 'retinol', 'peptide', 'hyaluronic', 'vitamin c', 'niacinamide',
    'aha', 'bha', 'exfoliant', 'face wash', 'facial cleanser', 'night cream',
    'day cream', 'spot treatment', 'acne treatment', 'brow', 'eyebrow',
    'setting spray', 'lip liner', 'lip balm', 'hair mask', 'hair oil',
    'hair serum', 'hair treatment', 'hair spray', 'hair gel', 'hair cream',
    'hair mousse', 'dry shampoo', 'body lotion', 'body wash', 'body scrub',
    'body oil', 'hand cream', 'foot cream', 'deodorant', 'body mist',
    'body spray', 'cologne', 'eau de toilette', 'eau de parfum', 'parfum'
  ]
  
  const beautyBrands = [
    'sephora', 'ulta', 'fenty', 'glossier', 'charlotte tilbury', 'rare beauty',
    'nars', 'mac', 'urban decay', 'anastasia', 'huda beauty', 'too faced',
    'tarte', 'bare minerals', 'benefit', 'milk makeup', 'clinique', 'estee lauder',
    'lancome', 'dior', 'chanel', 'ysl', 'guerlain', 'shiseido', 'sk-ii',
    'la mer', 'la prairie', 'drunk elephant', 'the ordinary', 'paula\'s choice',
    'cerave', 'neutrogena', 'olay', 'kiehl\'s', 'fresh', 'origins', 'clinique'
  ]
  
  const nameLower = productName.toLowerCase()
  const brandLower = brand.toLowerCase()
  
  const hasBeautyKeyword = beautyKeywords.some(keyword => nameLower.includes(keyword))
  const isBeautyBrand = beautyBrands.some(brandKeyword => brandLower.includes(brandKeyword))
  
  return hasBeautyKeyword || isBeautyBrand
}

/**
 * Clears the CORS cache
 */
export function clearCorsCache(): void {
  corsCache.clear()
}

/**
 * Returns CORS cache statistics
 */
export function getCorsCacheStats(): { size: number, entries: Array<{ url: string, accessible: boolean }> } {
  return {
    size: corsCache.size,
    entries: Array.from(corsCache.entries()).map(([url, accessible]) => ({ url, accessible }))
  }
} 