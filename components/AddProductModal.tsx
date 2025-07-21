'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Hash, Loader, Gem, Sparkles } from 'lucide-react'
import BarcodeScanner from './BarcodeScanner';

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onAddProduct: (sku: string) => void
}

export default function AddProductModal({ isOpen, onClose, onAddProduct }: AddProductModalProps) {
  const [sku, setSku] = useState('')
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

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

  const handleBarcodeDetected = (code: string) => {
    setSku(code)
    setShowScanner(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop">
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
            className="modal-content w-full max-w-sm sm:max-w-md p-2 sm:p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="sephora-gradient p-3 rounded-2xl shadow-medium">
                  <Gem className="h-7 w-7 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-gray-800">
                  Add to Beauty Vault
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="sku" className="block text-base font-semibold text-gray-700 mb-3">
                  Product SKU
                </label>
                <div className="relative flex items-center">
                  <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sephora-400 h-5 w-5" />
                  <input
                    type="text"
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Enter product SKU..."
                    className="input-field pl-12 pr-4 py-4 text-base focus:ring-2 focus:ring-sephora-100 flex-1"
                    disabled={loading}
                  />
                  {/* Mobile-only Scan Barcode button */}
                  <button
                    type="button"
                    className="ml-2 md:hidden btn-primary px-4 py-2 flex items-center gap-2"
                    onClick={() => setShowScanner(true)}
                  >
                    <span role="img" aria-label="Scan">📷</span>
                    Scan Barcode
                  </button>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  We&apos;ll automatically generate product details for your collection
                </p>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={!sku.trim() || loading}
                whileHover={!sku.trim() || loading ? {} : { scale: 1.02 }}
                whileTap={!sku.trim() || loading ? {} : { scale: 0.98 }}
                className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center space-x-2 transition-all duration-300 ${
                  !sku.trim() || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'btn-primary'
                }`}
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Adding to Vault...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Add to Beauty Vault</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Info */}
            <div className="mt-8 p-6 bg-gradient-to-r from-sephora-50 to-rose-50 rounded-2xl border border-sephora-100 shadow-soft">
              <h3 className="font-semibold text-sephora-800 mb-4 text-base">How it works:</h3>
              <ul className="text-sm text-sephora-700 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-sephora-500 font-bold text-lg">•</span>
                  <span><strong>First time:</strong> Creates new product entry</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-sephora-500 font-bold text-lg">•</span>
                  <span><strong>Existing product:</strong> Increases quantity by 1</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-sephora-500 font-bold text-lg">•</span>
                  <span><strong>Product details:</strong> Generated automatically</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-sephora-500 font-bold text-lg">•</span>
                  <span><strong>Scan out:</strong> Use when product is consumed</span>
                </li>
              </ul>
            </div>

            {/* Barcode Scanner Modal */}
            {showScanner && (
              <BarcodeScanner
                onDetected={handleBarcodeDetected}
                onClose={() => setShowScanner(false)}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 