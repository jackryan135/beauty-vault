import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Storage features will be disabled.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Service role client for server-side operations (if needed)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey)
  : null

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey) 