import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Package, DollarSign, ShoppingBag, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

interface CheckoutHistoryItem {
  id: string
  name: string
  brand: string
  price: number
  quantity: number
  item_total: number
  image_url: string
  sku: string
  checkout_date: string
}

interface CheckoutHistorySummary {
  total_items: number
  total_value: number
  unique_products: number
}

interface CheckoutHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  user: { id: string; name: string; role: string }
}

export default function CheckoutHistoryModal({
  isOpen,
  onClose,
  user
}: CheckoutHistoryModalProps) {
  const [history, setHistory] = useState<{
    items: CheckoutHistoryItem[]
    summary: CheckoutHistorySummary
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCheckoutHistory = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/guest/checkout-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setHistory(result.checkout_history)
      } else {
        toast.error('Failed to fetch checkout history')
      }
    } catch (error) {
      console.error('Error fetching checkout history:', error)
      toast.error('Failed to fetch checkout history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && user) {
      fetchCheckoutHistory()
    }
  }, [isOpen, user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

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
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-full">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-elegant font-bold">
                      My Checkout History
                    </h2>
                    <p className="text-blue-100 text-sm">
                      All products you&apos;ve checked out over time
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : history ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <Package className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Items</p>
                          <p className="text-2xl font-bold text-blue-800">{history.summary.total_items}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-sm text-green-600 font-medium">Total Value</p>
                          <p className="text-2xl font-bold text-green-800">{formatCurrency(history.summary.total_value)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <ShoppingBag className="h-8 w-8 text-purple-600" />
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Unique Products</p>
                          <p className="text-2xl font-bold text-purple-800">{history.summary.unique_products}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  {history.items.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Checkout History</h3>
                      {history.items.map((item, index) => (
                        <motion.div
                          key={`${item.id}-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-16 h-16 rounded-lg object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/placeholder-product.png'
                              }}
                            />
                            
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              <p className="text-sm text-gray-600">{item.brand}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-sm text-gray-500">
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  {formatDate(item.checkout_date)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  SKU: {item.sku}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                {formatCurrency(item.item_total)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {item.quantity} × {formatCurrency(item.price)}
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
                        No checkout history yet
                      </h3>
                      <p className="text-gray-600">
                        Start adding products to your shopping list and checking them out to see your history here.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {history ? `${history.items.length} items in your checkout history` : 'Loading...'}
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 