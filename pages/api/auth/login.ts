import { NextApiRequest, NextApiResponse } from 'next'
import { authQuery } from '../../../lib/auth-db'
import { LoginRequest, LoginResponse } from '../../../types/product'
import crypto from 'crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { password, name }: LoginRequest = req.body

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' })
    }

    // Check if it's admin login
    if (password === 'wally') {
      // Admin login
      const adminResult = await authQuery(
        'SELECT * FROM users WHERE password = $1 AND role = $2',
        [password, 'admin']
      )

      if (adminResult.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials' })
      }

      const admin = adminResult.rows[0]
      const sessionToken = crypto.randomBytes(32).toString('hex')
      const sessionExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours

      // Update admin session
      await authQuery(
        'UPDATE users SET session_token = $1, session_expires_at = $2 WHERE id = $3',
        [sessionToken, sessionExpiresAt, admin.id]
      )

      const response: LoginResponse = {
        success: true,
        user: {
          id: admin.id,
          name: admin.name,
          role: admin.role,
          session_token: sessionToken,
          session_expires_at: sessionExpiresAt.toISOString(),
          created_at: admin.created_at,
          updated_at: admin.updated_at
        },
        session_token: sessionToken,
        message: 'Admin login successful'
      }

      return res.status(200).json(response)
    }

    // Check if it's guest login
    if (password === 'winnie') {
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Name is required for guest access' })
      }

      // Check if guest user exists
      let guestResult = await authQuery(
        'SELECT * FROM users WHERE name = $1 AND role = $2',
        [name.trim(), 'guest']
      )

      let guest
      if (guestResult.rows.length === 0) {
        // Create new guest user
        const newGuestResult = await authQuery(
          'INSERT INTO users (name, password, role) VALUES ($1, $2, $3) RETURNING *',
          [name.trim(), password, 'guest']
        )
        guest = newGuestResult.rows[0]
      } else {
        guest = guestResult.rows[0]
      }

      const sessionToken = crypto.randomBytes(32).toString('hex')
      const sessionExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours

      // Update guest session
      await authQuery(
        'UPDATE users SET session_token = $1, session_expires_at = $2 WHERE id = $3',
        [sessionToken, sessionExpiresAt, guest.id]
      )

      const response: LoginResponse = {
        success: true,
        user: {
          id: guest.id,
          name: guest.name,
          role: guest.role,
          session_token: sessionToken,
          session_expires_at: sessionExpiresAt.toISOString(),
          created_at: guest.created_at,
          updated_at: guest.updated_at
        },
        session_token: sessionToken,
        message: 'Guest login successful'
      }

      return res.status(200).json(response)
    }

    return res.status(401).json({ success: false, message: 'Invalid password' })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
} 