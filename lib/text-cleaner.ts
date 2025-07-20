import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Initialize Gemini AI for text cleaning with API key validation
 */
const genAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

export interface CleanedText {
  name: string
  description: string
  brand: string
  size?: string
}

/**
 * Main function to clean product information using AI with fallback
 */
export async function cleanProductInfo(
  name: string, 
  description: string, 
  brand: string
): Promise<CleanedText> {
  try {
    if (genAI && process.env.GEMINI_API_KEY) {
      const aiCleaned = await cleanWithAI(name, description, brand)
      if (aiCleaned) {
        return aiCleaned
      }
    }
  } catch (error) {
    console.log('AI text cleaning failed, using basic cleaning:', error)
  }

  return cleanBasicText(name, description, brand)
}

/**
 * Extracts size information from product title and removes it from the name
 */
export function extractSizeFromTitle(title: string): { cleanedTitle: string; size: string | undefined } {
  if (!title) return { cleanedTitle: title, size: undefined }
  
  // Common size patterns in beauty products
  const sizePatterns = [
    // Metric sizes
    /\b\d+(?:\.\d+)?\s*(?:ml|mL|milliliter|milliliters)\b/gi,
    /\b\d+(?:\.\d+)?\s*(?:g|gram|grams)\b/gi,
    /\b\d+(?:\.\d+)?\s*(?:kg|kilogram|kilograms)\b/gi,
    
    // Imperial sizes
    /\b\d+(?:\.\d+)?\s*(?:oz|ounce|ounces|fl oz|fluid ounce|fluid ounces)\b/gi,
    /\b\d+(?:\.\d+)?\s*(?:lb|pound|pounds)\b/gi,
    
    // Common beauty product sizes
    /\b(?:mini|travel|sample|trial)\s+size\b/gi,
    /\b(?:full|regular|standard)\s+size\b/gi,
    /\b(?:jumbo|large|extra large|xl)\s+size\b/gi,
    
    // Specific size formats
    /\b\d+(?:\.\d+)?\s*(?:ml|mL|oz|g)\b/gi,
    /\b(?:size|pack|pack of|set of)\s+\d+\b/gi,
    
    // Volume indicators
    /\b\d+(?:\.\d+)?\s*(?:spray|pump|drop|scoop)s?\b/gi
  ]
  
  let cleanedTitle = title
  let extractedSize: string | undefined
  
  for (const pattern of sizePatterns) {
    const matches = cleanedTitle.match(pattern)
    if (matches) {
      extractedSize = matches[0].trim()
      // Remove the size from the title
      cleanedTitle = cleanedTitle.replace(pattern, '').trim()
      // Clean up extra spaces and punctuation
      cleanedTitle = cleanedTitle.replace(/\s*[,\-–—]\s*$/, '').trim()
      cleanedTitle = cleanedTitle.replace(/^\s*[,\-–—]\s*/, '').trim()
      break
    }
  }
  
  return { cleanedTitle, size: extractedSize }
}

/**
 * Improves title capitalization for beauty products
 */
export function improveTitleCapitalization(title: string): string {
  if (!title) return title
  
  // Common beauty brand names that should be properly capitalized
  const brandNames = [
    'Fenty', 'Glossier', 'Charlotte Tilbury', 'Rare Beauty', 'NARS', 'MAC', 
    'Urban Decay', 'Anastasia Beverly Hills', 'Huda Beauty', 'Too Faced', 
    'Tarte', 'BareMinerals', 'Benefit', 'Milk Makeup', 'Clinique', 
    'Estee Lauder', 'Lancome', 'Dior', 'Chanel', 'YSL', 'Guerlain', 
    'Shiseido', 'SK-II', 'La Mer', 'La Prairie', 'Drunk Elephant',
    'The Ordinary', 'Paula\'s Choice', 'CeraVe', 'Neutrogena', 'Olay'
  ]
  
  // Common beauty product terms that should be properly capitalized
  const productTerms = [
    'Pro', 'Soft', 'Matte', 'Longwear', 'Liquid', 'Cream', 'Gel', 'Oil',
    'Serum', 'Toner', 'Essence', 'Mask', 'Treatment', 'Primer', 'Setting',
    'Brightening', 'Hydrating', 'Moisturizing', 'Anti-Aging', 'Anti-Wrinkle',
    'Smoothing', 'Plumping', 'Glowing', 'Illuminating', 'Contouring',
    'Waterproof', 'Smudge-Proof', 'Transfer-Proof', 'Buildable', 'Blendable'
  ]
  
  let improved = title
  
  // Fix brand names
  for (const brand of brandNames) {
    const brandRegex = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    improved = improved.replace(brandRegex, brand)
  }
  
  // Fix product terms
  for (const term of productTerms) {
    const termRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    improved = improved.replace(termRegex, term)
  }
  
  // Capitalize first letter of each word, but preserve existing capitalization
  const words = improved.split(' ')
  const capitalizedWords = words.map(word => {
    // Don't capitalize common prepositions and articles unless they're the first word
    const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet']
    
    if (smallWords.includes(word.toLowerCase()) && word !== words[0]) {
      return word.toLowerCase()
    }
    
    // Preserve existing capitalization for brand names and product terms
    if (brandNames.some(brand => brand.toLowerCase() === word.toLowerCase()) ||
        productTerms.some(term => term.toLowerCase() === word.toLowerCase())) {
      return word
    }
    
    // Capitalize first letter, lowercase the rest
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  })
  
  return capitalizedWords.join(' ')
}

/**
 * Cleans text using Gemini AI
 */
async function cleanWithAI(name: string, description: string, brand: string): Promise<CleanedText | null> {
  if (!genAI) return null

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' })
  
  const prompt = `Clean and format this beauty product information. Return ONLY a valid JSON object:

Input:
- Name: "${name}"
- Description: "${description}"
- Brand: "${brand}"

Clean the text by:
1. Remove HTML tags, extra spaces, and formatting
2. Fix capitalization and punctuation
3. Make product names concise and clear
4. Make descriptions readable and informative
5. Clean up brand names
6. Remove redundant information

Return this exact JSON format:
{
  "name": "Clean Product Name",
  "description": "Clean, readable description",
  "brand": "Clean Brand Name"
}

Make it sound professional and clean.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const cleaned = JSON.parse(jsonMatch[0])
      return {
        name: cleaned.name || name,
        description: cleaned.description || description,
        brand: cleaned.brand || brand
      }
    }
  } catch (error) {
    console.error('AI text cleaning error:', error)
    if (error.message?.includes('not found for API version')) {
      console.error('Gemini model not found - please check API configuration')
    }
  }

  return null
}

/**
 * Basic text cleaning without AI
 */
function cleanBasicText(name: string, description: string, brand: string): CleanedText {
  return {
    name: cleanProductName(name),
    description: cleanDescription(description),
    brand: cleanBrandName(brand)
  }
}

/**
 * Cleans and formats product names
 */
function cleanProductName(name: string): string {
  if (!name) return 'Unknown Product'
  
  let cleaned = name
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  cleaned = cleaned
    .replace(/^product\s+/i, '')
    .replace(/\s+product$/i, '')
    .replace(/^unknown\s+brand\s+/i, '')
  
  // Extract size information and remove from title
  const { cleanedTitle, size } = extractSizeFromTitle(cleaned)
  cleaned = cleanedTitle
  
  // Improve capitalization
  cleaned = improveTitleCapitalization(cleaned)
  
  cleaned = cleaned.replace(/[!]{2,}/g, '!')
  
  return cleaned || 'Unknown Product'
}

/**
 * Cleans and formats product descriptions
 */
function cleanDescription(description: string): string {
  if (!description) return ''
  
  let cleaned = description
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  cleaned = cleaned
    .replace(/^ingredients:\s*/i, '')
    .replace(/^description:\s*/i, '')
    .replace(/^product\s+description:\s*/i, '')
  
  if (cleaned.length > 200) {
    cleaned = cleaned.substring(0, 200) + '...'
  }
  
  return cleaned
}

/**
 * Cleans and formats brand names
 */
function cleanBrandName(brand: string): string {
  if (!brand) return 'Unknown Brand'
  
  let cleaned = brand
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  cleaned = cleaned
    .replace(/^unknown\s+brand$/i, 'Unknown Brand')
    .replace(/^brand:\s*/i, '')
  
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase()
  
  return cleaned || 'Unknown Brand'
} 