'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Palette, Star, Users, Package, AlertCircle, Settings } from 'lucide-react'
import { Product } from '../types/product'
import { getFallbackImage, getBestImageUrl, isReliableImageUrl } from '../lib/image-fallback'

interface ProductCardProps {
  product: Product
  onUseProduct: (id: string) => void
  onViewDetails?: (product: Product) => void
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onUseProduct, onViewDetails }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const isActive = product.is_active
  const metadata = product.metadata || {}
  const isFound = metadata.source === 'real_data' || metadata.found === true
  
  // Debug logging
  const bestImageUrl = getBestImageUrl(product.image_url || '', product.name)
  const isUsingFallback = bestImageUrl !== product.image_url
  console.log('ProductCard render:', {
    name: product.name,
    originalImageUrl: product.image_url,
    bestImageUrl: bestImageUrl,
    isUsingFallback: isUsingFallback,
    isFound,
    source: metadata.source,
    imageLoaded,
    imageError
  })
  
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
        
        {/* Error State - Show fallback image */}
        {imageError && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-rose-200 relative z-10">
            <div className="text-center">
              <Package className="w-12 h-12 text-pink-400 mx-auto mb-2" />
              <p className="text-sm text-pink-600 font-medium px-2">{product.name}</p>
              <p className="text-xs text-pink-500 mt-1">Fallback Image</p>
            </div>
          </div>
        )}
        
        {/* Product Image - Only show if loaded successfully */}
        {!imageError && (
          <img
            src={getBestImageUrl(product.image_url || '', product.name)}
            alt={product.name}
            className={`w-full h-full object-cover transition-all duration-300 hover:scale-105 relative z-10 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => {
              console.log('Image loaded successfully:', product.image_url)
              setImageLoaded(true)
              setImageError(false)
            }}
            onError={(e) => {
              console.log('Image failed to load:', product.image_url)
              setImageError(true)
              setImageLoaded(false)
            }}
            loading="lazy"
            crossOrigin="anonymous"
          />
        )}
        
        {/* Fallback placeholder when no image URL is provided */}
        {!product.image_url && !imageLoaded && !imageError && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-rose-200 relative z-10">
            <div className="text-center">
              <Package className="w-12 h-12 text-pink-400 mx-auto mb-2" />
              <p className="text-sm text-pink-600 font-medium px-2">{product.name}</p>
              <p className="text-xs text-pink-500 mt-1">No Image</p>
            </div>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-0" />
        
        {/* Status Badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium z-20 ${
          isActive 
            ? 'bg-pink-500 text-white' 
            : 'bg-gray-500 text-white'
        }`}>
          {isActive ? 'In Your Vault' : 'Used Up'}
        </div>

        {/* Source Badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium z-20 ${
          isFound 
            ? 'bg-green-500 text-white' 
            : 'bg-orange-500 text-white'
        }`}>
          {isFound ? 'Product Found' : 'Not Found'}
        </div>

        {/* Fallback Indicator */}
        {isUsingFallback && (
          <div className="absolute top-3 left-16 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white z-20">
            Fallback
          </div>
        )}

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
        {metadata.rating && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-700">{metadata.rating}</span>
            </div>
            {metadata.reviews && (
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

        {/* Use Product Button */}
        {isActive && product.quantity > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onUseProduct(product.id)}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-4 rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <div className="flex items-center justify-center gap-2">
              <Heart className="w-4 h-4" />
              Use Product
            </div>
          </motion.button>
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