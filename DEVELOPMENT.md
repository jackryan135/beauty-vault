# Development Guide

## Overview

This guide covers the technical architecture, development practices, and implementation details for Olivia's Beauty Vault.

## 🏗️ Architecture

### Core Components

#### 1. Product Fetcher (`lib/product-fetcher.ts`)
- **Singleton Pattern**: Ensures single instance across application
- **Fallback Chain**: Cache → Barcode APIs → Real Sources → AI → Basic Info
- **Multiple Data Sources**: UPC Item DB, Open Food Facts, Barcode Lookup
- **Caching**: In-memory cache for performance

#### 2. AI Integration (`lib/ai.ts`)
- **Google Gemini AI**: For product information generation
- **Fallback System**: Pattern matching when AI unavailable
- **Rate Limit Handling**: Graceful degradation
- **Model Validation**: Ensures real product data only

#### 3. Text Cleaning (`lib/text-cleaner.ts`)
- **AI-Powered Cleaning**: Uses Gemini for text formatting
- **Basic Cleaning**: HTML removal, capitalization, length limits
- **Fallback Chain**: AI → Basic cleaning

#### 4. Image Sources (`lib/image-sources.ts`)
- **Multiple Sources**: Sephora, placeholder services
- **CORS Checking**: Server-side validation
- **Caching**: Results cached to avoid repeated checks
- **Beauty Detection**: Automatic identification of beauty products

#### 5. Database Layer (`lib/db.ts`)
- **Connection Pooling**: Efficient database connections
- **Mock Database**: Development fallback
- **Transaction Support**: ACID compliance
- **Auto-initialization**: Schema creation on startup

### Data Flow

```
User Input (SKU) 
    ↓
Product Fetcher
    ↓
Cache Check → Barcode APIs → Real Sources → AI → Basic Info
    ↓
Text Cleaning (AI + Basic)
    ↓
Image Source Selection
    ↓
Database Storage
```

## 🔧 Development Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Local Development
```bash
# Clone repository
git clone <repository-url>
cd product-catalog

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration
```env
# Development (Mock Database)
USE_LOCAL_DB=false
NODE_ENV=development

# Local PostgreSQL
USE_LOCAL_DB=true
LOCAL_DB_HOST=localhost
LOCAL_DB_PORT=5433
LOCAL_DB_NAME=olivias_beauty_vault
LOCAL_DB_USER=postgres
LOCAL_DB_PASSWORD=password

# AI Integration
GEMINI_API_KEY=your_gemini_api_key_here
```

## 📊 Database Schema

### Products Table
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
```sql
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_created_at ON products(created_at);
```

## 🔌 API Endpoints

### Products API

#### GET `/api/products`
- **Purpose**: Retrieve all products
- **Response**: Array of product objects
- **Query Params**: `search`, `category`, `brand`

#### POST `/api/products`
- **Purpose**: Add new product
- **Body**: `{ sku: string }`
- **Response**: Created product object

#### PUT `/api/products/[id]/update`
- **Purpose**: Update product quantity
- **Body**: `{ quantity: number }`
- **Response**: Updated product object

#### POST `/api/products/[id]/scan-out`
- **Purpose**: Decrease product quantity by 1
- **Response**: Updated product object

#### POST `/api/products/clear`
- **Purpose**: Clear all products (development only)
- **Response**: Success message

### Test Endpoints

#### GET `/api/test-image-sources`
- **Purpose**: Test image source accessibility
- **Query Params**: `productName`, `brand`, `url`
- **Response**: Test results for each image source

## 🎨 UI Components

### Core Components

#### ProductCard (`components/ProductCard.tsx`)
- **Purpose**: Display individual product
- **Features**: Image, details, quantity controls
- **Props**: Product data, action handlers

#### AddProductModal (`components/AddProductModal.tsx`)
- **Purpose**: Add new products to vault
- **Features**: SKU input, AI generation, validation
- **State**: Loading states, error handling

#### ProductDetailsModal (`components/ProductDetailsModal.tsx`)
- **Purpose**: Detailed product view
- **Features**: Full product information, edit capabilities
- **Props**: Product data, onClose handler

#### ScanOutModal (`components/ScanOutModal.tsx`)
- **Purpose**: Quick product scanning
- **Features**: SKU input, quantity management
- **State**: Search results, loading states

### Styling
- **Framework**: Tailwind CSS
- **Theme**: Sephora-inspired color palette
- **Animations**: Framer Motion
- **Responsive**: Mobile-first design

## 🤖 AI Integration Details

### Gemini AI Implementation

#### Product Information Generation
```typescript
// lib/ai.ts
export async function generateProductInfo(sku: string): Promise<AIProductInfo>
```

**Features:**
- Real product search using SKU
- JSON response parsing
- Price validation and normalization
- Image URL generation
- Fallback to pattern matching

#### Text Cleaning
```typescript
// lib/text-cleaner.ts
export async function cleanProductInfo(name: string, description: string, brand: string): Promise<CleanedText>
```

**Features:**
- HTML tag removal
- Capitalization fixes
- Length limits
- Brand name cleaning
- AI-powered formatting

### Fallback System

When AI is unavailable:
1. **Pattern Matching**: SKU-based brand and product detection
2. **Basic Cleaning**: Simple text processing
3. **Placeholder Images**: Reliable image services
4. **Mock Data**: Realistic product information

### Rate Limit Handling

- **Automatic Detection**: 429 error responses
- **Graceful Fallback**: Switch to basic functionality
- **Caching**: Reduce API calls
- **User Feedback**: Clear error messages

## 🖼️ Image Source Management

### Source Hierarchy
1. **Preferred URL**: User-provided image URL
2. **Sephora**: Beauty product images (when accessible)
3. **Placeholder Services**: Reliable fallback options

### CORS Checking
```typescript
// lib/image-sources.ts
export async function checkImageAccessibility(url: string): Promise<boolean>
```

**Implementation:**
- Server-side HEAD requests
- Content-type validation
- 5-second timeout
- Result caching

### Beauty Product Detection
```typescript
function isBeautyProduct(productName: string, brand: string): boolean
```

**Keywords:**
- Product: foundation, concealer, moisturizer, etc.
- Brands: Fenty, Glossier, Charlotte Tilbury, etc.

## 🔄 Product Fetching Pipeline

### Step-by-Step Process

1. **Cache Check**
   ```typescript
   if (this.cache.has(sku)) {
     return this.cache.get(sku)!
   }
   ```

2. **Barcode Detection**
   ```typescript
   if (this.isBarcode(sku)) {
     return await this.fetchFromBarcodeDatabase(sku)
   }
   ```

3. **API Sources**
   - UPC Item DB
   - Open Food Facts
   - Barcode Lookup

4. **AI Generation**
   ```typescript
   const aiResult = await generateProductInfo(sku)
   ```

5. **Text Cleaning**
   ```typescript
   const cleaned = await cleanProductInfo(name, description, brand)
   ```

6. **Image Selection**
   ```typescript
   const imageUrl = await getBestImageUrl(name, brand, preferredUrl)
   ```

7. **Database Storage**
   ```typescript
   await db.query('INSERT INTO products ...', [sku, name, brand, ...])
   ```

## 🧪 Testing

### API Testing
```bash
# Test product addition
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"sku": "123456789"}'

# Test image sources
curl "http://localhost:3000/api/test-image-sources?productName=Foundation&brand=Fenty%20Beauty"

# Clear database
curl -X POST http://localhost:3000/api/products/clear
```

### Component Testing
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user flow testing

### Performance Testing
- **Database Queries**: Connection pooling efficiency
- **Image Loading**: CORS check performance
- **AI Integration**: Rate limit handling

## 🚀 Performance Optimizations

### Caching Strategy
- **Product Cache**: In-memory cache for fetched products
- **CORS Cache**: Image accessibility results
- **Database Pooling**: Connection reuse

### Image Optimization
- **Lazy Loading**: Images load on demand
- **Fallback Chain**: Multiple image sources
- **CORS Validation**: Prevents broken images

### Database Optimization
- **Indexes**: Fast query performance
- **Connection Pooling**: Efficient resource usage
- **Mock Database**: Development speed

## 🔒 Security Considerations

### API Security
- **Input Validation**: SKU format validation
- **SQL Injection**: Parameterized queries
- **Rate Limiting**: AI API protection

### Data Protection
- **Environment Variables**: Secure configuration
- **Database Credentials**: Encrypted storage
- **API Keys**: Secure handling

### CORS Configuration
- **Image Sources**: Server-side validation
- **API Endpoints**: Proper CORS headers
- **Error Handling**: Graceful degradation

## 📈 Monitoring and Logging

### Application Logs
```typescript
console.log(`Cache hit for SKU: ${sku}`)
console.log(`Found product via barcode lookup: ${result.value.name}`)
console.error('Database query error:', error)
```

### Performance Metrics
- **Cache Hit Rate**: Product cache efficiency
- **API Response Times**: External service performance
- **Database Query Times**: Database performance

### Error Tracking
- **AI Errors**: Rate limits, model issues
- **Database Errors**: Connection, query issues
- **Image Errors**: CORS, loading issues

## 🔄 Deployment Pipeline

### Development
1. **Local Development**: Mock database
2. **Testing**: Local PostgreSQL
3. **Code Review**: Pull request process

### Staging
1. **Environment Setup**: Staging database
2. **Integration Testing**: Full system testing
3. **Performance Testing**: Load testing

### Production
1. **Vercel Deployment**: Automatic deployment
2. **Database Migration**: Schema updates
3. **Monitoring**: Performance and error tracking

## 🛠️ Development Tools

### Code Quality
- **TypeScript**: Type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Development Tools
- **Hot Reload**: Next.js development server
- **Debug Logging**: Console output
- **Database Tools**: pgAdmin, DBeaver

### Testing Tools
- **Jest**: Unit testing
- **Cypress**: E2E testing
- **Postman**: API testing

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Google Gemini API Documentation](https://ai.google.dev/docs)

### External APIs
- [UPC Item DB](https://upcitemdb.com/api)
- [Open Food Facts](https://world.openfoodfacts.org/data)
- [Barcode Lookup](https://www.barcodelookup.com/api)

### Design Resources
- [Sephora Design System](https://www.sephora.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev) 