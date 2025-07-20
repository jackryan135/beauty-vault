import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  // Production error monitoring
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Global error handler for production
      const handleError = (error: ErrorEvent) => {
        console.error('Production error:', error)
        // You can add error reporting service here (Sentry, etc.)
      }
      
      window.addEventListener('error', handleError)
      return () => window.removeEventListener('error', handleError)
    }
  }, [])

  return (
    <>
      <Component {...pageProps} />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            border: '1px solid #ec4899',
          },
        }}
      />
    </>
  )
} 