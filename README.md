# Olivia's Beauty Vault 💄✨

A beautiful, Sephora-inspired product catalog for managing your personal beauty collection. This application functions as a library of owned products, not a store, and therefore does not track prices. Built with Next.js, TypeScript, and Tailwind CSS.

[![Next.js](https://img.shields.io/badge/Next.js-11.1.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.5.4-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-2.2.19-38B2AC)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/jackryan135/beauty-vault.git
cd product-catalog

# Install dependencies
npm install

# Copy environment variables
cp env.example .env.local
cp env.local.example .env.local

# Start the development server
npm run dev
```

The application will automatically use the mock database for development.

## 🎯 Features

- ✅ **Password-based authentication** with admin and guest roles
- ✅ **Add products to vault** by SKU with AI-generated product info
- ✅ **Scan products in** (increase quantity for duplicates)
- ✅ **Scan products out** (decrease quantity by 1)
- ✅ **Search and filter** products
- ✅ **Guest shopping lists** with personal management
- ✅ **Admin shopping list oversight** and management
- ✅ **Beautiful Sephora-inspired UI** with animations
- ✅ **Real-time notifications** for all actions
- ✅ **Responsive design** for all devices
- ✅ **Multiple image sources** with CORS checking
- ✅ **Intelligent product fetching** from multiple APIs
- ✅ **Session persistence** (2-hour login sessions)
- ✅ **Hybrid image storage** (local for dev, Supabase for production)

## 🛠️ Tech Stack

- **Framework**: Next.js 11 with TypeScript
- **Styling**: Tailwind CSS with Sephora-inspired palette
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast
- **Database**: PostgreSQL with connection pooling
- **AI**: Google Gemini integration
- **Image Sources**: Sephora, placeholder services with CORS checking
- **Storage**: Hybrid system (local files for dev, Supabase storage for production)
- **Deployment**: Vercel-ready

## 🎨 Design

Inspired by Sephora's elegant design language:
- **Primary Colors**: Rose pink (#ec4899), Light pink (#fce7f3)
- **Accent Colors**: Gold (#fbbf24), White (#ffffff)
- **Typography**: Clean, modern fonts
- **Animations**: Smooth transitions and micro-interactions
- **Icons**: Beauty-focused (palette, heart, sparkles)

## 🔐 Authentication

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

## 📱 Usage

### Adding Products (Admin Only)
1. Click "Add to Vault" button
2. Enter product SKU
3. AI generates product information
4. Product added to your collection

### Using Products
1. Click "Use Product" on any item
2. Quantity decreases by 1
3. Product remains active until quantity reaches 0

### Scanning Out by SKU
1. Click "Scan Out by SKU" button
2. Enter product SKU
3. Product quantity decreases by 1

### Shopping Lists (Guests)
1. Add products to personal shopping list
2. Edit quantities and remove items
3. Check out individual items or entire list

### Shopping List Management (Admins)
1. View all active shopping lists with guest names
2. Check out items from any list
3. Clear entire shopping lists
4. Dismiss individual requests

## 🚀 Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Add Vercel Postgres from the dashboard
3. Set environment variables:
   ```env
   POSTGRES_URL=your_vercel_postgres_connection_string
   NODE_ENV=production
   ```
4. Deploy!

### Image Storage Setup
For production image uploads, you'll need to set up Supabase storage:
1. Follow the **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** guide
2. Add Supabase environment variables to Vercel
3. Images will automatically use Supabase storage in production

### Local Production Build
```bash
npm run build
npm start
```

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup and configuration instructions
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Comprehensive Vercel deployment guide with authentication system
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Supabase storage setup for production image uploads
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide, architecture, and technical details
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute to the project
- **[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)** - Community guidelines
- **[SECURITY.md](./SECURITY.md)** - Security policy and reporting
- **[CHANGELOG.md](./CHANGELOG.md)** - Project changelog and version history

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Sephora's elegant design language
- Built with Next.js, TypeScript, and Tailwind CSS
- AI integration powered by Google Gemini
- Created by Jack Ryan for Olivia's Beauty Vault

## 🎉 Success!

Olivia's Beauty Vault is now ready to help you manage your beauty collection with style! 

Enjoy managing your beauty collection! 💄✨ 