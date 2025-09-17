'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Star, Users, Package, AlertCircle, Settings, Share2, ShoppingCart, Sparkles, Gem, Zap } from 'lucide-react'
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
  const isFound = metadata.source === 'real_data' || metadata.source === 'barcode_lookup' || metadata.found === true
  
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
    found: metadata.found,
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
          <div className="status-badge status-badge-vault">
            <Gem className="w-3 h-3" />
            In Vault
          </div>
        )
      case 'on_shelf':
        return (
          <div className="status-badge status-badge-shelf">
            <Share2 className="w-3 h-3" />
            On Shelf
          </div>
        )
      case 'used_up':
        return (
          <div className="status-badge status-badge-used">
            <Package className="w-3 h-3" />
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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleStatusChange('on_shelf')}
          disabled={isStatusChanging}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-medium hover:shadow-large disabled:opacity-50 disabled:cursor-not-allowed"
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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleStatusChange('in_vault')}
          disabled={isStatusChanging}
          className="w-full sephora-gradient text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-medium hover:shadow-large disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center gap-2">
            <Gem className="w-4 h-4" />
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
      whileHover={{ scale: 1.01 }}
      className={`product-card overflow-hidden bg-white rounded-2xl shadow-medium hover:shadow-large transition-all duration-300 ${
        !isActive ? 'opacity-75' : ''
      }`}
    >
      {/* Product Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-sephora-100 to-rose-100">
        {/* Loading State */}
        {!imageLoaded && !imageError && (
          <div className="w-full h-full flex items-center justify-center relative z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sephora-500"></div>
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-0" />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-20">
          {getStatusBadge()}
        </div>

        {/* Source Badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium z-20 shadow-medium ${
          isFound 
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
            : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
        }`}>
          {isFound ? '✓ Found' : '⚠ Not Found'}
        </div>

        {/* Details Button */}
        {onViewDetails && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewDetails(product)}
            className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-gray-700 p-2 rounded-xl shadow-medium backdrop-blur-sm z-20 transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Product Info */}
      <div className="p-6">
        {/* Brand and Name */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-sephora-500" />
            <span className="text-sm font-semibold text-sephora-600">{product.brand}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800 line-clamp-2 leading-tight mb-2">{product.name}</h3>
        </div>

        {/* Not Found Warning */}
        {!isFound && (
          <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
            <div className="flex items-center gap-2 text-orange-700 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Product information not found</span>
            </div>
            <p className="text-xs text-orange-600">
              Please verify the SKU or add product details manually
            </p>
          </div>
        )}

        {/* Enhanced Product Details */}
        {metadata.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{metadata.description}</p>
        )}

        {/* Category and Size */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {metadata.category && (
            <span className="bg-sephora-100 text-sephora-700 px-3 py-1 rounded-full text-xs font-medium">
              {metadata.category}
            </span>
          )}
          {metadata.size && (
            <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
              <Package className="w-3 h-3" />
              <span>{metadata.size}</span>
            </div>
          )}
        </div>

        {/* Rating and Reviews */}
        {metadata.rating && metadata.rating > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-gradient-gold fill-current" />
              <span className="text-sm font-bold text-gray-700">{metadata.rating}</span>
            </div>
            {metadata.reviews && metadata.reviews > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Users className="w-3 h-3" />
                <span className="font-medium">({metadata.reviews.toLocaleString()} reviews)</span>
              </div>
            )}
          </div>
        )}

        {/* SKU */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 font-medium">
            SKU: {product.sku}
          </div>
        </div>

        {/* Quantity and Usage Info */}
        <div className="flex items-center justify-between mb-6 text-sm text-gray-600">
          <div>
            <span className="font-semibold">Quantity:</span> {product.quantity}
          </div>
          {metadata.entry_count && (
            <div>
              <span className="font-semibold">Added:</span> {metadata.entry_count} time{metadata.entry_count > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isActive && product.quantity > 0 && (
          <div className="space-y-3">
            {isGuest ? (
              // Guest view - show shopping list button
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAddToShoppingList?.(product.id)}
                className="w-full rose-gradient text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-medium hover:shadow-large"
              >
                <div className="flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Add to Shopping List
                </div>
              </motion.button>
            ) : (
              // Admin view - show check out button
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onUseProduct(product.id)}
                className="w-full sephora-gradient text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 shadow-medium hover:shadow-large"
              >
                <div className="flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4" />
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
          <div className="text-center py-4 px-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
              <Heart className="w-4 h-4" />
              <span className="font-semibold">Used Up</span>
            </div>
            {metadata.last_used && (
              <p className="text-sm text-gray-500">
                Last used: {new Date(metadata.last_used).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Usage Count */}
        {metadata.usage_count && (
          <div className="text-center mt-3 text-sm text-gray-500 font-medium">
            Used {metadata.usage_count} time{metadata.usage_count > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ProductCard 