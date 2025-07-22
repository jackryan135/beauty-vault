# Supabase Storage Setup Guide

This guide will help you set up Supabase storage for production image uploads while keeping local storage for development.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be created (this may take a few minutes)

### 2. Create Storage Bucket

1. In your Supabase dashboard, go to **Storage** in the left sidebar
2. Click **Create a new bucket**
3. Set the bucket name to: `product-images`
4. Make sure **Public bucket** is checked (so images can be accessed publicly)
5. Click **Create bucket**

### 3. Configure Storage Policies

1. In the Storage section, click on your `product-images` bucket
2. Go to the **Policies** tab
3. Click **New Policy**
4. Choose **Create a policy from template**
5. Select **Allow public access to any file**
6. Click **Review** and then **Save policy**

### 4. Get Your API Keys

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public** key (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role** key (this is your `SUPABASE_SERVICE_ROLE_KEY`)

### 5. Configure Environment Variables

#### For Local Development
Create a `.env.local` file in your project root:

```bash
# Supabase (for production image storage)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

#### For Vercel Production
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the same three variables as above
4. Make sure they're set for **Production**, **Preview**, and **Development** environments

## 🔧 How It Works

### Development Mode
- Images are stored locally in `public/uploads/`
- No Supabase configuration required
- Fast local development experience

### Production Mode (Vercel)
- Images are uploaded to Supabase storage
- Images are served via Supabase CDN
- Works with Vercel's read-only filesystem

### Automatic Detection
The system automatically detects the environment:
- `NODE_ENV === 'production'` → Uses Supabase storage
- `NODE_ENV !== 'production'` → Uses local storage

## 🧪 Testing

### Test Local Development
1. Start your development server: `npm run dev`
2. Upload an image through the AI search
3. Check that the image is saved to `public/uploads/`
4. Verify the image displays correctly

### Test Production (Vercel)
1. Deploy to Vercel with the environment variables set
2. Upload an image through the AI search
3. Check that the image is uploaded to Supabase storage
4. Verify the image displays correctly via Supabase CDN

## 🔍 Troubleshooting

### Images Not Uploading in Production
1. Check that all Supabase environment variables are set in Vercel
2. Verify the storage bucket exists and is public
3. Check the browser console for any error messages
4. Verify the storage policies allow uploads

### Images Not Displaying
1. Check that the storage bucket is public
2. Verify the storage policies allow public access
3. Check the image URL in the browser network tab

### Local Development Issues
1. Make sure `public/uploads/` directory exists
2. Check file permissions on the uploads directory
3. Verify the development server has write access

## 📝 Notes

- Local uploads are stored in `public/uploads/` and are gitignored
- Production uploads are stored in Supabase and served via CDN
- The system automatically handles the transition between environments
- No code changes needed when switching between local and production 