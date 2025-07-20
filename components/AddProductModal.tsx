'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Hash, Loader, ArrowUp, Palette } from 'lucide-react'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onAddProduct: (sku: string) => void
}

export default function AddProductModal({ isOpen, onClose, onAddProduct }: AddProductModalProps) {
  const [sku, setSku] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sku.trim()) return

    setLoading(true)
    try {
      await onAddProduct(sku.trim())
      setSku('')
    } finally {
      setLoading(false)
    }
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
            onClick={onClose}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-3xl p-8 max-w-md w-full card-shadow"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="sephora-gradient p-2 rounded-full">
                  <Palette className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-elegant font-bold text-gray-800">
                  Add to Beauty Vault
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                  Product SKU
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sephora-400 h-5 w-5" />
                  <input
                    type="text"
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Enter product SKU..."
                    className="w-full pl-10 pr-4 py-4 border border-sephora-200 rounded-2xl focus:border-sephora-400 focus:ring-2 focus:ring-sephora-100 transition-all duration-200 placeholder-sephora-400"
                    disabled={loading}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  We'll automatically generate product details for your collection
                </p>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={!sku.trim() || loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-2xl font-medium flex items-center justify-center space-x-2 transition-all duration-200 ${
                  !sku.trim() || loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'sephora-gradient text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Adding to Vault...</span>
                  </>
                ) : (
                  <>
                    <ArrowUp className="h-5 w-5" />
                    <span>Add to Beauty Vault</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Info */}
            <div className="mt-6 p-4 bg-sephora-50 rounded-2xl">
              <h3 className="font-medium text-sephora-800 mb-2">How it works:</h3>
              <ul className="text-sm text-sephora-700 space-y-1">
                <li>• <strong>First time:</strong> Creates new product entry</li>
                <li>• <strong>Existing product:</strong> Increases quantity by 1</li>
                <li>• <strong>Product details:</strong> Generated automatically</li>
                <li>• <strong>Scan out:</strong> Use when product is consumed</li>
              </ul>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 