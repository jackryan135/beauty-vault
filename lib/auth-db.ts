import { Pool } from 'pg'

let authPool: Pool | null = null

function getAuthPool(): Pool | null {
  if (authPool) return authPool

  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  const useLocalDB = process.env.USE_LOCAL_DB === 'true'

  if (isDevelopment && useLocalDB) {
    authPool = new Pool({
      host: process.env.LOCAL_DB_HOST || 'localhost',
      port: parseInt(process.env.LOCAL_DB_PORT || '5433'),
      database: process.env.LOCAL_DB_NAME || 'olivias_beauty_vault',
      user: process.env.LOCAL_DB_USER || 'postgres',
      password: process.env.LOCAL_DB_PASSWORD || 'password',
      ssl: false,
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  } else if (process.env.POSTGRES_URL) {
    const config: any = {
      connectionString: process.env.POSTGRES_URL,
    }
    
    if (isProduction) {
      config.ssl = {
        rejectUnauthorized: false,
        ca: process.env.POSTGRES_CA_CERT,
      }
    } else {
      config.ssl = {
        rejectUnauthorized: false
      }
    }
    
    config.max = 20
    config.idleTimeoutMillis = 30000
    config.connectionTimeoutMillis = 2000
    
    authPool = new Pool(config)
  }

  return authPool
}

export async function authQuery(sql: string, params: any[] = []): Promise<{ rows: any[] }> {
  const pool = getAuthPool()
  
  if (!pool) {
    console.log('No database available for auth queries')
    return { rows: [] }
  }

  let retries = 3
  while (retries > 0) {
    try {
      const client = await pool.connect()
      try {
        const result = await client.query(sql, params)
        return { rows: result.rows }
      } finally {
        client.release()
      }
    } catch (error) {
      retries--
      console.error(`Auth database query error (${3 - retries}/3):`, error)
      if (retries === 0) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  throw new Error('Auth database query failed after all retries')
} 