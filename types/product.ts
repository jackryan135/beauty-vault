export interface Product {
  id: string
  sku: string
  name: string
  brand: string
  price: number
  image_url: string
  quantity: number
  is_active: boolean
  status: 'in_vault' | 'on_shelf' | 'used_up'
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

export interface User {
  id: string
  name: string
  role: 'admin' | 'guest'
  session_token?: string
  session_expires_at?: string
  created_at: string
  updated_at: string
}

export interface ShoppingList {
  id: string
  user_id: string
  name: string
  user_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
  items?: ShoppingListItem[]
}

export interface ShoppingListItem {
  id: string
  shopping_list_id: string
  product_id: string
  quantity: number
  is_checked_out: boolean
  created_at: string
  updated_at: string
  product?: Product
}

export interface LoginRequest {
  password: string
  name?: string
}

export interface LoginResponse {
  success: boolean
  user?: User
  message?: string
  session_token?: string
}

export interface ShoppingListRequest {
  product_id: string
  quantity?: number
}

export interface ShoppingListResponse {
  success: boolean
  shopping_list?: ShoppingList
  message?: string
} 