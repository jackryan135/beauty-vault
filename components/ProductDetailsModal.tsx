import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Edit3, Image as ImageIcon } from 'lucide-react'
import { Product } from '../types/product'
import { getFallbackImage, getDisplayImageUrl } from '../lib/image-fallback'

interface ProductDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSave: (updatedProduct: Partial<Product>) => void
  onEditingChange?: (field: string, value: string | number | boolean) => void
}

interface FormData {
  name: string
  brand: string
  price: number
  description: string
  category: string
  size: string
  image_url: string
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
  onEditingChange
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    brand: '',
    price: 0,
    description: '',
    category: '',
    size: '',
    image_url: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        price: Number(product.price) || 0,
        description: product.metadata?.description || '',
        category: product.metadata?.category || '',
        size: product.metadata?.size || '',
        image_url: product.image_url || ''
      })
    }
  }, [product])

  const handleSave = async () => {
    if (!product) return

    setIsSaving(true)
    try {
      const updatedProduct = {
        ...product,
        name: formData.name,
        brand: formData.brand,
        price: formData.price,
        image_url: formData.image_url,
        metadata: {
          ...product.metadata,
          description: formData.description,
          category: formData.category,
          size: formData.size
        }
      }

      await onSave(updatedProduct)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Notify parent component of editing changes
    if (onEditingChange && product) {
      onEditingChange(field, value)
    }
  }

  if (!product) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Product Details</h2>
                <p className="text-gray-600">SKU: {product.sku}</p>
              </div>
              <div className="flex items-center space-x-2">
                {!isEditing && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Image and Basic Info */}
                <div>
                  {/* Product Image */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Image
                    </label>
                    <div className="relative">
                      <img
                        src={getDisplayImageUrl(product.image_url, formData.image_url, formData.name || product.name)}
                        alt={formData.name || product.name}
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = getFallbackImage(formData.name || 'Product')
                        }}
                      />
                      {isEditing && (
                        <div className="mt-2">
                          <input
                            type="url"
                            value={formData.image_url}
                            onChange={(e) => handleInputChange('image_url', e.target.value)}
                            placeholder="Enter image URL"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{formData.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Brand
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.brand}
                          onChange={(e) => handleInputChange('brand', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{formData.brand}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price
                      </label>
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price || ''}
                          onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">${Number(formData.price).toFixed(2)}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter product description..."
                      />
                    ) : (
                      <p className="text-gray-700">{formData.description || 'No description available'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select category</option>
                        {/* Skincare */}
                        <option value="Skincare">Skincare</option>
                        
                        {/* Makeup - Face */}
                        <option value="Foundation">Foundation</option>
                        <option value="Concealer">Concealer</option>
                        <option value="Powder">Powder</option>
                        <option value="Blush">Blush</option>
                        <option value="Bronzer">Bronzer</option>
                        <option value="Highlighter">Highlighter</option>
                        <option value="Primer">Primer</option>
                        <option value="Setting Spray">Setting Spray</option>
                        
                        {/* Makeup - Eyes */}
                        <option value="Eyeshadow">Eyeshadow</option>
                        <option value="Mascara">Mascara</option>
                        <option value="Eyeliner">Eyeliner</option>
                        <option value="Brow">Brow</option>
                        <option value="Eye Primer">Eye Primer</option>
                        
                        {/* Makeup - Lips */}
                        <option value="Lipstick">Lipstick</option>
                        <option value="Lip Gloss">Lip Gloss</option>
                        <option value="Lip Liner">Lip Liner</option>
                        <option value="Lip Balm">Lip Balm</option>
                        
                        {/* Hair Care */}
                        <option value="Hair Care">Hair Care</option>
                        
                        {/* Fragrance */}
                        <option value="Fragrance">Fragrance</option>
                        
                        {/* Body Care */}
                        <option value="Body Care">Body Care</option>
                        
                        {/* Tools & Accessories */}
                        <option value="Tools & Accessories">Tools & Accessories</option>
                        
                        {/* General */}
                        <option value="Beauty">Beauty</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-gray-700">{formData.category || 'Uncategorized'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.size}
                        onChange={(e) => handleInputChange('size', e.target.value)}
                        placeholder="e.g., 1 oz, 30ml"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-700">{formData.size || 'Size not specified'}</p>
                    )}
                  </div>

                  {/* Product Status */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-2">Product Status</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium">{product.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${product.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {product.is_active ? 'Active' : 'Used Up'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Added:</span>
                        <span className="font-medium">{product.metadata?.entry_count || 0} time(s)</span>
                      </div>
                      {product.metadata?.usage_count && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Used:</span>
                          <span className="font-medium">{product.metadata.usage_count} time(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            {isEditing && (
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProductDetailsModal 