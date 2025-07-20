import { GoogleGenerativeAI } from '@google/generative-ai'
import { getBestImageUrl } from './image-sources'

interface AIProductInfo {
  name: string
  brand: string
  price: number
  image_url: string
  found?: boolean
}

/**
 * Initialize Gemini AI with API key validation
 */
const genAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

/**
 * Main function to generate product information using AI with fallback
 */
export async function generateProductInfo(sku: string): Promise<AIProductInfo> {
  try {
    if (genAI && process.env.GEMINI_API_KEY) {
      const result = await searchForRealProductWithGemini(sku)
      if (result?.found) {
        return result
      }
    }
  } catch (error) {
    console.error('Gemini AI error, falling back to basic search:', error)
  }

  return await searchForBasicProduct(sku)
}

/**
 * Searches for real products using Gemini AI
 */
async function searchForRealProductWithGemini(sku: string): Promise<AIProductInfo | null> {
  if (!genAI) {
    throw new Error('Gemini AI not initialized')
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
  
  const prompt = `Search for a REAL beauty product with SKU: ${sku}. 

  If you find information about a real beauty product with this SKU, return ONLY a valid JSON object:
  {
    "name": "Exact Product Name",
    "brand": "Brand Name", 
    "price": 25.99,
    "image_url": "https://placehold.co/400x400/fce7f3/ec4899?text=Product%20Name",
    "found": true
  }

  If you cannot find a real product with this SKU, return:
  {
    "name": "Product Not Found",
    "brand": "Unknown",
    "price": 0,
    "image_url": "https://placehold.co/400x400/fce7f3/ec4899?text=Product%20Not%20Found",
    "found": false
  }

  IMPORTANT: Only return information about REAL products that actually exist. Do not invent or generate fictional products. If you're not sure about a product, mark it as not found.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const productInfo = JSON.parse(jsonMatch[0])
      
      if (productInfo.found === false) {
        return {
          name: 'Product Not Found',
          brand: 'Unknown',
          price: 0,
          image_url: `https://placehold.co/400x400/fce7f3/ec4899?text=Product%20Not%20Found`,
          found: false
        }
      }
      
      if (productInfo.found === true && productInfo.name && productInfo.brand) {
        const imageUrl = await getBestImageUrl(
          productInfo.name,
          productInfo.brand,
          productInfo.image_url
        )
        
        return {
          name: productInfo.name,
          brand: productInfo.brand,
          price: Math.max(0, Math.min(1000, Number(productInfo.price) || 0)),
          image_url: imageUrl,
          found: true
        }
      }
    }
    
    throw new Error('Invalid JSON response from Gemini')
  } catch (error) {
    console.error('Error parsing Gemini response:', error)
    if (error.message?.includes('not found for API version')) {
      console.error('Gemini model not found - please check API configuration')
      return null
    }
    throw error
  }
}

/**
 * Basic product search using SKU pattern matching when AI is unavailable
 */
async function searchForBasicProduct(sku: string): Promise<AIProductInfo> {
  const skuUpper = sku.toUpperCase()
  
  // Brand pattern matching
  const brandPatterns = {
    'SEPHORA': 'Sephora Collection',
    'FENTY': 'Fenty Beauty',
    'GLOSSIER': 'Glossier',
    'CHARLOTTE': 'Charlotte Tilbury',
    'RARE': 'Rare Beauty',
    'NARS': 'NARS',
    'MAC': 'MAC',
    'URBAN': 'Urban Decay',
    'ANASTASIA': 'Anastasia Beverly Hills',
    'HUDA': 'Huda Beauty',
    'TOO FACED': 'Too Faced',
    'TARTE': 'Tarte',
    'BARE MINERALS': 'BareMinerals',
    'BENEFIT': 'Benefit',
    'MILK': 'Milk Makeup'
  }
  
  let foundBrand = 'Unknown Brand'
  for (const [pattern, brand] of Object.entries(brandPatterns)) {
    if (skuUpper.includes(pattern)) {
      foundBrand = brand
      break
    }
  }
  
  // Product type pattern matching
  const productPatterns = {
    'FOUNDATION': 'Foundation',
    'CONCEALER': 'Concealer',
    'POWDER': 'Powder',
    'BLUSH': 'Blush',
    'BRONZER': 'Bronzer',
    'HIGHLIGHT': 'Highlighter',
    'EYESHADOW': 'Eyeshadow',
    'MASCARA': 'Mascara',
    'EYELINER': 'Eyeliner',
    'LIPSTICK': 'Lipstick',
    'LIP GLOSS': 'Lip Gloss',
    'PRIMER': 'Primer',
    'CLEANSER': 'Cleanser',
    'MOISTURIZER': 'Moisturizer',
    'SERUM': 'Serum',
    'MASK': 'Face Mask',
    'EYE CREAM': 'Eye Cream',
    'TONER': 'Toner',
    'OIL': 'Facial Oil'
  }
  
  let foundProduct = 'Beauty Product'
  for (const [pattern, product] of Object.entries(productPatterns)) {
    if (skuUpper.includes(pattern)) {
      foundProduct = product
      break
    }
  }
  
  const hasBrandPattern = foundBrand !== 'Unknown Brand'
  const hasProductPattern = foundProduct !== 'Beauty Product'
  
  const productName = `${foundBrand} ${foundProduct}`
  const imageUrl = await getBestImageUrl(productName, foundBrand)
  
  return {
    name: productName,
    brand: foundBrand,
    price: 0,
    image_url: imageUrl,
    found: hasBrandPattern || hasProductPattern
  }
}

/**
 * Simple hash function for deterministic operations
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
} 