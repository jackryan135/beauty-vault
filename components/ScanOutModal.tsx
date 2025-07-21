'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Hash, Loader, ArrowDown, Heart } from 'lucide-react'

interface ScanOutModalProps {
  isOpen: boolean
  onClose: () => void
  onScanOut: (sku: string) => void
}

export default function ScanOutModal({ isOpen, onClose, onScanOut }: ScanOutModalProps) {
  const [sku, setSku] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sku.trim()) return

    setLoading(true)
    try {
      await onScanOut(sku.trim())
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
            className="relative bg-white rounded-3xl p-2 sm:p-8 w-full max-w-sm sm:max-w-md card-shadow"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-rose-500 p-2 rounded-full">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-elegant font-bold text-gray-800">
                  Use from Beauty Vault
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
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-rose-400 h-5 w-5" />
                  <input
                    type="text"
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Enter product SKU to use..."
                    className="w-full pl-10 pr-4 py-4 border border-rose-200 rounded-2xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all duration-200 placeholder-rose-400"
                    disabled={loading}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Enter the SKU of the product you want to use from your collection
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
                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Using Product...</span>
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-5 w-5" />
                    <span>Use from Vault</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Info */}
            <div className="mt-6 p-4 bg-rose-50 rounded-2xl">
              <h3 className="font-medium text-rose-800 mb-2">How it works:</h3>
              <ul className="text-sm text-rose-700 space-y-1">
                <li>• <strong>Enter SKU:</strong> Type the product SKU you want to use</li>
                <li>• <strong>Quantity Check:</strong> Must have quantity &gt; 0 to use</li>
                <li>• <strong>Decrease by 1:</strong> Reduces quantity by 1 unit</li>
                <li>• <strong>Auto Status:</strong> Becomes inactive when quantity reaches 0</li>
              </ul>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 