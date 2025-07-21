import { NextApiRequest, NextApiResponse } from 'next'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { imageBase64, fileName } = req.body

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const extension = 'jpg' // Default to jpg for base64 images
    const uniqueFileName = `${timestamp}-${randomId}.${extension}`
    
    // Decode base64 image
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Save file
    const filePath = join(uploadsDir, uniqueFileName)
    await writeFile(filePath, buffer)

    // Return the public URL
    const imageUrl = `/uploads/${uniqueFileName}`

    res.status(200).json({ 
      success: true, 
      imageUrl,
      fileName: uniqueFileName
    })
  } catch (error) {
    console.error('Image upload error:', error)
    res.status(500).json({ error: 'Failed to upload image' })
  }
} 