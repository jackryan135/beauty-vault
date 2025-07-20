import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, X, Trash2, Check, Users, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { ShoppingList } from '../types/product'

interface AdminShoppingListsModalProps {
  isOpen: boolean
  onClose: () => void
  shoppingLists: ShoppingList[]
  onClearList: (listId: string) => Promise<void>
  onCheckoutItem: (itemId: string) => Promise<void>
  onCheckoutAll: (listId: string) => Promise<void>
  onRemoveItem: (itemId: string) => Promise<void>
  loading: boolean
}

export default function AdminShoppingListsModal({
  isOpen,
  onClose,
  shoppingLists,
  onClearList,
  onCheckoutItem,
  onCheckoutAll,
  onRemoveItem,
  loading
}: AdminShoppingListsModalProps) {
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set())
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  const toggleListExpansion = (listId: string) => {
    setExpandedLists(prev => {
      const newSet = new Set(prev)
      if (newSet.has(listId)) {
        newSet.delete(listId)
      } else {
        newSet.add(listId)
      }
      return newSet
    })
  }

  const handleCheckoutItem = async (itemId: string) => {
    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      await onCheckoutItem(itemId)
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

  const handleCheckoutAll = async (listId: string) => {
    setUpdatingItems(prev => new Set(prev).add(`list-${listId}`))
    try {
      await onCheckoutAll(listId)
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(`list-${listId}`)
        return newSet
      })
    }
  }

  const handleClearList = async (listId: string) => {
    if (!confirm('Are you sure you want to clear this shopping list? This cannot be undone.')) {
      return
    }
    
    setUpdatingItems(prev => new Set(prev).add(`clear-${listId}`))
    try {
      await onClearList(listId)
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(`clear-${listId}`)
        return newSet
      })
    }
  }

  const totalLists = shoppingLists.length
  const totalItems = shoppingLists.reduce((sum, list) => sum + (list.items?.length || 0), 0)

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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-sephora-500 to-rose-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-full">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-elegant font-bold">
                      All Shopping Lists
                    </h2>
                    <p className="text-sephora-100 text-sm">
                      {totalLists} active lists • {totalItems} total items
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sephora-500"></div>
                </div>
              ) : shoppingLists.length > 0 ? (
                <div className="space-y-4">
                  {shoppingLists.map((list) => {
                    const totalItems = list.items?.length || 0
                    const checkedOutItems = list.items?.filter(item => item.is_checked_out).length || 0
                    const isExpanded = expandedLists.has(list.id)

                    return (
                      <motion.div
                        key={list.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                      >
                        {/* List Header */}
                        <div className="p-4 bg-white border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-rose-100 rounded-full">
                                <ShoppingBag className="h-5 w-5 text-rose-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {list.user_name || 'Unknown User'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {totalItems} items • {checkedOutItems} checked out
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleListExpansion(list.id)}
                                className="p-2 hover:bg-sephora-50 rounded-lg transition-colors border border-gray-200 hover:border-sephora-200"
                                title={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-5 w-5 text-sephora-600" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-sephora-600" />
                                )}
                              </button>
                              <button
                                onClick={() => handleCheckoutAll(list.id)}
                                disabled={updatingItems.has(`list-${list.id}`) || checkedOutItems === totalItems}
                                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                                title="Check out all items"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleClearList(list.id)}
                                disabled={updatingItems.has(`clear-${list.id}`)}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                                title="Clear list"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* List Items */}
                        <AnimatePresence>
                          {isExpanded && list.items && list.items.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 space-y-3">
                                {list.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${
                                      item.is_checked_out 
                                        ? 'border-green-500 bg-green-50' 
                                        : 'border-rose-500 bg-white'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3 flex-1">
                                      {item.product && (
                                        <img
                                          src={item.product.image_url}
                                          alt={item.product.name}
                                          className="w-10 h-10 rounded-lg object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = '/placeholder-product.png'
                                          }}
                                        />
                                      )}
                                      <div className="flex-1">
                                        <h4 className={`font-medium text-sm ${
                                          item.is_checked_out ? 'text-green-700 line-through' : 'text-gray-900'
                                        }`}>
                                          {item.product?.name || 'Product'}
                                        </h4>
                                        <p className={`text-xs ${
                                          item.is_checked_out ? 'text-green-600' : 'text-gray-600'
                                        }`}>
                                          Qty: {item.quantity} • ${item.product?.price || 0}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-1">
                                      {!item.is_checked_out ? (
                                        <>
                                          <button
                                            onClick={() => handleCheckoutItem(item.id)}
                                            disabled={updatingItems.has(item.id)}
                                            className="p-1 bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50 transition-colors"
                                            title="Check out item"
                                          >
                                            <Check className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            disabled={updatingItems.has(item.id)}
                                            className="p-1 bg-red-500 hover:bg-red-600 text-white rounded disabled:opacity-50 transition-colors"
                                            title="Remove item"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </>
                                      ) : (
                                        <span className="text-green-600 text-xs font-medium">
                                          Checked out
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Package className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No active shopping lists
                  </h3>
                  <p className="text-gray-600">
                    When guests create shopping lists, they will appear here for you to manage.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 