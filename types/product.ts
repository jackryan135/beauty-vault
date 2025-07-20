export interface Product {
  id: string
  sku: string
  name: string
  brand: string
  price: number
  image_url: string
  quantity: number
  is_active: boolean
  metadata: {
    entry_count?: number
    last_used?: string
    usage_count?: number
    source?: 'real_data' | 'ai_generated'
    description?: string
    category?: string
    size?: string
    rating?: number
    reviews?: number
    found?: boolean
  }
  created_at: string
  updated_at: string
}

export interface ProductInput {
  sku: string
}

export interface ProductResponse {
  success: boolean
  data?: Product
  message?: string
} 