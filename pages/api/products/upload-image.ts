import { NextApiRequest, NextApiResponse } from 'next'
import { uploadImage } from '../../../lib/storage'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { imageBase64, fileName } = req.body

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' })
    }

    const result = await uploadImage(imageBase64, fileName || 'uploaded-image')

    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to upload image',
        details: result.error 
      })
    }

    res.status(200).json({
      success: true,
      imageUrl: result.imageUrl,
      fileName: result.fileName
    })
  } catch (error) {
    console.error('Image upload error:', error)
    res.status(500).json({ error: 'Failed to upload image' })
  }
} 