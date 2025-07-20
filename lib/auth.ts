import { NextApiRequest, NextApiResponse } from 'next'
import { authQuery } from './auth-db'

export interface AuthenticatedUser {
  id: string
  name: string
  role: 'admin' | 'guest'
  session_token: string
  session_expires_at: string
  created_at: string
  updated_at: string
}

export async function validateSession(req: NextApiRequest): Promise<AuthenticatedUser | null> {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                      req.cookies?.session_token ||
                      req.body?.session_token

  if (!sessionToken) {
    return null
  }

  try {
    const result = await authQuery(
      'SELECT * FROM users WHERE session_token = $1 AND session_expires_at > NOW()',
      [sessionToken]
    )

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0]
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      session_token: user.session_token,
      session_expires_at: user.session_expires_at,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return null
  }
}

export function requireAuth(handler: (req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await validateSession(req)
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    return handler(req, res, user)
  }
}

export function requireAdmin(handler: (req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await validateSession(req)
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    return handler(req, res, user)
  }
} 