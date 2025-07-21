import type { NextApiRequest, NextApiResponse } from 'next'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_CA_CERT
    ? { ca: process.env.POSTGRES_CA_CERT }
    : undefined,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const result = await pool.query('SELECT NOW()')
    res.status(200).json({ success: true, time: result.rows[0].now })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
} 