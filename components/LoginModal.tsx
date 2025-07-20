import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, User, Eye, EyeOff } from 'lucide-react'
import { LoginRequest } from '../types/product'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (loginData: LoginRequest) => Promise<void>
  loading: boolean
}

export default function LoginModal({ isOpen, onClose, onLogin, loading }: LoginModalProps) {
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isGuestMode && !name.trim()) {
      setError('Please enter your name')
      return
    }

    if (!password.trim()) {
      setError('Please enter a password')
      return
    }

    try {
      await onLogin({
        password: password.trim(),
        name: isGuestMode ? name.trim() : undefined
      })
    } catch (error) {
      setError('Login failed. Please try again.')
    }
  }

  const handleClose = () => {
    setPassword('')
    setName('')
    setError('')
    setIsGuestMode(false)
    setShowPassword(false)
    onClose()
  }

  const toggleMode = () => {
    setIsGuestMode(!isGuestMode)
    setError('')
    setName('')
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
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-sephora-500 to-rose-500 p-6 text-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-full">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-elegant font-bold">
                    Olivia's Beauty Vault
                  </h2>
                  <p className="text-sephora-100 text-sm">
                    {isGuestMode ? 'Guest Access' : 'Admin Access'}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Mode Toggle */}
                <div className="flex items-center justify-center space-x-4">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      !isGuestMode
                        ? 'bg-sephora-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={toggleMode}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isGuestMode
                        ? 'bg-rose-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Guest
                  </button>
                </div>

                {/* Guest Name Input */}
                {isGuestMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sephora-500 focus:border-transparent transition-all duration-200"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isGuestMode ? 'Enter guest password' : 'Enter admin password'}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sephora-500 focus:border-transparent transition-all duration-200"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-3"
                  >
                    <p className="text-red-600 text-sm">{error}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-sephora-500 to-rose-500 text-white py-3 rounded-lg font-medium hover:from-sephora-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Help Text */}
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  {isGuestMode 
                    ? 'Guest access allows you to view products on the shelf and create shopping lists.'
                    : 'Admin access provides full control over the beauty vault.'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 