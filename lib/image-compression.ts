export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp'
  maxFileSize?: number // in bytes
}

export interface CompressedImage {
  dataUrl: string
  base64: string
  size: number
  width: number
  height: number
  format: string
}

/**
 * Aggressively compresses images for AI search while maintaining accuracy
 * Targets file sizes under 1MB while preserving important visual features
 */
export async function compressImageForAI(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImage> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.7,
    format = 'jpeg',
    maxFileSize = 1024 * 1024 // 1MB target
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      // Set canvas dimensions
      canvas.width = width
      canvas.height = height

      // Draw and compress image
      ctx?.drawImage(img, 0, 0, width, height)

      // Try different quality levels to get under target size
      let currentQuality = quality
      let dataUrl = ''
      let base64 = ''

      const tryCompression = () => {
        dataUrl = canvas.toDataURL(`image/${format}`, currentQuality)
        base64 = dataUrl.split(',')[1]
        
        // Calculate size in bytes
        const size = Math.ceil((base64.length * 3) / 4)
        
        if (size <= maxFileSize || currentQuality <= 0.1) {
          resolve({
            dataUrl,
            base64,
            size,
            width,
            height,
            format
          })
        } else {
          // Reduce quality and try again
          currentQuality -= 0.1
          setTimeout(tryCompression, 0)
        }
      }

      tryCompression()
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Additional compression for very large images
 * Uses multiple compression passes to achieve target size
 */
export async function aggressiveCompressImage(
  file: File,
  targetSize: number = 512 * 1024 // 512KB target
): Promise<CompressedImage> {
  // First pass: standard compression
  let result = await compressImageForAI(file, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8,
    maxFileSize: targetSize
  })

  // If still too large, try more aggressive compression
  if (result.size > targetSize) {
    result = await compressImageForAI(file, {
      maxWidth: 600,
      maxHeight: 600,
      quality: 0.6,
      maxFileSize: targetSize
    })
  }

  // Final aggressive compression if needed
  if (result.size > targetSize) {
    result = await compressImageForAI(file, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.4,
      maxFileSize: targetSize
    })
  }

  return result
}

/**
 * Validates if an image is suitable for AI analysis
 */
export function validateImageForAI(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select a valid image file' }
  }

  // Check file size (original file)
  const maxOriginalSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxOriginalSize) {
    return { valid: false, error: 'Image file is too large. Please select a smaller image.' }
  }

  return { valid: true }
} 