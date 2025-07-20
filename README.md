# Olivia's Beauty Vault 💄✨

A beautiful, Sephora-inspired product catalog for managing your personal beauty collection. Built with Next.js, TypeScript, and Tailwind CSS.

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

- ✅ **Add products to vault** by SKU with AI-generated product info
- ✅ **Scan products in** (increase quantity for duplicates)
- ✅ **Scan products out** (decrease quantity by 1)
- ✅ **Search and filter** products
- ✅ **Beautiful Sephora-inspired UI** with animations
- ✅ **Real-time notifications** for all actions
- ✅ **Responsive design** for all devices
- ✅ **Multiple image sources** with CORS checking
- ✅ **Intelligent product fetching** from multiple APIs

## 🛠️ Tech Stack

- **Framework**: Next.js 11 with TypeScript
- **Styling**: Tailwind CSS with Sephora-inspired palette
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast
- **Database**: PostgreSQL with connection pooling
- **AI**: Google Gemini integration
- **Image Sources**: Sephora, placeholder services with CORS checking
- **Deployment**: Vercel-ready

## 🎨 Design

Inspired by Sephora's elegant design language:
- **Primary Colors**: Rose pink (#ec4899), Light pink (#fce7f3)
- **Accent Colors**: Gold (#fbbf24), White (#ffffff)
- **Typography**: Clean, modern fonts
- **Animations**: Smooth transitions and micro-interactions
- **Icons**: Beauty-focused (palette, heart, sparkles)

## 📱 Usage

### Adding Products
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

### Local Production Build
```bash
npm run build
npm start
```

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup and configuration instructions
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development guide, architecture, and technical details

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