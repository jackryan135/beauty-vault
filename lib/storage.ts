import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { supabase, isSupabaseConfigured } from './supabase'

export interface UploadResult {
  success: boolean
  imageUrl: string
  fileName: string
  error?: string
}

export async function uploadImage(
  imageBase64: string, 
  fileName: string,
  bucketName: string = 'product-images'
): Promise<UploadResult> {
  // Remove data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  
  // Generate unique filename
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const extension = 'jpg'
  const uniqueFileName = `${timestamp}-${randomId}.${extension}`

  // Check if we're in production (Vercel) or development
  const isProduction = process.env.NODE_ENV === 'production'
  const useSupabase = isProduction && isSupabaseConfigured

  if (useSupabase) {
    // Use Supabase storage in production
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(uniqueFileName, buffer, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        })

      if (error) {
        console.error('Supabase upload error:', error)
        return {
          success: false,
          imageUrl: '',
          fileName: uniqueFileName,
          error: error.message
        }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uniqueFileName)

      return {
        success: true,
        imageUrl: urlData.publicUrl,
        fileName: uniqueFileName
      }
    } catch (error) {
      console.error('Supabase upload error:', error)
      return {
        success: false,
        imageUrl: '',
        fileName: uniqueFileName,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  } else {
    // Use local storage in development
    try {
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      const filePath = join(uploadsDir, uniqueFileName)
      await writeFile(filePath, buffer)
      
      const imageUrl = `/uploads/${uniqueFileName}`
      
      return {
        success: true,
        imageUrl,
        fileName: uniqueFileName
      }
    } catch (error) {
      console.error('Local upload error:', error)
      return {
        success: false,
        imageUrl: '',
        fileName: uniqueFileName,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export async function deleteImage(
  fileName: string,
  bucketName: string = 'product-images'
): Promise<boolean> {
  const isProduction = process.env.NODE_ENV === 'production'
  const useSupabase = isProduction && isSupabaseConfigured

  if (useSupabase) {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([fileName])

      if (error) {
        console.error('Supabase delete error:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Supabase delete error:', error)
      return false
    }
  } else {
    // For local storage, we could implement file deletion here
    // For now, we'll just return true since local files are temporary
    return true
  }
} 