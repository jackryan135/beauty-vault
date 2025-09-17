'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Hash, Loader, Gem, Sparkles, Search, Camera } from 'lucide-react'
import BarcodeScanner from './BarcodeScanner';
import AIProductSearch from './AIProductSearch';

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onAddProduct: (sku: string, productInfo?: any) => void
}

export default function AddProductModal({ isOpen, onClose, onAddProduct }: AddProductModalProps) {
  const [sku, setSku] = useState('')
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerKey, setScannerKey] = useState(0)
  const [showAISearch, setShowAISearch] = useState(false)
  const [entryMode, setEntryMode] = useState<'sku' | 'ai'>('sku')
  const [aiProductInfo, setAiProductInfo] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sku.trim()) return

    setLoading(true)
    try {
      await onAddProduct(sku.trim(), aiProductInfo)
      setSku('')
      setAiProductInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const handleBarcodeDetected = (code: string) => {
    setSku(code)
    setShowScanner(false)
  }

  const handleAIProductFound = (productInfo: {
    name: string
    brand: string
    image_url: string
    description?: string
    size?: string
    category?: string
    uploadedImage?: string
    upc?: string
    found?: boolean
  }) => {
    // Generate SKU: Use UPC if available, otherwise create a shorter brand-name ID
    let customSku: string
    if (productInfo.upc && productInfo.upc.length >= 8) {
      // Use UPC code if available and valid length
      customSku = productInfo.upc
    } else {
      // Create shorter brand-name identifier
      const brandShort = productInfo.brand.replace(/\s+/g, '').substring(0, 8)
      const nameShort = productInfo.name.replace(/\s+/g, '').substring(0, 12)
      customSku = `${brandShort}-${nameShort}`.toUpperCase()
    }
    
    setSku(customSku)
    // Store the AI product info with the uploaded image URL
    setAiProductInfo({
      ...productInfo,
      image_url: productInfo.image_url || productInfo.uploadedImage || ''
    })
    setShowAISearch(false)
    setEntryMode('sku')
  }

  // Cleanup scanner when modal closes
  useEffect(() => {
    if (!isOpen && showScanner) {
      setShowScanner(false)
    }
  }, [isOpen, showScanner])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowScanner(false);
              setTimeout(onClose, 300); // allow scanner cleanup before parent closes
            }}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="modal-content w-full max-w-sm sm:max-w-md p-2 sm:p-8 overflow-hidden"
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
                onClick={() => {
                  setShowScanner(false);
                  setTimeout(onClose, 300);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Entry Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setEntryMode('sku')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  entryMode === 'sku'
                    ? 'bg-white text-sephora-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Hash className="w-4 h-4 inline mr-2" />
                SKU Entry
              </button>
              <button
                onClick={() => setEntryMode('ai')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  entryMode === 'ai'
                    ? 'bg-white text-sephora-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Search className="w-4 h-4 inline mr-2" />
                AI Search
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              {entryMode === 'sku' ? (
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
                      onClick={() => { setScannerKey(prev => prev + 1); setShowScanner(true); }}
                    >
                      <span role="img" aria-label="Scan">📷</span>
                      Scan Barcode
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    We&apos;ll automatically generate product details for your collection
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-3">
                    AI Product Search
                  </label>
                  <div className="border-2 border-dashed border-sephora-200 rounded-lg p-6 text-center">
                    <Search className="h-8 w-8 text-sephora-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">
                      Search by product name and brand, or upload a photo for automatic identification
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAISearch(true)}
                      className="btn-primary px-6 py-3 flex items-center justify-center space-x-2 mx-auto"
                    >
                      <Search className="h-5 w-5" />
                      <span>Start AI Search</span>
                    </button>
                  </div>
                  {sku && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        <strong>Generated SKU:</strong> {sku}
                      </p>
                      {sku.length >= 12 && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ UPC code detected from image
                        </p>
                      )}
                      {aiProductInfo && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ AI product information available
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={!sku.trim() || loading}
                whileHover={!sku.trim() || loading ? {} : { scale: 1.01 }}
                whileTap={!sku.trim() || loading ? {} : { scale: 0.99 }}
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
                key={scannerKey}
                onDetected={handleBarcodeDetected}
                onClose={() => setShowScanner(false)}
              />
            )}

            {/* AI Search Modal */}
            {showAISearch && (
              <AIProductSearch
                onProductFound={handleAIProductFound}
                onClose={() => setShowAISearch(false)}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 