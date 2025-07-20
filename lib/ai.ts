import { GoogleGenerativeAI } from '@google/generative-ai'
import { getBestImageUrl } from './image-sources'
import { extractSizeFromTitle } from './text-cleaner'

interface AIProductInfo {
  name: string
  brand: string
  price: number
  image_url: string
  found?: boolean
  size?: string
  category?: string
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

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' })
  
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
    'MILK': 'Milk Makeup',
    'CLINIQUE': 'Clinique',
    'ESTEE': 'Estee Lauder',
    'LANCOME': 'Lancome',
    'DIOR': 'Dior',
    'CHANEL': 'Chanel',
    'YSL': 'YSL',
    'GUERLAIN': 'Guerlain',
    'SHISEIDO': 'Shiseido',
    'SKII': 'SK-II',
    'DRUNK': 'Drunk Elephant',
    'ORDINARY': 'The Ordinary',
    'PAULA': 'Paula\'s Choice',
    'CERAVE': 'CeraVe',
    'NEUTROGENA': 'Neutrogena',
    'OLAY': 'Olay'
  }
  
  let foundBrand = 'Unknown Brand'
  for (const [pattern, brand] of Object.entries(brandPatterns)) {
    if (skuUpper.includes(pattern)) {
      foundBrand = brand
      break
    }
  }
  
  // Product type pattern matching with improved categories
  const productPatterns = {
    // Skincare
    'SKINCARE': 'Skincare',
    'MOISTURIZER': 'Skincare',
    'CLEANSER': 'Skincare',
    'SERUM': 'Skincare',
    'TONER': 'Skincare',
    'ESSENCE': 'Skincare',
    'EYE CREAM': 'Skincare',
    'FACIAL OIL': 'Skincare',
    'MASK': 'Skincare',
    'TREATMENT': 'Skincare',
    'SUNSCREEN': 'Skincare',
    'SPF': 'Skincare',
    'RETINOL': 'Skincare',
    'PEPTIDE': 'Skincare',
    'HYALURONIC': 'Skincare',
    'VITAMIN C': 'Skincare',
    'NIACINAMIDE': 'Skincare',
    'AHA': 'Skincare',
    'BHA': 'Skincare',
    'EXFOLIANT': 'Skincare',
    
    // Makeup - Face
    'FOUNDATION': 'Foundation',
    'CONCEALER': 'Concealer',
    'POWDER': 'Powder',
    'BLUSH': 'Blush',
    'BRONZER': 'Bronzer',
    'HIGHLIGHT': 'Highlighter',
    'ILLUMINATOR': 'Highlighter',
    'PRIMER': 'Primer',
    'SETTING SPRAY': 'Setting Spray',
    
    // Makeup - Eyes
    'EYESHADOW': 'Eyeshadow',
    'MASCARA': 'Mascara',
    'EYELINER': 'Eyeliner',
    'BROW': 'Brow',
    'EYEBROW': 'Brow',
    'EYE PRIMER': 'Eye Primer',
    
    // Makeup - Lips
    'LIPSTICK': 'Lipstick',
    'LIP GLOSS': 'Lip Gloss',
    'LIP LINER': 'Lip Liner',
    'LIP BALM': 'Lip Balm',
    
    // Hair Care
    'SHAMPOO': 'Hair Care',
    'CONDITIONER': 'Hair Care',
    'HAIR MASK': 'Hair Care',
    'HAIR OIL': 'Hair Care',
    'HAIR SERUM': 'Hair Care',
    'HAIR TREATMENT': 'Hair Care',
    'HAIR SPRAY': 'Hair Care',
    'HAIR GEL': 'Hair Care',
    'HAIR CREAM': 'Hair Care',
    'HAIR MOUSSE': 'Hair Care',
    'DRY SHAMPOO': 'Hair Care',
    
    // Fragrance
    'PERFUME': 'Fragrance',
    'COLOGNE': 'Fragrance',
    'FRAGRANCE': 'Fragrance',
    'BODY MIST': 'Fragrance',
    'BODY SPRAY': 'Fragrance',
    
    // Body Care
    'BODY LOTION': 'Body Care',
    'BODY WASH': 'Body Care',
    'BODY SCRUB': 'Body Care',
    'BODY OIL': 'Body Care',
    'HAND CREAM': 'Body Care',
    'FOOT CREAM': 'Body Care',
    'DEODORANT': 'Body Care'
  }
  
  let foundProduct = 'Beauty Product'
  let foundCategory = 'Beauty'
  
  for (const [pattern, product] of Object.entries(productPatterns)) {
    if (skuUpper.includes(pattern)) {
      foundProduct = product
      foundCategory = product
      break
    }
  }
  
  const hasBrandPattern = foundBrand !== 'Unknown Brand'
  const hasProductPattern = foundProduct !== 'Beauty Product'
  
  const productName = `${foundBrand} ${foundProduct}`
  const imageUrl = await getBestImageUrl(productName, foundBrand)
  
  // Extract size from product name
  const { size: extractedSize } = extractSizeFromTitle(productName)
  
  return {
    name: productName,
    brand: foundBrand,
    price: 0,
    image_url: imageUrl,
    size: extractedSize,
    category: foundCategory,
    found: hasBrandPattern || hasProductPattern
  }
}

/**
 * Enriches product information using AI when we have basic name/brand from barcode lookup
 */
export async function enrichProductInfo(name: string, brand: string): Promise<{
  description?: string
  price?: number
  size?: string
  category?: string
  ingredients?: string[]
}> {
  try {
    if (!genAI || !process.env.GEMINI_API_KEY) {
      return {}
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' })
    
    const prompt = `I have a beauty product with name: "${name}" and brand: "${brand}". 

Please provide additional information about this product. Return ONLY a valid JSON object with the following structure:

{
  "description": "A brief, accurate description of what this product is and what it does",
  "price": 25.99,
  "size": "1 oz",
  "category": "Skincare",
  "ingredients": ["ingredient1", "ingredient2", "ingredient3"]
}

Rules:
- Only include fields where you can provide accurate information
- For price, provide a reasonable retail price in USD (0 if unknown)
- For size, extract from the product name or provide a common size for this type of product
- For category, choose from: Skincare, Makeup, Hair Care, Fragrance, Body Care, Tools & Accessories, Beauty
- For ingredients, only include if you're confident about the actual ingredients
- If you're not sure about any field, omit it from the JSON
- Keep descriptions concise and accurate
- Do not invent information you're not confident about

If you cannot find reliable information about this specific product, return an empty object: {}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const enrichedInfo = JSON.parse(jsonMatch[0])
      return enrichedInfo
    }
  } catch (error) {
    console.error('AI enrichment error:', error)
  }
  
  return {}
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