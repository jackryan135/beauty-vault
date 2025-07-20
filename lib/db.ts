import { Pool, PoolClient } from 'pg'

// Import Vercel initialization for production
if (process.env.NODE_ENV === 'production') {
  import('./vercel-init')
}

interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  price: number;
  image_url: string;
  quantity: number;
  is_active: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

/**
 * Database configuration and connection management
 */
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const useLocalDB = process.env.USE_LOCAL_DB === 'true'

let pool: Pool | null = null

/**
 * Initializes database connection based on environment
 */
function initializeDB() {
  if (pool) return pool

  if (isDevelopment && useLocalDB) {
    pool = new Pool({
      host: process.env.LOCAL_DB_HOST || 'localhost',
      port: parseInt(process.env.LOCAL_DB_PORT || '5433'),
      database: process.env.LOCAL_DB_NAME || 'olivias_beauty_vault',
      user: process.env.LOCAL_DB_USER || 'postgres',
      password: process.env.LOCAL_DB_PASSWORD || 'password',
      ssl: false,
      // Basic connection configuration
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
    
    // Add event handlers for debugging
    pool.on('connect', (client) => {
      console.log('New client connected to database')
    })
    
    pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err)
    })
    
    console.log('Initialized local database connection pool')
  } else if (process.env.POSTGRES_URL) {
    // Production database configuration
    const config: any = {
      connectionString: process.env.POSTGRES_URL,
    }
    
    // SSL configuration for production
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
    
    // Connection pooling configuration
    config.max = 20 // Maximum number of clients in the pool
    config.idleTimeoutMillis = 30000 // Close idle clients after 30 seconds
    config.connectionTimeoutMillis = 2000 // Return an error after 2 seconds if connection could not be established
    
    pool = new Pool(config)
  } else {
    console.log('No database configuration found, using mock database')
    return null
  }

  return pool
}

/**
 * Mock database for development when no real DB is configured
 */
const mockProducts: Product[] = []

/**
 * Database interface with query and transaction support
 */
export const db = {
  async query<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[] }> {
    const pool = initializeDB()
    
    if (!pool) {
      return mockQuery(sql, params)
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
        console.error(`Database query error (${3 - retries}/3):`, error)
        if (retries === 0) {
          throw error
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    throw new Error('Database query failed after all retries')
  },

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const pool = initializeDB()
    
    if (!pool) {
      throw new Error('Transactions not supported in mock database')
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

/**
 * Mock database implementation for development
 */
function mockQuery<T = any>(sql: string, params: any[] = []): { rows: T[] } {
  if (sql.includes('SELECT')) {
    if (sql.includes('WHERE sku =')) {
      const sku = params[0];
      const product = mockProducts.find(p => p.sku === sku);
      return { rows: product ? [product] : [] };
    }
    if (sql.includes('WHERE id =')) {
      const id = params[0];
      const product = mockProducts.find(p => p.id === id);
      return { rows: product ? [product] : [] };
    }
    return { rows: [...mockProducts] };
  }
  
  if (sql.includes('INSERT')) {
    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      sku: params[0],
      name: params[1],
      brand: params[2],
      price: params[3],
      image_url: params[4],
      quantity: params[5],
      is_active: params[6],
      metadata: params[7],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockProducts.unshift(newProduct);
    return { rows: [newProduct] };
  }
  
  if (sql.includes('UPDATE')) {
    if (sql.includes('WHERE sku =')) {
      const sku = params[3];
      const productIndex = mockProducts.findIndex(p => p.sku === sku);
      if (productIndex !== -1) {
        mockProducts[productIndex] = {
          ...mockProducts[productIndex],
          quantity: params[0],
          is_active: params[1],
          metadata: params[2],
          updated_at: new Date().toISOString(),
        };
        return { rows: [mockProducts[productIndex]] };
      }
    } else if (sql.includes('WHERE id =')) {
      const id = params[3];
      const productIndex = mockProducts.findIndex(p => p.id === id);
      if (productIndex !== -1) {
        mockProducts[productIndex] = {
          ...mockProducts[productIndex],
          quantity: params[0],
          is_active: params[1],
          metadata: params[2],
          updated_at: new Date().toISOString(),
        };
        return { rows: [mockProducts[productIndex]] };
      }
    }
  }
  
  return { rows: [] };
}

/**
 * Test database connection
 */
export async function testDatabaseConnection() {
  const pool = initializeDB()
  if (!pool) {
    console.log('Using mock database')
    return true
  }

  try {
    const client = await pool.connect()
    try {
      await client.query('SELECT 1 as test')
      return true
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

/**
 * Initializes database schema and indexes
 */
export async function initializeDatabase() {
  const pool = initializeDB()
  if (!pool) {
    console.log('Using mock database')
    return
  }

  try {
    const client = await pool.connect()
    try {
      // Use the comprehensive initialization from init-database.ts
      const { initializeDatabase: initAuthDB } = await import('./init-database')
      await initAuthDB()
      console.log('Database initialized successfully')
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
} 