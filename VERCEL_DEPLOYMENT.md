# Vercel Deployment Guide

This guide will help you deploy the Olivia's Beauty Vault application to Vercel with proper security and configuration.

## Prerequisites 

1. A Vercel account
2. A PostgreSQL database (recommended: Supabase, Neon, or Railway)
3. Google Gemini API key (optional, for AI features)

## Step 1: Database Setup

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

## Step 2: Vercel Project Setup

1. **Connect your repository:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository containing this project

2. **Configure build settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

## Step 3: Environment Variables

Add the following environment variables in your Vercel project settings:

### Required Variables
```
POSTGRES_URL=your_postgres_connection_string
NODE_ENV=production
```

### Optional Variables
```
GEMINI_API_KEY=your_gemini_api_key
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=https://your-domain.vercel.app
POSTGRES_CA_CERT=your_ssl_certificate_if_needed
```

### How to generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Step 4: Database Schema

The application will automatically create the required tables on first run. However, you can also run the schema manually:

1. Connect to your database
2. Run the SQL commands from `schema.sql`

## Step 5: Deploy

1. **Automatic Deployment:**
   - Push changes to your main branch
   - Vercel will automatically deploy

2. **Manual Deployment:**
   ```bash
   vercel --prod
   ```

## Step 6: Post-Deployment

1. **Verify the deployment:**
   - Check that all pages load correctly
   - Test the product management features
   - Verify database connections

2. **Set up custom domain (optional):**
   - Go to your Vercel project settings
   - Add your custom domain
   - Update `NEXTAUTH_URL` if using authentication

## Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   - Verify `POSTGRES_URL` is correct
   - Check if your database allows external connections
   - Ensure SSL is properly configured

2. **Build Failures:**
   - Check that all dependencies are in `package.json`
   - Verify Node.js version compatibility (>=18.0.0)
   - Check build logs in Vercel dashboard

3. **Environment Variables:**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Redeploy after adding new variables

### Performance Optimization

1. **Database Connection Pooling:**
   - The app is configured with connection pooling
   - Monitor database connections in your provider dashboard

2. **Image Optimization:**
   - Images are automatically optimized by Next.js
   - Supported formats: WebP, AVIF

3. **Caching:**
   - Static assets are cached automatically
   - API responses can be cached based on your needs

## Security Considerations

1. **Environment Variables:**
   - Never commit sensitive data to version control
   - Use Vercel's environment variable encryption
   - Rotate secrets regularly

2. **Database Security:**
   - Use strong passwords
   - Enable SSL connections
   - Restrict database access to Vercel's IP ranges if possible

3. **API Security:**
   - The app includes security headers
   - CORS is properly configured
   - Input validation is implemented

## Monitoring

1. **Vercel Analytics:**
   - Enable Vercel Analytics for performance monitoring
   - Monitor function execution times

2. **Database Monitoring:**
   - Use your database provider's monitoring tools
   - Set up alerts for connection issues

3. **Error Tracking:**
   - Consider adding error tracking (Sentry, etc.)
   - Monitor application logs in Vercel dashboard

## Support

If you encounter issues:

1. Check the Vercel deployment logs
2. Review the application logs
3. Verify environment variable configuration
4. Test database connectivity
5. Check the [Vercel documentation](https://vercel.com/docs)

## Updates

To update your deployment:

1. Push changes to your repository
2. Vercel will automatically redeploy
3. Monitor the deployment for any issues
4. Test the updated application

---

For more information, see the main [README.md](README.md) and [SETUP.md](SETUP.md) files. 