'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Palette, Star, Users, Package, AlertCircle, Settings, Lock, Share2, ShoppingCart } from 'lucide-react'
import { Product } from '../types/product'
import { getFallbackImage, getDisplayImageUrl } from '../lib/image-fallback'

interface ProductCardProps {
  product: Product
  onUseProduct: (id: string) => void
  onViewDetails?: (product: Product) => void
  onStatusChange?: (id: string, status: 'in_vault' | 'on_shelf') => void
  onAddToShoppingList?: (productId: string) => void
  editedImageUrl?: string | null
  isGuest?: boolean
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onUseProduct, 
  onViewDetails, 
  onStatusChange,
  onAddToShoppingList,
  editedImageUrl,
  isGuest = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isStatusChanging, setIsStatusChanging] = useState(false)
  
  const isActive = product.is_active
  const metadata = product.metadata || {}
  const isFound = metadata.source === 'real_data' || metadata.found === true
  
  // Debug logging
  useEffect(() => {
    console.log('ProductCard mounted:', {
      name: product.name,
      originalImageUrl: product.image_url,
      isFound,
      source: metadata.source,
      status: product.status
    })
  }, [product.name, product.image_url, isFound, metadata.source, product.status])
  
  console.log('ProductCard render:', {
    name: product.name,
    originalImageUrl: product.image_url,
    isFound,
    source: metadata.source,
    imageLoaded,
    imageError,
    status: product.status
  })

  const handleStatusChange = async (newStatus: 'in_vault' | 'on_shelf') => {
    if (!onStatusChange || isStatusChanging) return
    
    setIsStatusChanging(true)
    try {
      await onStatusChange(product.id, newStatus)
    } catch (error) {
      console.error('Error changing status:', error)
    } finally {
      setIsStatusChanging(false)
    }
  }

  const getStatusBadge = () => {
    switch (product.status) {
      case 'in_vault':
        return (
          <div className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Lock className="w-3 h-3" />
            In Vault
          </div>
        )
      case 'on_shelf':
        return (
          <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Share2 className="w-3 h-3" />
            On Shelf
          </div>
        )
      case 'used_up':
        return (
          <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            Used Up
          </div>
        )
      default:
        return null
    }
  }

  const getStatusButton = () => {
    if (!isActive || product.quantity <= 0) return null

    if (product.status === 'in_vault') {
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleStatusChange('on_shelf')}
          disabled={isStatusChanging}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" />
            {isStatusChanging ? 'Moving...' : 'Add to Shelf'}
          </div>
        </motion.button>
      )
    } else if (product.status === 'on_shelf') {
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleStatusChange('in_vault')}
          disabled={isStatusChanging}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            {isStatusChanging ? 'Moving...' : 'Add to Vault'}
          </div>
        </motion.button>
      )
    }
    return null
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 ${
        isActive 
          ? 'bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200' 
          : 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 opacity-75'
      }`}
    >
      {/* Product Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-pink-100 to-rose-100">
        {/* Loading State */}
        {!imageLoaded && !imageError && (
          <div className="w-full h-full flex items-center justify-center relative z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        )}
        
        {/* Product Image */}
        <img
          src={getDisplayImageUrl(product.image_url, editedImageUrl, product.name)}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-300 hover:scale-105 relative z-10 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => {
            console.log('Image loaded successfully:', {
              originalUrl: product.image_url,
              editedUrl: editedImageUrl,
              productName: product.name
            })
            setImageLoaded(true)
            setImageError(false)
          }}
          onError={(e) => {
            console.log('Image failed to load:', {
              originalUrl: product.image_url,
              editedUrl: editedImageUrl,
              productName: product.name
            })
            const target = e.target as HTMLImageElement
            target.src = getFallbackImage(product.name)
            setImageError(true)
            setImageLoaded(false)
          }}
          loading="lazy"
          crossOrigin="anonymous"
        />
        

        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-0" />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-20">
          {getStatusBadge()}
        </div>

        {/* Source Badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium z-20 ${
          isFound 
            ? 'bg-green-500 text-white' 
            : 'bg-orange-500 text-white'
        }`}>
          {isFound ? 'Product Found' : 'Not Found'}
        </div>



        {/* Details Button */}
        {onViewDetails && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewDetails(product)}
            className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-full shadow-lg backdrop-blur-sm z-20"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-6">
        {/* Brand and Name */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-4 h-4 text-pink-500" />
            <span className="text-sm font-medium text-pink-600">{product.brand}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
        </div>

        {/* Not Found Warning */}
        {!isFound && (
          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Product information not found</span>
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Please verify the SKU or add product details manually
            </p>
          </div>
        )}

        {/* Enhanced Product Details */}
        {metadata.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{metadata.description}</p>
        )}

        {/* Category and Size */}
        <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
          {metadata.category && (
            <div className="flex items-center gap-1">
              <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs">
                {metadata.category}
              </span>
            </div>
          )}
          {metadata.size && (
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>{metadata.size}</span>
            </div>
          )}
        </div>

        {/* Rating and Reviews */}
        {metadata.rating && metadata.rating > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-700">{metadata.rating}</span>
            </div>
            {metadata.reviews && metadata.reviews > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Users className="w-3 h-3" />
                <span>({metadata.reviews.toLocaleString()} reviews)</span>
              </div>
            )}
          </div>
        )}

        {/* Price and Quantity */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-pink-600">
            {product.price > 0 ? `$${product.price}` : 'Price Unknown'}
          </div>
          <div className="text-sm text-gray-500">
            SKU: {product.sku}
          </div>
        </div>

        {/* Quantity and Usage Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Quantity:</span> {product.quantity}
          </div>
          {metadata.entry_count && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Added:</span> {metadata.entry_count} time{metadata.entry_count > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isActive && product.quantity > 0 && (
          <div className="space-y-3">
            {isGuest ? (
              // Guest view - show shopping list button
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onAddToShoppingList?.(product.id)}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:from-rose-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <div className="flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Add to Shopping List
                </div>
              </motion.button>
            ) : (
              // Admin view - show check out button
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onUseProduct(product.id)}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <div className="flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4" />
                  Check out
                </div>
              </motion.button>
            )}

            {/* Status Change Button - only for admin */}
            {!isGuest && getStatusButton()}
          </div>
        )}

        {/* Used Up Message */}
        {!isActive && (
          <div className="text-center py-3 px-4 bg-gray-100 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Heart className="w-4 h-4" />
              <span className="font-medium">Used Up</span>
            </div>
            {metadata.last_used && (
              <p className="text-xs text-gray-500 mt-1">
                Last used: {new Date(metadata.last_used).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Usage Count */}
        {metadata.usage_count && (
          <div className="text-center mt-2 text-xs text-gray-500">
            Used {metadata.usage_count} time{metadata.usage_count > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ProductCard 