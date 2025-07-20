# Vercel Deployment Guide for Olivia's Beauty Vault

This comprehensive guide covers deploying the authentication and shopping list system to Vercel with proper security and configuration.

## 🚀 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **PostgreSQL Database**: Set up a PostgreSQL database (recommended: [Neon](https://neon.tech) or [Supabase](https://supabase.com))
3. **Git Repository**: Your code should be in a Git repository
4. **Google Gemini API key** (optional, for AI features)

## 📋 Environment Variables

Set these environment variables in your Vercel project settings:

### Required Variables
```bash
# Database Connection
POSTGRES_URL=postgresql://username:password@host:port/database

# For SSL connections (recommended for production)
POSTGRES_CA_CERT=your_ssl_certificate_here

# Environment
NODE_ENV=production
```

### Optional Variables
```bash
# Local development override (set to false for production)
USE_LOCAL_DB=false

# AI Features (optional)
GEMINI_API_KEY=your_gemini_api_key
```

## 🗄️ Database Setup

### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy the connection string from Settings > Database
3. The connection string format: `postgresql://postgres:[password]@[host]:5432/postgres`

### Option B: Neon
1. Go to [neon.tech](https://neon.tech) and create a new project
2. Copy the connection string from the dashboard
3. Enable SSL connections

### Option C: Railway
1. Go to [railway.app](https://railway.app) and create a new project
2. Add a PostgreSQL database
3. Copy the connection string from the database settings

## 🔧 Database Schema Setup

### Option 1: Automatic Setup (Recommended)
The application will automatically initialize the database schema on first deployment. This includes:

- ✅ Products table with UUID IDs
- ✅ Users table for authentication
- ✅ Shopping lists table
- ✅ Shopping list items table
- ✅ All necessary indexes and triggers
- ✅ Default admin user (password: "wally")

### Option 2: Manual Setup
If you prefer to set up the database manually:

1. Connect to your PostgreSQL database
2. Run the SQL commands from `schema.sql`
3. The application will detect existing tables and skip initialization

## 🎯 Deployment Steps

### 1. Connect Repository to Vercel
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the repository containing this project

### 2. Configure Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. Configure Environment Variables
1. In your Vercel project dashboard, go to "Settings" → "Environment Variables"
2. Add all required environment variables listed above
3. Make sure to set them for "Production", "Preview", and "Development" environments

### 4. Deploy
1. Vercel will automatically detect this is a Next.js project
2. The build process will:
   - Install dependencies (`npm install`)
   - Build the application (`npm run build`)
   - Initialize the database schema automatically
   - Deploy to production

### 5. Verify Deployment
1. Visit your deployed URL (e.g., `https://your-project.vercel.app`)
2. You should see the login screen
3. Test both login options:
   - **Admin**: Password `wally`
   - **Guest**: Password `winnie` (requires name input)

## 🔐 Authentication System

### Admin Access
- **Name**: `Olivia`
- **Password**: `wally`
- **Features**: Full access to all vault features
- **Shopping Lists**: Can view and manage all guest shopping lists

### Guest Access
- **Password**: `winnie`
- **Features**: View products on shelf only
- **Shopping Lists**: Create and manage personal shopping list
- **Session**: 2-hour persistence

## 🛒 Shopping List Features

### For Guests
- Add products to personal shopping list
- Edit quantities and remove items
- Check out individual items or entire list
- List persists per guest user

### For Admins
- View all active shopping lists with guest names
- Check out items from any list
- Clear entire shopping lists
- Dismiss individual requests

## 🔧 Troubleshooting

### Database Connection Issues
1. Verify `POSTGRES_URL` is correct
2. Check database is accessible from Vercel's servers
3. Ensure SSL configuration is correct for production

### Authentication Not Working
1. Check database tables were created properly
2. Verify default admin user exists
3. Check session token generation

### Shopping Lists Not Working
1. Ensure `shopping_list_items` table was created
2. Check foreign key constraints are correct
3. Verify UUID data types match across tables

### Build Failures
1. Check that all dependencies are in `package.json`
2. Verify Node.js version compatibility (>=18.0.0)
3. Check build logs in Vercel dashboard

### Environment Variables
1. Ensure all required variables are set
2. Check for typos in variable names
3. Redeploy after adding new variables

### Manual Database Reset
If you need to reset the database:

1. Create a new API endpoint temporarily:
```typescript
// pages/api/reset-db.ts
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  
  try {
    await authQuery('DROP TABLE IF EXISTS shopping_list_items CASCADE')
    await authQuery('DROP TABLE IF EXISTS shopping_lists CASCADE')
    await authQuery('DROP TABLE IF EXISTS users CASCADE')
    await authQuery('DROP TABLE IF EXISTS products CASCADE')
    
    // Re-run initialization
    const { initializeDatabase } = await import('../../lib/init-database')
    await initializeDatabase()
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

2. Call the endpoint: `POST /api/reset-db`
3. Remove the endpoint after use

## 🚀 Performance Optimization

### Database Connection Pooling
- The app is configured with connection pooling
- Monitor database connections in your provider dashboard

### Image Optimization
- Images are automatically optimized by Next.js
- Supported formats: WebP, AVIF

### Caching
- Static assets are cached automatically
- API responses can be cached based on your needs

## 🔒 Security Considerations

### Environment Variables
- Never commit sensitive data to version control
- Use Vercel's environment variable encryption
- Rotate secrets regularly

### Database Security
- Use strong passwords
- Enable SSL connections
- Restrict database access to Vercel's IP ranges if possible

### API Security
- The app includes security headers
- CORS is properly configured
- Input validation is implemented

## 📊 Monitoring

### Vercel Analytics
- Enable Vercel Analytics for performance monitoring
- Monitor function execution times

### Database Monitoring
- Use your database provider's monitoring tools
- Set up alerts for connection issues

### Error Tracking
- Consider adding error tracking (Sentry, etc.)
- Monitor application logs in Vercel dashboard

## 🔄 Updates

To update your deployment:

1. Push changes to your repository
2. Vercel will automatically redeploy
3. Monitor the deployment for any issues
4. Test the updated application

## 📞 Support

If you encounter issues:

1. Check the Vercel deployment logs
2. Verify environment variables are set correctly
3. Test database connectivity
4. Review the application logs for specific error messages
5. Check the [Vercel documentation](https://vercel.com/docs)

## 🎉 Success!

Once deployed, your Olivia's Beauty Vault will have:

- ✅ Password-based authentication
- ✅ Role-based access control
- ✅ Guest shopping lists
- ✅ Admin oversight
- ✅ Session persistence
- ✅ Full product management
- ✅ Responsive design
- ✅ AI-powered product fetching
- ✅ Beautiful Sephora-inspired UI

The system is ready for production use!

---

For more information, see the main [README.md](README.md) and [SETUP.md](SETUP.md) files. 