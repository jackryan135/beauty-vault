import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Camera, Upload, Loader2, X, Check, AlertCircle } from 'lucide-react'
import { aggressiveCompressImage, validateImageForAI } from '../lib/image-compression'

interface AIProductSearchProps {
  onProductFound: (productInfo: {
    name: string
    brand: string
    price: number
    image_url: string
    description?: string
    size?: string
    category?: string
    uploadedImage?: string
    found?: boolean
  }) => void
  onClose: () => void
}

const AIProductSearch: React.FC<AIProductSearchProps> = ({
  onProductFound,
  onClose
}) => {
  const [searchMode, setSearchMode] = useState<'name' | 'image'>('name')
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [uploadedImageData, setUploadedImageData] = useState<string>('')
  const [compressionStatus, setCompressionStatus] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const frontCameraInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleNameSearch = async () => {
    if (!name.trim() || !brand.trim()) {
      setError('Please enter both product name and brand')
      return
    }

    setIsSearching(true)
    setError('')
    setSearchResult(null)

    try {
      const response = await fetch('/api/products/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'name',
          name: name.trim(),
          brand: brand.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const result = await response.json()
      
      if (result && result.found) {
        setSearchResult(result)
      } else {
        setError('Product not found. Please check the name and brand, or try uploading an image.')
      }
    } catch (err) {
      setError('Search failed. Please try again.')
      console.error('AI search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate image for AI analysis
    const validation = validateImageForAI(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid image file')
      return
    }

    setIsSearching(true)
    setError('')
    setSearchResult(null)
    setCompressionStatus('Compressing image for optimal AI analysis...')

    try {
      // Aggressively compress the image for AI analysis
      const compressedImage = await aggressiveCompressImage(file, 512 * 1024) // 512KB target
      
      setCompressionStatus('')
      
      // Store the compressed data URL for display
      setUploadedImageData(compressedImage.dataUrl)

      // First, upload the compressed image to get a URL
      const uploadResponse = await fetch('/api/products/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: compressedImage.base64,
          fileName: file.name
        })
      })

      if (!uploadResponse.ok) {
        throw new Error('Image upload failed')
      }

      const uploadResult = await uploadResponse.json()
      const uploadedImageUrl = uploadResult.imageUrl

      // Now analyze the compressed image
      const response = await fetch('/api/products/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'image',
          imageBase64: compressedImage.base64
        })
      })

      if (!response.ok) {
        throw new Error('Image analysis failed')
      }

      const result = await response.json()
      
      if (result.found) {
        setSearchResult({
          name: result.name || '',
          brand: result.brand || '',
          price: result.price || 0,
          image_url: uploadedImageUrl, // Use the uploaded image URL
          description: result.description || '',
          size: result.size || '',
          category: result.category || '',
          upc: result.upc || '',
          found: result.found // Use the actual found value from AI response
        })
      } else {
        setError('Could not identify product from image. Please try a clearer photo or use text search.')
      }
    } catch (err) {
      setError('Image analysis failed. Please try again.')
      console.error('Image parsing error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleUseResult = () => {
    if (searchResult) {
      onProductFound({
        ...searchResult,
        uploadedImage: uploadedImageData // Keep for display purposes
      })
    }
  }

  const handleRetry = () => {
    setSearchResult(null)
    setError('')
    setUploadedImageData('')
    setCompressionStatus('')
    if (searchMode === 'name') {
      setName('')
      setBrand('')
    }
  }

  // Scroll content to top when modal opens
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [])

  return (
          <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md flex flex-col max-h-screen min-h-0"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex-shrink-0 sticky top-0 z-10 bg-white rounded-t-2xl flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">AI Product Search</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto px-2 sm:px-6 pb-4 space-y-6 modal-scroll" 
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          tabIndex={-1}
        >
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSearchMode('name')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'name'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Search className="w-4 h-4 inline mr-2" />
              Text Search
            </button>
            <button
              onClick={() => setSearchMode('image')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'image'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Image Upload
            </button>
          </div>

          {/* Search Mode */}
          {searchMode === 'name' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Pro Filt'r Soft Matte Longwear Liquid Foundation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSearching}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g., Fenty Beauty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSearching}
                />
              </div>
              <button
                onClick={handleNameSearch}
                disabled={isSearching || !name.trim() || !brand.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search Product</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Image Upload Mode */}
          {searchMode === 'image' && (
            <div className="space-y-4">
              {!uploadedImageData ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isSearching}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isSearching}
                  />
                  <input
                    ref={frontCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isSearching}
                  />
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={isSearching}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
                      >
                        {isSearching ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4" />
                            <span>Back Camera</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => frontCameraInputRef.current?.click()}
                        disabled={isSearching}
                        className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
                      >
                        {isSearching ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4" />
                            <span>Front Camera</span>
                          </>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSearching}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Choose from Gallery</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Take a photo or choose from your gallery. For best results, ensure the product packaging is clearly visible.
                  </p>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-700">
                        <p className="font-medium mb-1">Image Optimization</p>
                        <p>Images are automatically compressed to optimize AI analysis while reducing storage usage. This helps maintain search accuracy while staying within storage limits.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={uploadedImageData}
                      alt="Uploaded product"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    {isSearching && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="text-white text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <p>{compressionStatus || 'Analyzing image...'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setUploadedImageData('')
                      setSearchResult(null)
                      setError('')
                    }}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
                  >
                    Upload Different Image
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={handleRetry}
                className="text-red-600 hover:text-red-800 text-sm font-medium mt-2"
              >
                Try Again
              </button>
            </div>
          )}

                    {/* Search Result */}
          {searchResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4"
            >
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-green-800 mb-3">
                    Product Found!
                    <span className="text-xs text-green-600 ml-2">✓ AI Enhanced</span>
                  </h3>
                  <div className="space-y-2 text-sm text-green-700">
                    <div><strong>Name:</strong> <span className="break-words">{searchResult.name}</span></div>
                    <div><strong>Brand:</strong> {searchResult.brand}</div>
                    {searchResult.price > 0 && (
                      <div><strong>Price:</strong> ${searchResult.price.toFixed(2)}</div>
                    )}
                    {searchResult.category && (
                      <div><strong>Category:</strong> {searchResult.category}</div>
                    )}
                    {searchResult.size && (
                      <div><strong>Size:</strong> {searchResult.size}</div>
                    )}
                    {searchResult.upc && (
                      <div><strong>UPC:</strong> {searchResult.upc}</div>
                    )}
                    {searchResult.description && (
                      <div>
                        <strong>Description:</strong>
                        <p className="mt-1 text-xs leading-relaxed break-words">{searchResult.description}</p>
                      </div>
                    )}
                    {searchResult.ingredients && searchResult.ingredients.length > 0 && (
                      <div>
                        <strong>Key Ingredients:</strong>
                        <ul className="list-disc list-inside ml-2 text-xs mt-1">
                          {searchResult.ingredients.slice(0, 5).map((ingredient: string, index: number) => (
                            <li key={index} className="break-words">{ingredient}</li>
                          ))}
                          {searchResult.ingredients.length > 5 && (
                            <li className="text-gray-500">...and {searchResult.ingredients.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleUseResult}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium w-full"
                  >
                    Use This Information
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AIProductSearch 