import { generateProductInfo, enrichProductInfo } from './ai'
import { cleanProductInfo, extractSizeFromTitle } from './text-cleaner'
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
  source?: 'real_data' | 'ai_generated' | 'barcode_lookup' | 'basic_info'
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
        
        // Extract size from title if not already present
        const { size: extractedSize } = extractSizeFromTitle(item.title || '')
        
        // Try to enrich with AI if we have basic info but missing details
        let enrichedInfo: {
          description?: string
          price?: number
          size?: string
          category?: string
          ingredients?: string[]
        } = {}
        if (cleaned.name && cleaned.brand && (!cleaned.description || item.offers?.[0]?.price === 0)) {
          try {
            console.log(`Enriching product info with AI: ${cleaned.name} by ${cleaned.brand}`)
            enrichedInfo = await enrichProductInfo(cleaned.name, cleaned.brand)
          } catch (error) {
            console.log('AI enrichment failed, using basic info:', error)
          }
        }
        
        return {
          name: cleaned.name,
          brand: cleaned.brand,
          price: 0,
          image_url: imageUrl,
          description: cleaned.description || enrichedInfo.description,
          category: this.determineCategory(cleaned.name) || this.mapCategory(item.category) || enrichedInfo.category,
          size: extractedSize || enrichedInfo.size || this.generateSize(),
          ingredients: enrichedInfo.ingredients,
          found: true,
          source: 'barcode_lookup'
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
        
        // Extract size from title if not already present
        const { size: extractedSize } = extractSizeFromTitle(product.product_name || '')
        
        // Try to enrich with AI since Open Food Facts doesn't provide pricing
        let enrichedInfo: {
          description?: string
          price?: number
          size?: string
          category?: string
          ingredients?: string[]
        } = {}
        if (cleaned.name && cleaned.brand) {
          try {
            console.log(`Enriching Open Food Facts product with AI: ${cleaned.name} by ${cleaned.brand}`)
            enrichedInfo = await enrichProductInfo(cleaned.name, cleaned.brand)
          } catch (error) {
            console.log('AI enrichment failed, using basic info:', error)
          }
        }
        
        return {
          name: cleaned.name,
          brand: cleaned.brand,
          price: 0,
          image_url: imageUrl,
          description: cleaned.description || enrichedInfo.description,
          category: this.determineCategory(cleaned.name) || this.mapCategory(product.categories_tags?.[0]) || enrichedInfo.category,
          size: extractedSize || enrichedInfo.size || this.generateSize(),
          ingredients: enrichedInfo.ingredients,
          found: true,
          source: 'barcode_lookup'
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
        
        // Extract size from title if not already present
        const { size: extractedSize } = extractSizeFromTitle(product.title || '')
        
        // Try to enrich with AI if we have basic info but missing details
        let enrichedInfo: {
          description?: string
          price?: number
          size?: string
          category?: string
          ingredients?: string[]
        } = {}
        if (cleaned.name && cleaned.brand && (!cleaned.description || !product.lowest_recorded_price)) {
          try {
            console.log(`Enriching Barcode Lookup product with AI: ${cleaned.name} by ${cleaned.brand}`)
            enrichedInfo = await enrichProductInfo(cleaned.name, cleaned.brand)
          } catch (error) {
            console.log('AI enrichment failed, using basic info:', error)
          }
        }
        
        return {
          name: cleaned.name,
          brand: cleaned.brand,
          price: 0,
          image_url: imageUrl,
          description: cleaned.description || enrichedInfo.description,
          category: this.determineCategory(cleaned.name) || this.mapCategory(product.category) || enrichedInfo.category,
          size: extractedSize || enrichedInfo.size || this.generateSize(),
          ingredients: enrichedInfo.ingredients,
          found: true,
          source: 'barcode_lookup'
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
    
    // Skincare categories
    if (categoryLower.includes('skincare') || categoryLower.includes('moisturizer') || 
        categoryLower.includes('cleanser') || categoryLower.includes('serum') ||
        categoryLower.includes('toner') || categoryLower.includes('essence') ||
        categoryLower.includes('eye cream') || categoryLower.includes('facial oil') ||
        categoryLower.includes('mask') || categoryLower.includes('treatment') ||
        categoryLower.includes('sunscreen') || categoryLower.includes('spf') ||
        categoryLower.includes('retinol') || categoryLower.includes('peptide') ||
        categoryLower.includes('hyaluronic') || categoryLower.includes('vitamin c')) {
      return 'Skincare'
    }
    
    // Makeup categories
    if (categoryLower.includes('makeup') || categoryLower.includes('foundation') || 
        categoryLower.includes('concealer') || categoryLower.includes('blush') ||
        categoryLower.includes('bronzer') || categoryLower.includes('highlighter') ||
        categoryLower.includes('eyeshadow') || categoryLower.includes('mascara') ||
        categoryLower.includes('eyeliner') || categoryLower.includes('lipstick') ||
        categoryLower.includes('lip gloss') || categoryLower.includes('primer') ||
        categoryLower.includes('setting spray') || categoryLower.includes('powder') ||
        categoryLower.includes('brow') || categoryLower.includes('eyebrow') ||
        categoryLower.includes('contour') || categoryLower.includes('illuminator')) {
      return 'Makeup'
    }
    
    // Hair care categories
    if (categoryLower.includes('hair') || categoryLower.includes('shampoo') || 
        categoryLower.includes('conditioner') || categoryLower.includes('hair mask') ||
        categoryLower.includes('hair oil') || categoryLower.includes('hair serum') ||
        categoryLower.includes('hair treatment') || categoryLower.includes('hair spray') ||
        categoryLower.includes('hair gel') || categoryLower.includes('hair cream') ||
        categoryLower.includes('hair mousse') || categoryLower.includes('dry shampoo')) {
      return 'Hair Care'
    }
    
    // Fragrance categories
    if (categoryLower.includes('fragrance') || categoryLower.includes('perfume') ||
        categoryLower.includes('cologne') || categoryLower.includes('body mist') ||
        categoryLower.includes('body spray') || categoryLower.includes('eau de toilette') ||
        categoryLower.includes('eau de parfum') || categoryLower.includes('parfum')) {
      return 'Fragrance'
    }
    
    // Body care categories
    if (categoryLower.includes('body') || categoryLower.includes('body lotion') ||
        categoryLower.includes('body wash') || categoryLower.includes('body scrub') ||
        categoryLower.includes('body oil') || categoryLower.includes('hand cream') ||
        categoryLower.includes('foot cream') || categoryLower.includes('deodorant')) {
      return 'Body Care'
    }
    
    // Tools and accessories
    if (categoryLower.includes('brush') || categoryLower.includes('sponge') ||
        categoryLower.includes('beauty blender') || categoryLower.includes('mirror') ||
        categoryLower.includes('tweezers') || categoryLower.includes('curler') ||
        categoryLower.includes('lash curler') || categoryLower.includes('applicator')) {
      return 'Tools & Accessories'
    }
    
    // General beauty
    if (categoryLower.includes('beauty') || categoryLower.includes('cosmetics') || 
        categoryLower.includes('personal care')) {
      return 'Beauty'
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
        price: 0,
        image_url: 'https://placehold.co/400x400/fce7f3/ec4899?text=Fenty%20Beauty%20Foundation',
        description: 'A soft matte, long-wear liquid foundation with buildable, medium-to-full coverage',
        category: 'Foundation',
        size: '1 oz',
        rating: 4.5,
        reviews: 1247,
        found: true,
        source: 'real_data'
      },
      'GLOSSIER001': {
        name: 'Boy Brow',
        brand: 'Glossier',
        price: 0,
        image_url: 'https://placehold.co/400x400/fce7f3/ec4899?text=Glossier%20Boy%20Brow',
        description: 'A tiny brush that thickens, shapes, and grooms brows into place',
        category: 'Brow',
        size: '0.1 oz',
        rating: 4.7,
        reviews: 8923,
        found: true,
        source: 'real_data'
      },
      'CHARLOTTE001': {
        name: 'Magic Cream',
        brand: 'Charlotte Tilbury',
        price: 0,
        image_url: 'https://placehold.co/400x400/fce7f3/ec4899?text=Charlotte%20Tilbury%20Magic%20Cream',
        description: 'A luxurious, anti-aging moisturizer that instantly plumps and smooths',
        category: 'Moisturizer',
        size: '1.7 oz',
        rating: 4.6,
        reviews: 2156,
        found: true,
        source: 'real_data'
      },
      'RARE001': {
        name: 'Liquid Touch Brightening Concealer',
        brand: 'Rare Beauty',
        price: 0,
        image_url: 'https://placehold.co/400x400/fce7f3/ec4899?text=Rare%20Beauty%20Concealer',
        description: 'A lightweight, buildable concealer that brightens and covers',
        category: 'Concealer',
        size: '0.2 oz',
        rating: 4.4,
        reviews: 3421,
        found: true,
        source: 'real_data'
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
        // Extract size from product name
        const { size: extractedSize } = extractSizeFromTitle(aiResult.name)
        
        return {
          ...aiResult,
          description: await this.generateDescription(aiResult.name, aiResult.brand),
          category: this.determineCategory(aiResult.name),
          size: extractedSize || this.generateSize(),
          rating: this.generateRating(),
          reviews: this.generateReviewCount(),
          found: true,
          source: 'ai_generated'
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
      found: false,
      source: 'basic_info'
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
      // Skincare
      'Skincare': ['skincare', 'moisturizer', 'cleanser', 'serum', 'toner', 'essence', 'eye cream', 'facial oil', 'mask', 'treatment', 'sunscreen', 'spf', 'retinol', 'peptide', 'hyaluronic', 'vitamin c', 'niacinamide', 'aha', 'bha', 'exfoliant', 'face wash', 'facial cleanser', 'night cream', 'day cream', 'spot treatment', 'acne treatment', 'lotion'],
      
      // Makeup - Face
      'Foundation': ['foundation', 'base', 'tint', 'bb cream', 'cc cream', 'tinted moisturizer'],
      'Concealer': ['concealer', 'cover', 'color corrector'],
      'Powder': ['powder', 'setting powder', 'loose powder', 'pressed powder', 'translucent powder'],
      'Blush': ['blush', 'cheek', 'rouge'],
      'Bronzer': ['bronzer', 'contour', 'sculpting'],
      'Highlighter': ['highlighter', 'glow', 'illuminator', 'luminizer'],
      'Primer': ['primer', 'base primer', 'face primer'],
      'Setting Spray': ['setting spray', 'finishing spray', 'makeup setting'],
      
      // Makeup - Eyes
      'Eyeshadow': ['eyeshadow', 'shadow', 'palette', 'eye palette', 'eye shadow'],
      'Mascara': ['mascara', 'lash', 'lash mascara'],
      'Eyeliner': ['eyeliner', 'liner', 'eye liner', 'kohl', 'pencil'],
      'Brow': ['brow', 'eyebrow', 'brow pencil', 'brow gel', 'brow powder', 'brow pomade'],
      'Eye Primer': ['eye primer', 'eyeshadow primer', 'eye base'],
      
      // Makeup - Lips
      'Lipstick': ['lipstick', 'lip stick', 'lip color', 'lip product'],
      'Lip Gloss': ['lip gloss', 'gloss', 'lip shine'],
      'Lip Liner': ['lip liner', 'lip pencil', 'lip outline'],
      'Lip Balm': ['lip balm', 'chapstick', 'lip treatment'],
      
      // Hair Care
      'Hair Care': ['shampoo', 'conditioner', 'hair mask', 'hair oil', 'hair serum', 'hair treatment', 'hair spray', 'hair gel', 'hair cream', 'hair mousse', 'dry shampoo', 'hair conditioner', 'hair shampoo', 'hair product', 'hair styling', 'hair care'],
      
      // Fragrance
      'Fragrance': ['perfume', 'cologne', 'fragrance', 'body mist', 'body spray', 'eau de toilette', 'eau de parfum', 'parfum', 'scent'],
      
      // Body Care
      'Body Care': ['body lotion', 'body wash', 'body scrub', 'body oil', 'hand cream', 'foot cream', 'deodorant', 'body cream', 'body moisturizer', 'lotion'],
      
      // Tools & Accessories
      'Tools & Accessories': ['brush', 'sponge', 'beauty blender', 'mirror', 'tweezers', 'curler', 'lash curler', 'applicator', 'makeup brush', 'beauty tool', 'makeup tool']
    }

    const lowerName = name.toLowerCase()
    
    // Check for specific categories first (more specific matches)
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return category
      }
    }

    // If no specific category found, try to determine general beauty category
    if (lowerName.includes('makeup') || lowerName.includes('cosmetic')) {
      return 'Makeup'
    }
    
    if (lowerName.includes('skin') || lowerName.includes('face')) {
      return 'Skincare'
    }
    
    if (lowerName.includes('hair')) {
      return 'Hair Care'
    }
    
    if (lowerName.includes('perfume') || lowerName.includes('fragrance')) {
      return 'Fragrance'
    }
    
    if (lowerName.includes('body')) {
      return 'Body Care'
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