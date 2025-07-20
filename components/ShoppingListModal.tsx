import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, X, Plus, Minus, Trash2, Check } from 'lucide-react'
import { ShoppingList, ShoppingListItem, Product } from '../types/product'
import toast from 'react-hot-toast'

interface ShoppingListModalProps {
  isOpen: boolean
  onClose: () => void
  shoppingList: ShoppingList | null
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>
  onRemoveItem: (itemId: string) => Promise<void>
  onClearList: () => Promise<void>
  loading: boolean
}

export default function ShoppingListModal({
  isOpen,
  onClose,
  shoppingList,
  onUpdateQuantity,
  onRemoveItem,
  onClearList,
  loading
}: ShoppingListModalProps) {
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      await onUpdateQuantity(itemId, newQuantity)
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      await onRemoveItem(itemId)
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }



  const totalItems = shoppingList?.items?.length || 0
  const checkedOutItems = shoppingList?.items?.filter(item => item.is_checked_out).length || 0

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-full">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-elegant font-bold">
                      Shopping List
                    </h2>
                    <p className="text-rose-100 text-sm">
                      {shoppingList?.name} • {totalItems} items ({checkedOutItems} checked out)
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
                </div>
              ) : shoppingList?.items && shoppingList.items.length > 0 ? (
                <div className="space-y-4">
                  {shoppingList.items.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-gray-50 rounded-lg p-4 border-l-4 ${
                        item.is_checked_out 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-rose-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            {item.product && (
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-12 h-12 rounded-lg object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = '/placeholder-product.png'
                                }}
                              />
                            )}
                            <div className="flex-1">
                              <h3 className={`font-medium ${
                                item.is_checked_out ? 'text-green-700 line-through' : 'text-gray-900'
                              }`}>
                                {item.product?.name || 'Product'}
                              </h3>
                              <p className={`text-sm ${
                                item.is_checked_out ? 'text-green-600' : 'text-gray-600'
                              }`}>
                                {item.product?.brand || 'Brand'} • ${item.product?.price || 0}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Quantity Controls */}
                          {!item.is_checked_out && (
                            <div className="flex items-center space-x-1 bg-white rounded-lg border">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                disabled={updatingItems.has(item.id) || item.quantity <= 1}
                                className="p-1 hover:bg-gray-100 rounded-l-lg disabled:opacity-50"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="px-2 py-1 text-sm font-medium min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                disabled={updatingItems.has(item.id)}
                                className="p-1 hover:bg-gray-100 rounded-r-lg disabled:opacity-50"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={updatingItems.has(item.id)}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <ShoppingBag className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Your shopping list is empty
                  </h3>
                  <p className="text-gray-600">
                    Add products from the shelf to your shopping list to get started.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {shoppingList?.items && shoppingList.items.length > 0 && (
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {totalItems} items in your list
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={onClearList}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 