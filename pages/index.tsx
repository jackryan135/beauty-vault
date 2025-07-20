import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Package, ShoppingBag, ArrowUp, ArrowDown, Heart, Palette, Trash2, LogOut, Users, ShoppingCart, History } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import AddProductModal from '../components/AddProductModal'
import ScanOutModal from '../components/ScanOutModal'
import ProductDetailsModal from '../components/ProductDetailsModal'
import LoginModal from '../components/LoginModal'
import ShoppingListModal from '../components/ShoppingListModal'
import AdminShoppingListsModal from '../components/AdminShoppingListsModal'
import CheckoutHistoryModal from '../components/CheckoutHistoryModal'
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
  const [editingData, setEditingData] = useState<{ [key: string]: any }>({})
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null)
  const [allShoppingLists, setAllShoppingLists] = useState<ShoppingList[]>([])
  const [loginLoading, setLoginLoading] = useState(false)

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
      } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
        toast.success('Item removed from shopping list')
        fetchShoppingList()
      } else {
        toast.error('Failed to remove item')
      }
    } catch (error) {
      toast.error('Failed to remove item')
    }
  }

  const handleCheckoutShoppingListItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/shopping-list/items/${itemId}`, {
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
          setShoppingList(null)
        } else {
          toast.success('Item checked out!')
          fetchShoppingList()
        }
      } else {
        toast.error('Failed to check out item')
      }
    } catch (error) {
      toast.error('Failed to check out item')
    }
  }

  const handleCheckoutAllShoppingList = async () => {
    if (!shoppingList) return
    
    try {
      const response = await fetch(`/api/admin/shopping-lists/${shoppingList.id}/checkout-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        },
      })

      if (response.ok) {
        toast.success('All items checked out!')
        fetchShoppingList()
      } else {
        toast.error('Failed to check out all items')
      }
    } catch (error) {
      toast.error('Failed to check out all items')
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
        toast.success('Item removed!')
        fetchAllShoppingLists()
      } else {
        toast.error('Failed to remove item')
      }
    } catch (error) {
      toast.error('Failed to remove item')
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
    } catch (error) {
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
        const result = await response.json()
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
    } catch (error) {
      toast.error('Failed to update product status')
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
                  <p className="text-sephora-600 text-sm">
                    {user ? `${user.name} (${user.role})` : 'Your personal beauty collection'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Login button when not logged in */}
                {!user && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsLoginModalOpen(true)}
                    className="sephora-gradient text-white px-6 py-3 rounded-full font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Palette className="h-5 w-5" />
                    <span>Login</span>
                  </motion.button>
                )}

                {/* User-specific buttons */}
                {user?.role === 'admin' && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsAdminShoppingListsModalOpen(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Users className="h-5 w-5" />
                      <span>All Lists</span>
                    </motion.button>
                    
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
                      <span>Check out by SKU</span>
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
                  </>
                )}

                {user?.role === 'guest' && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsShoppingListModalOpen(true)}
                      className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-full font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span>Shopping List ({shoppingList?.items?.length || 0})</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsCheckoutHistoryModalOpen(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <History className="h-5 w-5" />
                      <span>Checkout History</span>
                    </motion.button>
                  </>
                )}

                {/* Logout button */}
                {user && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-full font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200"
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
        )}

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {!user ? (
            // Not logged in - show login prompt
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="sephora-gradient p-8 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Palette className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-xl font-elegant font-semibold text-gray-800 mb-2">
                Welcome to Olivia's Beauty Vault
              </h3>
              <p className="text-gray-600 mb-6">
                Please log in to view and manage products.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLoginModalOpen(true)}
                className="sephora-gradient text-white px-8 py-4 rounded-full font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 mx-auto"
              >
                <Palette className="h-5 w-5" />
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
                  className="mb-12"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <Package className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-elegant font-semibold text-gray-800">
                      Available Products ({onShelfProducts.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {onShelfProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onUseProduct={handleScanOut}
                        onViewDetails={handleViewDetails}
                        onStatusChange={handleStatusChange}
                        onAddToShoppingList={handleAddToShoppingList}
                        editedImageUrl={editingData[product.id]?.image_url}
                        isGuest={true}
                      />
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <div className="sephora-gradient p-8 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <Package className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-elegant font-semibold text-gray-800 mb-2">
                    No products available on shelf
                  </h3>
                  <p className="text-gray-600">
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
                  className="mb-12"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <ShoppingBag className="h-6 w-6 text-sephora-600" />
                    <h2 className="text-2xl font-elegant font-semibold text-gray-800">
                      In Your Vault ({inVaultProducts.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {inVaultProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onUseProduct={handleScanOut}
                        onViewDetails={handleViewDetails}
                        onStatusChange={handleStatusChange}
                        editedImageUrl={editingData[product.id]?.image_url}
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
                  className="mb-12"
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <Package className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-elegant font-semibold text-gray-800">
                      On Shelf ({onShelfProducts.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {onShelfProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onUseProduct={handleScanOut}
                        onViewDetails={handleViewDetails}
                        onStatusChange={handleStatusChange}
                        editedImageUrl={editingData[product.id]?.image_url}
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
                  <div className="flex items-center space-x-3 mb-6">
                    <Package className="h-6 w-6 text-gray-500" />
                    <h2 className="text-2xl font-elegant font-semibold text-gray-600">
                      Used Up ({usedUpProducts.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {usedUpProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onUseProduct={handleScanOut}
                        onViewDetails={handleViewDetails}
                        onStatusChange={handleStatusChange}
                        editedImageUrl={editingData[product.id]?.image_url}
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
      </div>
    </>
  )
} 