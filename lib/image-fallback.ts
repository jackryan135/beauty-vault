/**
 * Generates fallback image URLs using placeholder services
 */
export function generateFallbackImage(text: string, width: number = 400, height: number = 400): string {
  const encodedText = encodeURIComponent(text)
  
  const placeholderServices = [
    `https://placehold.co/${width}x${height}/fce7f3/ec4899?text=${encodedText}`,
    `https://via.placeholder.com/${width}x${height}/fce7f3/ec4899?text=${encodedText}`,
    `https://dummyimage.com/${width}x${height}/fce7f3/ec4899&text=${encodedText}`,
  ]
  
  return placeholderServices[0]
}

/**
 * Generates a simple SVG fallback as last resort
 */
export function generateSVGFallback(text: string, width: number = 400, height: number = 400): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#fce7f3"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" 
            fill="#ec4899" text-anchor="middle" dy=".3em">
        ${text}
      </text>
    </svg>
  `.trim()
  
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Gets fallback image with multiple options
 */
export function getFallbackImage(text: string, width: number = 400, height: number = 400): string {
  return generateFallbackImage(text, width, height)
}

/**
 * Checks if an image URL is likely to work
 */
export function isReliableImageUrl(url: string): boolean {
  if (!url) return false
  return true
}

/**
 * Gets the best available image URL
 */
export function getBestImageUrl(primaryUrl: string, fallbackText: string): string {
  if (isReliableImageUrl(primaryUrl)) {
    return primaryUrl
  }
  
  return getFallbackImage(fallbackText)
} 