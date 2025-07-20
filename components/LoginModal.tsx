import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, User, Eye, EyeOff, Sparkles, Crown } from 'lucide-react'
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
    } catch {
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
        <div className="modal-backdrop">
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
            className="modal-content"
          >
            {/* Header */}
            <div className="sephora-gradient p-8 text-white">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-2xl">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-display font-bold">
                    Olivia&apos;s Beauty Vault
                  </h2>
                  <p className="text-white/90 text-base font-medium">
                    {isGuestMode ? 'Guest Access' : 'Admin Access'}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Mode Toggle */}
                <div className="flex items-center justify-center space-x-4">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className={`px-6 py-3 rounded-2xl text-base font-semibold transition-all duration-300 ${
                      !isGuestMode
                        ? 'sephora-gradient text-white shadow-medium'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Admin
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={toggleMode}
                    className={`px-6 py-3 rounded-2xl text-base font-semibold transition-all duration-300 ${
                      isGuestMode
                        ? 'rose-gradient text-white shadow-medium'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Guest
                    </div>
                  </button>
                </div>

                {/* Guest Name Input */}
                {isGuestMode && (
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="input-field pl-12 pr-4 py-4 text-base"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* Password Input */}
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-3">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isGuestMode ? 'Enter guest password' : 'Enter admin password'}
                      className="input-field pl-12 pr-12 py-4 text-base"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                    className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4"
                  >
                    <p className="text-red-600 text-base font-medium">{error}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-4 text-lg font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Help Text */}
              <div className="mt-8 text-center">
                <p className="text-gray-600 text-base leading-relaxed">
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