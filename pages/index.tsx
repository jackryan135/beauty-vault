import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Package, ShoppingBag, ArrowUp, ArrowDown, Heart, Palette, Trash2 } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import AddProductModal from '../components/AddProductModal'
import ScanOutModal from '../components/ScanOutModal'
import ProductDetailsModal from '../components/ProductDetailsModal'
import { Product } from '../types/product'
import toast from 'react-hot-toast'
import Head from 'next/head'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isScanOutModalOpen, setIsScanOutModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)
  const [editingData, setEditingData] = useState<{ [key: string]: any }>({})

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
      setProducts([]) // Set empty array on error to prevent infinite loading
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async (sku: string) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sku }),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.action === 'scanned_in') {
          // Update existing product quantity
          setProducts(prev => 
            prev.map(product => 
              product.sku === sku 
                ? { ...result, id: product.id } // Keep existing ID
                : product
            )
          )
          toast.success(result.message)
        } else {
          // Add new product
          setProducts(prev => [result, ...prev])
          toast.success(result.message)
        }
        
        setIsModalOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add product')
      }
    } catch (error) {
      toast.error('Failed to add product')
    }
  }

  const handleScanOutBySku = async (sku: string) => {
    try {
      // First find the product by SKU
      const product = products.find(p => p.sku.toLowerCase() === sku.toLowerCase())
      
      if (!product) {
        toast.error('Product not found with that SKU')
        return
      }

      if (product.quantity === 0) {
        toast.error('Product is already out of stock')
        return
      }

      const response = await fetch(`/api/products/${product.id}/scan-out`, {
        method: 'PATCH',
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setProducts(prev => 
          prev.map(p => 
            p.id === product.id 
              ? updatedProduct
              : p
          )
        )
        toast.success('Product scanned out successfully!')
        setIsScanOutModalOpen(false)
      } else {
        toast.error('Failed to scan out product')
      }
    } catch (error) {
      toast.error('Failed to scan out product')
    }
  }

  const handleScanOut = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/scan-out`, {
        method: 'PATCH',
      })

      if (response.ok) {
        const updatedProduct = await response.json()
        setProducts(prev => 
          prev.map(product => 
            product.id === productId 
              ? updatedProduct
              : product
          )
        )
        toast.success('Product scanned out successfully!')
      } else {
        toast.error('Failed to scan out product')
      }
    } catch (error) {
      toast.error('Failed to scan out product')
    }
  }

  const handleClearDatabase = async () => {
    if (!confirm('Are you sure you want to clear all products? This cannot be undone.')) {
      return
    }

    setIsClearing(true)
    try {
      const response = await fetch('/api/products/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Clear database result:', result)
        toast.success('Database cleared successfully!')
        setProducts([]) // Immediately clear the products array
        await fetchProducts() // Then refetch to ensure sync
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Clear database error:', errorData)
        toast.error(`Failed to clear database: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Clear database error:', error)
      toast.error('Failed to clear database')
    } finally {
      setIsClearing(false)
    }
  }

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product)
    setIsDetailsModalOpen(true)
    // Clear any previous editing data
    setEditingData({})
  }

  const handleEditingChange = (productId: string, field: string, value: any) => {
    setEditingData(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }))
  }

  const handleUpdateProduct = async (updatedProduct: Partial<Product>) => {
    if (!selectedProduct) return

    try {
      const response = await fetch(`/api/products/${selectedProduct.id}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProduct),
      })

      if (response.ok) {
        const result = await response.json()
        setProducts(prev => 
          prev.map(p => 
            p.id === selectedProduct.id 
              ? result.product
              : p
          )
        )
        toast.success('Product updated successfully!')
        setIsDetailsModalOpen(false)
        setSelectedProduct(null)
      } else {
        toast.error('Failed to update product')
      }
    } catch (error) {
      toast.error('Failed to update product')
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeProducts = filteredProducts.filter(p => p.is_active)
  const inactiveProducts = filteredProducts.filter(p => !p.is_active)

  return (
    <>
      <Head>
        <title>Olivia&apos;s Beauty Vault - Product Management</title>
        <meta name="description" content="Olivia Ryan&apos;s personal beauty product collection with elegant styling" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-sephora-50 to-rose-50">
        {/* Header */}
        <header className="glass-effect border-b border-sephora-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="sephora-gradient p-3 rounded-full">
                  <Palette className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-elegant font-bold text-gradient">
                    Olivia&apos;s Beauty Vault
                  </h1>
                  <p className="text-sephora-600 text-sm">Your personal beauty collection</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Dev Clear Database Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearDatabase}
                  disabled={isClearing}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-3 rounded-full font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Trash2 className="h-5 w-5" />
                  <span>{isClearing ? 'Clearing...' : 'Clear DB'}</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsScanOutModalOpen(true)}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-full font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <ArrowDown className="h-5 w-5" />
                  <span>Use by SKU</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsModalOpen(true)}
                  className="sephora-gradient text-white px-6 py-3 rounded-full font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <ArrowUp className="h-5 w-5" />
                  <span>Add to Vault</span>
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-sephora-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-sephora-200 focus:border-sephora-400 focus:ring-2 focus:ring-sephora-100 transition-all duration-200 placeholder-sephora-400"
            />
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sephora-500"></div>
            </div>
          ) : (
            <>
              {/* Active Products */}
              {activeProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-12"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <ShoppingBag className="h-6 w-6 text-sephora-600" />
                    <h2 className="text-2xl font-elegant font-semibold text-gray-800">
                      In Your Vault ({activeProducts.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onUseProduct={handleScanOut}
                        onViewDetails={handleViewDetails}
                        editedImageUrl={editingData[product.id]?.image_url}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Inactive Products */}
              {inactiveProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <Package className="h-6 w-6 text-gray-500" />
                    <h2 className="text-2xl font-elegant font-semibold text-gray-600">
                      Used Up ({inactiveProducts.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {inactiveProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onUseProduct={handleScanOut}
                        onViewDetails={handleViewDetails}
                        editedImageUrl={editingData[product.id]?.image_url}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Empty State */}
              {filteredProducts.length === 0 && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <div className="sephora-gradient p-8 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <Heart className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-elegant font-semibold text-gray-800 mb-2">
                    {searchTerm ? 'No products found' : 'Your beauty vault is empty'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm 
                      ? 'Try adjusting your search terms'
                      : 'Start building your beauty collection by scanning in your first product'
                    }
                  </p>
                  {!searchTerm && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsModalOpen(true)}
                      className="sephora-gradient text-white px-6 py-3 rounded-full font-medium flex items-center space-x-2"
                    >
                      <ArrowUp className="h-5 w-5" />
                      <span>Add Your First Product</span>
                    </motion.button>
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Add Product Modal */}
        <AddProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddProduct={handleAddProduct}
        />

        {/* Scan Out Modal */}
        <ScanOutModal
          isOpen={isScanOutModalOpen}
          onClose={() => setIsScanOutModalOpen(false)}
          onScanOut={handleScanOutBySku}
        />
        
        {/* Product Details Modal */}
        <ProductDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false)
            setSelectedProduct(null)
            setEditingData({})
          }}
          product={selectedProduct}
          onSave={handleUpdateProduct}
          onEditingChange={selectedProduct ? (field: string, value: any) => 
            handleEditingChange(selectedProduct.id, field, value) : undefined}
        />
      </div>
    </>
  )
} 