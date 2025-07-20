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
 * Cleans text using Gemini AI
 */
async function cleanWithAI(name: string, description: string, brand: string): Promise<CleanedText | null> {
  if (!genAI) return null

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
  
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
  
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase()
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