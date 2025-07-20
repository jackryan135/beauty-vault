import { generateProductInfo } from './ai'
import { cleanProductInfo } from './text-cleaner'
import { getBestImageUrl } from './image-sources'

export interface ProductData {
  name: string
  brand: string
  price: number
  image_url: string
  description?: string
  category?: string
  ingredients?: string[]
  size?: string
  rating?: number
  reviews?: number
  found?: boolean
}

/**
 * ProductFetcher - Singleton class for fetching product information from multiple sources
 * Implements a fallback chain: Cache → Barcode APIs → Real Sources → AI → Basic Info
 */
export class ProductFetcher {
  private static instance: ProductFetcher
  private cache = new Map<string, ProductData>()

  static getInstance(): ProductFetcher {
    if (!ProductFetcher.instance) {
      ProductFetcher.instance = new ProductFetcher()
    }
    return ProductFetcher.instance
  }

  /**
   * Main method to fetch product information with intelligent fallback
   */
  async fetchProduct(sku: string): Promise<ProductData> {
    // Check cache first
    if (this.cache.has(sku)) {
      console.log(`Cache hit for SKU: ${sku}`)
      return this.cache.get(sku)!
    }

    // Try barcode lookup for numeric SKUs
    if (this.isBarcode(sku)) {
      console.log(`Detected barcode/UPC: ${sku}`)
      const barcodeData = await this.fetchFromBarcodeDatabase(sku)
      if (barcodeData) {
        this.cache.set(sku, barcodeData)
        return barcodeData
      }
    }

    // Try real product sources
    const realData = await this.fetchFromRealSources(sku)
    if (realData) {
      this.cache.set(sku, realData)
      return realData
    }

    // Try AI-powered search
    const aiFoundData = await this.findRealProductWithAI(sku)
    if (aiFoundData?.found) {
      this.cache.set(sku, aiFoundData)
      return aiFoundData
    }

    // Fallback to basic info
    const basicInfo = this.generateBasicInfo(sku)
    this.cache.set(sku, basicInfo)
    return basicInfo
  }

  /**
   * Determines if a SKU is likely a barcode/UPC based on length
   */
  private isBarcode(sku: string): boolean {
    const digits = sku.replace(/\D/g, '')
    const barcodeLengths = [8, 12, 13, 14]
    return barcodeLengths.includes(digits.length)
  }

  /**
   * Attempts to fetch product data from multiple barcode databases
   */
  private async fetchFromBarcodeDatabase(barcode: string): Promise<ProductData | null> {
    console.log(`Looking up barcode: ${barcode}`)
    
    const results = await Promise.allSettled([
      this.lookupUPCItemDB(barcode),
      this.lookupOpenFoodFacts(barcode),
      this.lookupBarcodeLookup(barcode)
    ])

    // Return the first successful result
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        console.log(`Found product via barcode lookup: ${result.value.name}`)
        return result.value
      }
    }

    return null
  }

  /**
   * Fetches product data from UPC Item DB API
   */
  private async lookupUPCItemDB(barcode: string): Promise<ProductData | null> {
    try {
      const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`)
      if (!response.ok) return null
      
      const data = await response.json()
      
      if (data.items?.[0]) {
        const item = data.items[0]
        const imageUrl = await getBestImageUrl(
          item.title || `Product ${barcode}`,
          item.brand || 'Unknown Brand',
          item.images?.[0]
        )
        
        const cleaned = await cleanProductInfo(
          item.title || `Product ${barcode}`,
          item.description || '',
          item.brand || 'Unknown Brand'
        )
        
        return {
          name: cleaned.name,
          brand: cleaned.brand,
          price: parseFloat(item.lowest_recorded_price) || 0,
          image_url: imageUrl,
          description: cleaned.description,
          category: this.mapCategory(item.category),
          found: true
        }
      }
    } catch (error) {
      console.log('UPC Item DB lookup failed:', error)
    }
    
    return null
  }

  /**
   * Fetches product data from Open Food Facts API
   */
  private async lookupOpenFoodFacts(barcode: string): Promise<ProductData | null> {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
      if (!response.ok) return null
      
      const data = await response.json()
      
      if (data.status === 1 && data.product) {
        const product = data.product
        const imageUrl = await getBestImageUrl(
          product.product_name || `Product ${barcode}`,
          product.brands || 'Unknown Brand',
          product.image_front_url
        )
        
        const cleaned = await cleanProductInfo(
          product.product_name || `Product ${barcode}`,
          product.generic_name || '',
          product.brands || 'Unknown Brand'
        )
        
        return {
          name: cleaned.name,
          brand: cleaned.brand,
          price: 0, // Open Food Facts doesn't provide pricing
          image_url: imageUrl,
          description: cleaned.description,
          category: this.mapCategory(product.categories_tags?.[0]),
          found: true
        }
      }
    } catch (error) {
      console.log('Open Food Facts lookup failed:', error)
    }
    
    return null
  }

  /**
   * Fetches product data from Barcode Lookup API
   */
  private async lookupBarcodeLookup(barcode: string): Promise<ProductData | null> {
    try {
      const response = await fetch(`https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=demo`)
      if (!response.ok) return null
      
      const data = await response.json()
      
      if (data.products?.[0]) {
        const product = data.products[0]
        const imageUrl = await getBestImageUrl(
          product.title || `Product ${barcode}`,
          product.brand || 'Unknown Brand',
          product.images?.[0]
        )
        
        const cleaned = await cleanProductInfo(
          product.title || `Product ${barcode}`,
          product.description || '',
          product.brand || 'Unknown Brand'
        )
        
        return {
          name: cleaned.name,
          brand: cleaned.brand,
          price: parseFloat(product.lowest_recorded_price) || 0,
          image_url: imageUrl,
          description: cleaned.description,
          category: this.mapCategory(product.category),
          found: true
        }
      }
    } catch (error) {
      console.log('Barcode Lookup API failed:', error)
    }
    
    return null
  }

  /**
   * Maps generic categories to beauty-specific categories
   */
  private mapCategory(category: string): string {
    if (!category) return 'Other'
    
    const categoryLower = category.toLowerCase()
    
    // Beauty categories
    if (categoryLower.includes('beauty') || categoryLower.includes('cosmetics') || 
        categoryLower.includes('personal care') || categoryLower.includes('skincare')) {
      return 'Beauty'
    }
    
    if (categoryLower.includes('makeup') || categoryLower.includes('foundation') || 
        categoryLower.includes('concealer') || categoryLower.includes('blush')) {
      return 'Makeup'
    }
    
    if (categoryLower.includes('skincare') || categoryLower.includes('moisturizer') || 
        categoryLower.includes('cleanser') || categoryLower.includes('serum')) {
      return 'Skincare'
    }
    
    if (categoryLower.includes('hair') || categoryLower.includes('shampoo') || 
        categoryLower.includes('conditioner')) {
      return 'Hair Care'
    }
    
    // Other categories
    if (categoryLower.includes('food') || categoryLower.includes('snack') || 
        categoryLower.includes('beverage') || categoryLower.includes('drink') ||
        categoryLower.includes('noodle') || categoryLower.includes('kitchen')) {
      return 'Food & Beverage'
    }
    
    if (categoryLower.includes('household') || categoryLower.includes('cleaning') ||
        categoryLower.includes('laundry') || categoryLower.includes('detergent')) {
      return 'Household'
    }
    
    if (categoryLower.includes('health') || categoryLower.includes('medicine') ||
        categoryLower.includes('vitamin') || categoryLower.includes('supplement')) {
      return 'Health & Wellness'
    }
    
    return 'Other'
  }

  /**
   * Fetches from predefined real product database (demo data)
   */
  private async fetchFromRealSources(sku: string): Promise<ProductData | null> {
    const realProducts: Record<string, ProductData> = {
      'SEPHORA001': {
        name: 'Pro Filt\'r Soft Matte Longwear Liquid Foundation',
        brand: 'Fenty Beauty',
        price: 38,
        image_url: 'https://placehold.co/400x400/fce7f3/ec4899?text=Fenty%20Beauty%20Foundation',
        description: 'A soft matte, long-wear liquid foundation with buildable, medium-to-full coverage',
        category: 'Foundation',
        size: '1 oz',
        rating: 4.5,
        reviews: 1247,
        found: true
      },
      'GLOSSIER001': {
        name: 'Boy Brow',
        brand: 'Glossier',
        price: 18,
        image_url: 'https://placehold.co/400x400/fce7f3/ec4899?text=Glossier%20Boy%20Brow',
        description: 'A tiny brush that thickens, shapes, and grooms brows into place',
        category: 'Brow',
        size: '0.1 oz',
        rating: 4.7,
        reviews: 8923,
        found: true
      },
      'CHARLOTTE001': {
        name: 'Magic Cream',
        brand: 'Charlotte Tilbury',
        price: 130,
        image_url: 'https://placehold.co/400x400/fce7f3/ec4899?text=Charlotte%20Tilbury%20Magic%20Cream',
        description: 'A luxurious, anti-aging moisturizer that instantly plumps and smooths',
        category: 'Moisturizer',
        size: '1.7 oz',
        rating: 4.6,
        reviews: 2156,
        found: true
      },
      'RARE001': {
        name: 'Liquid Touch Brightening Concealer',
        brand: 'Rare Beauty',
        price: 22,
        image_url: 'https://placehold.co/400x400/fce7f3/ec4899?text=Rare%20Beauty%20Concealer',
        description: 'A lightweight, buildable concealer that brightens and covers',
        category: 'Concealer',
        size: '0.2 oz',
        rating: 4.4,
        reviews: 3421,
        found: true
      }
    }

    if (realProducts[sku]) {
      console.log(`Found real product data for SKU: ${sku}`)
      return realProducts[sku]
    }

    return null
  }

  /**
   * Uses AI to find real product information
   */
  private async findRealProductWithAI(sku: string): Promise<ProductData | null> {
    console.log(`Searching for real product with AI for SKU: ${sku}`)
    
    try {
      const aiResult = await generateProductInfo(sku)
      
      if (aiResult?.found && aiResult.name && aiResult.brand) {
        return {
          ...aiResult,
          description: await this.generateDescription(aiResult.name, aiResult.brand),
          category: this.determineCategory(aiResult.name),
          size: this.generateSize(),
          rating: this.generateRating(),
          reviews: this.generateReviewCount(),
          found: true
        }
      }
    } catch (error) {
      console.error('AI product search error:', error)
    }

    return null
  }

  /**
   * Generates basic product info when no real product is found
   */
  private generateBasicInfo(sku: string): ProductData {
    return {
      name: `Product ${sku}`,
      brand: 'Unknown Brand',
      price: 0,
      image_url: `https://placehold.co/400x400/fce7f3/ec4899?text=Product%20${encodeURIComponent(sku)}`,
      description: 'Product information not found. Please verify the SKU or add product details manually.',
      category: 'Unknown',
      found: false
    }
  }

  /**
   * Generates a product description based on name and brand
   */
  private async generateDescription(name: string, brand: string): Promise<string> {
    const descriptions = [
      `A luxurious ${name.toLowerCase()} from ${brand} that delivers exceptional results.`,
      `${brand}'s ${name.toLowerCase()} offers premium quality and stunning performance.`,
      `Experience the magic of ${brand}'s ${name.toLowerCase()} - a beauty essential.`,
      `Transform your beauty routine with ${brand}'s innovative ${name.toLowerCase()}.`,
      `Discover the perfect ${name.toLowerCase()} from ${brand} for your unique needs.`
    ]
    
    const hash = this.simpleHash(name + brand)
    return descriptions[hash % descriptions.length]
  }

  /**
   * Determines product category based on product name keywords
   */
  private determineCategory(name: string): string {
    const categories = {
      'Foundation': ['foundation', 'base', 'tint'],
      'Concealer': ['concealer', 'cover'],
      'Powder': ['powder', 'setting'],
      'Blush': ['blush', 'cheek'],
      'Bronzer': ['bronzer', 'contour'],
      'Highlighter': ['highlighter', 'glow', 'illuminator'],
      'Eyeshadow': ['eyeshadow', 'shadow', 'palette'],
      'Mascara': ['mascara', 'lash'],
      'Eyeliner': ['eyeliner', 'liner'],
      'Lipstick': ['lipstick', 'lip'],
      'Lip Gloss': ['gloss', 'lip gloss'],
      'Setting Spray': ['spray', 'setting'],
      'Primer': ['primer'],
      'Cleanser': ['cleanser', 'wash'],
      'Moisturizer': ['moisturizer', 'cream', 'lotion'],
      'Serum': ['serum', 'treatment'],
      'Mask': ['mask', 'treatment'],
      'Eye Cream': ['eye cream', 'eye treatment'],
      'Toner': ['toner', 'essence'],
      'Oil': ['oil', 'facial oil']
    }

    const lowerName = name.toLowerCase()
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category
      }
    }

    return 'Beauty'
  }

  /**
   * Generates a realistic product size
   */
  private generateSize(): string {
    const sizes = ['0.1 oz', '0.2 oz', '0.5 oz', '1 oz', '1.7 oz', '2 oz', '3.4 oz']
    const hash = this.simpleHash(Date.now().toString())
    return sizes[hash % sizes.length]
  }

  /**
   * Generates a realistic rating between 3.5 and 5.0
   */
  private generateRating(): number {
    return Math.round((3.5 + Math.random() * 1.5) * 10) / 10
  }

  /**
   * Generates a realistic review count between 50 and 5000
   */
  private generateReviewCount(): number {
    return Math.floor(50 + Math.random() * 4950)
  }

  /**
   * Simple hash function for deterministic random selection
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  /**
   * Clears the product cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Returns the current cache size
   */
  getCacheSize(): number {
    return this.cache.size
  }
} 