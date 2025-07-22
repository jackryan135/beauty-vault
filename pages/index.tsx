import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Package, ArrowDown, Heart, Trash2, LogOut, ShoppingCart, History, Sparkles, Gem, Crown } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import AddProductModal from '../components/AddProductModal'
import ScanOutModal from '../components/ScanOutModal'
import ProductDetailsModal from '../components/ProductDetailsModal'
import LoginModal from '../components/LoginModal'
import ShoppingListModal from '../components/ShoppingListModal'
import AdminShoppingListsModal from '../components/AdminShoppingListsModal'
import CheckoutHistoryModal from '../components/CheckoutHistoryModal'
import BarcodeScanner from '../components/BarcodeScanner'
import { Product, User, ShoppingList, LoginRequest } from '../types/product'
import toast from 'react-hot-toast'
import Head from 'next/head'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isScanOutModalOpen, setIsScanOutModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false)
  const [isAdminShoppingListsModalOpen, setIsAdminShoppingListsModalOpen] = useState(false)
  const [isCheckoutHistoryModalOpen, setIsCheckoutHistoryModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isClearing, setIsClearing] = useState(false)
  const [editingData, setEditingData] = useState<{ [key: string]: Record<string, string | number | boolean> }>({})
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null)
  const [allShoppingLists, setAllShoppingLists] = useState<ShoppingList[]>([])
  const [loginLoading, setLoginLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerKey, setScannerKey] = useState(0)

  const handleBarcodeDetected = (code: string) => {
    setSearchTerm(code)
    setShowScanner(false)
  }

  // Cleanup scanner when user logs out
  useEffect(() => {
    if (!user && showScanner) {
      setShowScanner(false)
    }
  }, [user, showScanner])

  useEffect(() => {
    checkAuth()
    fetchProducts()
  }, [])

  useEffect(() => {
    if (user) {
      if (user.role === 'guest') {
        fetchShoppingList()
      } else if (user.role === 'admin') {
        fetchAllShoppingLists()
      }
    }
  }, [user])

  const checkAuth = () => {
    const sessionToken = localStorage.getItem('session_token')
    const userData = localStorage.getItem('user')
    
    if (sessionToken && userData) {
      try {
        const userObj = JSON.parse(userData)
        const expiresAt = new Date(userObj.session_expires_at)
        
        if (expiresAt > new Date()) {
          setUser(userObj)
        } else {
          // Session expired
          localStorage.removeItem('session_token')
          localStorage.removeItem('user')
          setIsLoginModalOpen(true)
        }
      } catch {
        localStorage.removeItem('session_token')
        localStorage.removeItem('user')
        setIsLoginModalOpen(true)
      }
    } else {
      setIsLoginModalOpen(true)
    }
    setLoading(false)
  }

  const handleLogin = async (loginData: LoginRequest) => {
    setLoginLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      })

      if (response.ok) {
        const result = await response.json()
        setUser(result.user)
        localStorage.setItem('session_token', result.session_token)
        localStorage.setItem('user', JSON.stringify(result.user))
        setIsLoginModalOpen(false)
        toast.success(result.message)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Login failed')
      }
    } catch {
      toast.error('Login failed')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('session_token')
    localStorage.removeItem('user')
    setIsLoginModalOpen(true)
    toast.success('Logged out successfully')
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
      setProducts([])
    }
  }

  const fetchShoppingList = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/shopping-list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setShoppingList(result.shopping_list)
      }
    } catch (error) {
      console.error('Error fetching shopping list:', error)
    }
  }

  const fetchAllShoppingLists = async () => {
    if (!user || user.role !== 'admin') return
    
    try {
      const response = await fetch('/api/admin/shopping-lists', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        setAllShoppingLists(result.shopping_lists)
      }
    } catch (error) {
      console.error('Error fetching all shopping lists:', error)
    }
  }

  const handleAddToShoppingList = async (productId: string) => {
    try {
      const response = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      })

      if (response.ok) {
        toast.success('Added to shopping list!')
        fetchShoppingList()
      } else {
        toast.error('Failed to add to shopping list')
      }
    } catch {
      toast.error('Failed to add to shopping list')
    }
  }

  const handleUpdateShoppingListItem = async (itemId: string, quantity: number) => {
    try {
      const response = await fetch(`/api/shopping-list/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
        body: JSON.stringify({ quantity }),
      })

      if (response.ok) {
        fetchShoppingList()
      } else {
        toast.error('Failed to update item')
      }
    } catch {
      toast.error('Failed to update item')
    }
  }

  const handleRemoveShoppingListItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/shopping-list/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.list_deleted) {
          toast.success('Item removed and shopping list deleted')
          setShoppingList(null)
        } else {
          toast.success('Item removed from shopping list')
          fetchShoppingList()
        }
      } else {
        toast.error('Failed to remove item')
      }
    } catch {
      toast.error('Failed to remove item')
    }
  }



  const handleClearShoppingList = async () => {
    if (!shoppingList) return
    
    try {
      const response = await fetch(`/api/admin/shopping-lists?list_id=${shoppingList.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
      })

      if (response.ok) {
        toast.success('Shopping list cleared!')
        setShoppingList(null)
      } else {
        toast.error('Failed to clear shopping list')
      }
    } catch {
      toast.error('Failed to clear shopping list')
    }
  }

  // Admin shopping list management
  const handleAdminClearList = async (listId: string) => {
    try {
      const response = await fetch(`/api/admin/shopping-lists?list_id=${listId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
      })

      if (response.ok) {
        toast.success('Shopping list cleared!')
        fetchAllShoppingLists()
      } else {
        toast.error('Failed to clear shopping list')
      }
    } catch {
      toast.error('Failed to clear shopping list')
    }
  }

  const handleAdminCheckoutItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/shopping-list-items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
        body: JSON.stringify({ is_checked_out: true }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.list_completed) {
          toast.success('Shopping list completed!')
        } else {
          toast.success('Item checked out!')
        }
        fetchAllShoppingLists()
      } else {
        toast.error('Failed to check out item')
      }
    } catch {
      toast.error('Failed to check out item')
    }
  }

  const handleAdminCheckoutAll = async (listId: string) => {
    try {
      const response = await fetch(`/api/admin/shopping-lists/${listId}/checkout-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
      })

      if (response.ok) {
        toast.success('All items checked out!')
        fetchAllShoppingLists()
      } else {
        toast.error('Failed to check out all items')
      }
    } catch {
      toast.error('Failed to check out all items')
    }
  }

  const handleAdminRemoveItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/admin/shopping-list-items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.list_deleted) {
          toast.success('Item removed and shopping list deleted!')
        } else {
          toast.success('Item removed!')
        }
        fetchAllShoppingLists()
      } else {
        toast.error('Failed to remove item')
      }
    } catch {
      toast.error('Failed to remove item')
    }
  }

  const handleAddProduct = async (sku: string, productInfo?: any) => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sku,
          productInfo: productInfo || undefined
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.action === 'scanned_in') {
          setProducts(prev => 
            prev.map(product => 
              product.sku === sku 
                ? { ...result, id: product.id }
                : product
            )
          )
          toast.success(result.message)
        } else {
          setProducts(prev => [result, ...prev])
          toast.success(result.message)
        }
        
        setIsModalOpen(false)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add product')
      }
    } catch {
      toast.error('Failed to add product')
    }
  }

  const handleScanOutBySku = async (sku: string) => {
    try {
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
    } catch {
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
    } catch {
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
        setProducts([])
        await fetchProducts()
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
    setEditingData({})
  }

  const handleEditingChange = (productId: string, field: string, value: string | number | boolean) => {
    setEditingData(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [field]: value
      }
    }))
  }

  const getEditedImageUrl = (productId: string): string | undefined => {
    const productData = editingData[productId]
    return productData?.image_url as string | undefined
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
    } catch {
      toast.error('Failed to update product')
    }
  }

  const handleStatusChange = async (productId: string, newStatus: 'in_vault' | 'on_shelf') => {
    try {
      const response = await fetch(`/api/products/${productId}/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setProducts(prev => 
          prev.map(p => 
            p.id === productId 
              ? { ...p, status: newStatus }
              : p
          )
        )
        toast.success(`Product moved to ${newStatus === 'in_vault' ? 'Vault' : 'Shelf'}!`)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update product status')
      }
    } catch {
      toast.error('Failed to update product status')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
      })

      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId))
        toast.success('Product deleted successfully')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete product')
      }
    } catch {
      toast.error('Failed to delete product')
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // For guests, only show products on shelf
  const displayProducts = user?.role === 'guest' 
    ? filteredProducts.filter(p => p.status === 'on_shelf' && p.is_active)
    : filteredProducts

  const inVaultProducts = displayProducts.filter(p => p.status === 'in_vault' && p.is_active)
  const onShelfProducts = displayProducts.filter(p => p.status === 'on_shelf' && p.is_active)
  const usedUpProducts = displayProducts.filter(p => p.status === 'used_up' || !p.is_active)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sephora-50 to-rose-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sephora-500"></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Olivia&apos;s Beauty Vault - Product Management</title>
        <meta name="description" content="Olivia Ryan&apos;s personal beauty product collection with elegant styling" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen luxury-gradient">
        {/* Header */}
        <header className="glass-effect-strong border-b border-sephora-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="sephora-gradient p-4 rounded-2xl shadow-large">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-display font-bold text-gradient">
                    Olivia&apos;s Beauty Vault
                  </h1>
                  <p className="text-sephora-600 text-base font-medium">
                    {user ? `${user.name} (${user.role})` : 'Your personal beauty collection'}
                  </p>
                </div>
              </div>
              
              {/* Header Buttons Responsive Container */}
              <div className="flex flex-wrap gap-2 overflow-hidden max-w-full justify-end">
                {/* Login button when not logged in */}
                {!user && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsLoginModalOpen(true)}
                    className="btn-primary flex items-center space-x-2 text-sm px-3 py-2 sm:px-6 sm:py-3 min-w-[120px] sm:min-w-[0]"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span>Login</span>
                  </motion.button>
                )}

                {/* User-specific buttons */}
                {user?.role === 'admin' && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsAdminShoppingListsModalOpen(true)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-medium flex items-center space-x-2 shadow-medium hover:shadow-large transition-all duration-300 text-sm px-3 py-2 sm:px-6 sm:py-3 min-w-[120px] sm:min-w-[0]"
                    >
                      <Crown className="h-5 w-5" />
                      <span>All Lists</span>
                    </motion.button>
                    {/* Only show Clear DB button if not in production */}
                    {process.env.NODE_ENV !== 'production' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleClearDatabase}
                        disabled={isClearing}
                        className="btn-danger flex items-center space-x-2 text-sm px-3 py-2 sm:px-6 sm:py-3 min-w-[120px] sm:min-w-[0]"
                      >
                        <Trash2 className="h-5 w-5" />
                        <span>{isClearing ? 'Clearing...' : 'Clear DB'}</span>
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsScanOutModalOpen(true)}
                      className="rose-gradient text-white rounded-2xl font-medium flex items-center space-x-2 shadow-medium hover:shadow-large transition-all duration-300 text-sm px-3 py-2 sm:px-6 sm:py-3 min-w-[120px] sm:min-w-[0]"
                    >
                      <ArrowDown className="h-5 w-5" />
                      <span>Check out by SKU</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsModalOpen(true)}
                      className="btn-primary flex items-center space-x-2 text-sm px-3 py-2 sm:px-6 sm:py-3 min-w-[120px] sm:min-w-[0]"
                    >
                      <Gem className="h-5 w-5" />
                      <span>Add to Vault</span>
                    </motion.button>
                  </>
                )}

                {user?.role === 'guest' && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsShoppingListModalOpen(true)}
                      className="rose-gradient text-white rounded-2xl font-medium flex items-center space-x-2 shadow-medium hover:shadow-large transition-all duration-300 text-sm px-3 py-2 sm:px-6 sm:py-3 min-w-[120px] sm:min-w-[0]"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span>Shopping List ({shoppingList?.items?.length || 0})</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsCheckoutHistoryModalOpen(true)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-medium flex items-center space-x-2 shadow-medium hover:shadow-large transition-all duration-300 text-sm px-3 py-2 sm:px-6 sm:py-3 min-w-[120px] sm:min-w-[0]"
                    >
                      <History className="h-5 w-5" />
                      <span>Checkout History</span>
                    </motion.button>
                  </>
                )}

                {/* Logout button */}
                {user && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="btn-secondary flex items-center space-x-2 text-sm px-3 py-2 sm:px-6 sm:py-3 min-w-[120px] sm:min-w-[0]"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        {user && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="relative flex items-center">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-sephora-400 h-6 w-6" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-16 pr-6 py-5 text-lg flex-1"
              />
              {/* Mobile-only Scan Barcode button */}
              <button
                type="button"
                className="ml-4 md:hidden bg-sephora-500 hover:bg-sephora-600 text-white px-4 py-5 rounded-2xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={() => { setScannerKey(prev => prev + 1); setShowScanner(true); }}
              >
                <span role="img" aria-label="Scan">📷</span>
                <span className="hidden sm:inline">Scan</span>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 overflow-hidden">
          {!user ? (
            // Not logged in - show login prompt
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24"
            >
              <div className="sephora-gradient p-10 rounded-3xl w-32 h-32 mx-auto mb-8 flex items-center justify-center shadow-luxury">
                <Sparkles className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-3xl font-display font-bold text-gray-800 mb-4">
                Welcome to Olivia&apos;s Beauty Vault
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Please log in to view and manage products.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsLoginModalOpen(true)}
                className="btn-primary flex items-center space-x-3 mx-auto text-lg px-10 py-4"
              >
                <Sparkles className="h-6 w-6" />
                <span>Login</span>
              </motion.button>
            </motion.div>
          ) : user?.role === 'guest' ? (
            // Guest view - only show shelf products
            <>
              {onShelfProducts.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-16"
                >
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-2xl shadow-medium">
                      <Package className="h-7 w-7 text-white" />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-gray-800">
                      Available Products ({onShelfProducts.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 overflow-hidden">
                    {onShelfProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onUseProduct={handleScanOut}
                        onViewDetails={handleViewDetails}
                        onStatusChange={handleStatusChange}
                        onAddToShoppingList={handleAddToShoppingList}
                        editedImageUrl={getEditedImageUrl(product.id)}
                        isGuest={true}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-24"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-10 rounded-3xl w-32 h-32 mx-auto mb-8 flex items-center justify-center shadow-luxury">
                    <Package className="h-16 w-16 text-white" />
                  </div>
                  <h3 className="text-3xl font-display font-bold text-gray-800 mb-4">
                    No products available on shelf
                  </h3>
                  <p className="text-gray-600 text-lg">
                    Check back later for available products.
                  </p>
                </motion.div>
              )}
            </>
          ) : (
            // Admin view - show all products
            <>
              {/* In Vault Products */}
              {inVaultProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-16"
                >
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="sephora-gradient p-3 rounded-2xl shadow-medium">
                      <Gem className="h-7 w-7 text-white" />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-gray-800">
                      In Your Vault ({inVaultProducts.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 overflow-hidden">
                    {inVaultProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onUseProduct={handleScanOut}
                        onViewDetails={handleViewDetails}
                        onStatusChange={handleStatusChange}
                        editedImageUrl={getEditedImageUrl(product.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* On Shelf Products */}
              {onShelfProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mb-16"
                >
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-2xl shadow-medium">
                      <Package className="h-7 w-7 text-white" />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-gray-800">
                      On Shelf ({onShelfProducts.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 overflow-hidden">
                    {onShelfProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onUseProduct={handleScanOut}
                        onViewDetails={handleViewDetails}
                        onStatusChange={handleStatusChange}
                        editedImageUrl={getEditedImageUrl(product.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Used Up Products */}
              {usedUpProducts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="bg-gradient-to-r from-gray-400 to-gray-500 p-3 rounded-2xl shadow-medium">
                      <Package className="h-7 w-7 text-white" />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-gray-600">
                      Used Up ({usedUpProducts.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 overflow-hidden">
                    {usedUpProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onUseProduct={handleScanOut}
                        onViewDetails={handleViewDetails}
                        onStatusChange={handleStatusChange}
                        editedImageUrl={getEditedImageUrl(product.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Empty State */}
              {filteredProducts.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-24"
                >
                  <div className="sephora-gradient p-10 rounded-3xl w-32 h-32 mx-auto mb-8 flex items-center justify-center shadow-luxury">
                    <Heart className="h-16 w-16 text-white" />
                  </div>
                  <h3 className="text-3xl font-display font-bold text-gray-800 mb-4">
                    {searchTerm ? 'No products found' : 'Your beauty vault is empty'}
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg">
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
                      className="btn-primary flex items-center space-x-3 mx-auto text-lg px-8 py-4"
                    >
                      <Gem className="h-6 w-6" />
                      <span>Add Your First Product</span>
                    </motion.button>
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Modals */}
        <AddProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddProduct={handleAddProduct}
        />

        <ScanOutModal
          isOpen={isScanOutModalOpen}
          onClose={() => setIsScanOutModalOpen(false)}
          onScanOut={handleScanOutBySku}
        />
        
        <ProductDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false)
            setSelectedProduct(null)
            setEditingData({})
          }}
          product={selectedProduct}
          onSave={handleUpdateProduct}
          onDelete={handleDeleteProduct}
          onEditingChange={selectedProduct ? (field: string, value: any) => 
            handleEditingChange(selectedProduct.id, field, value) : undefined}
        />

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => {}}
          onLogin={handleLogin}
          loading={loginLoading}
        />

        <ShoppingListModal
          isOpen={isShoppingListModalOpen}
          onClose={() => setIsShoppingListModalOpen(false)}
          shoppingList={shoppingList}
          onUpdateQuantity={handleUpdateShoppingListItem}
          onRemoveItem={handleRemoveShoppingListItem}
          onClearList={handleClearShoppingList}
          loading={false}
        />

        <AdminShoppingListsModal
          isOpen={isAdminShoppingListsModalOpen}
          onClose={() => setIsAdminShoppingListsModalOpen(false)}
          shoppingLists={allShoppingLists}
          onClearList={handleAdminClearList}
          onCheckoutItem={handleAdminCheckoutItem}
          onCheckoutAll={handleAdminCheckoutAll}
          onRemoveItem={handleAdminRemoveItem}
          loading={false}
        />

        <CheckoutHistoryModal
          isOpen={isCheckoutHistoryModalOpen}
          onClose={() => setIsCheckoutHistoryModalOpen(false)}
          user={user}
        />

        {/* Barcode Scanner Modal */}
        {showScanner && (
          <BarcodeScanner
            key={scannerKey}
            onDetected={handleBarcodeDetected}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    </>
  )
} 