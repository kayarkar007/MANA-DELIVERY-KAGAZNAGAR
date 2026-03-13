# Localu - Hyperlocal Delivery App

Localu is a premium hyperlocal delivery platform built with Next.js, featuring grocery delivery, home services, and pharmacy integration.

## Features

- 🛍️ **Hyperlocal Shopping**: Browse local groceries, fruits, veggies, and more.
- 🛠️ **Home Services**: Book local services like repairs and deliveries.
- 🛒 **Smart Cart**: Persistent cart with real-time pricing and tax calculation.
- 📱 **Mobile Optimized**: Premium app-like experience with sticky navigation and responsive layouts.
- 🌓 **Dark Mode**: Sleek dark mode support using `next-themes`.
- 🛡️ **Admin Panel**: Comprehensive dashboard for managing products, categories, and orders.
- 💳 **Flexible Payments**: Support for Cash on Delivery and Manual UPI payments.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Database**: [MongoDB](https://www.mongodb.com) with Mongoose
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Auth**: [NextAuth.js](https://next-auth.js.org)
- **Notifications**: [Sonner](https://sonner.stevenly.me)

## Getting Started

### Prerequisites

Create a `.env.local` file with the following:
```env
MONGODB_URI=your_mongodb_uri
NEXTAUTH_SECRET=your_auth_secret
NEXTAUTH_URL=http://localhost:3000
```

### Installation

```bash
npm install
```

### Seeding the Database

To populate the app with initial categories and products, run:
```bash
npx tsx scripts/seed.ts
```

### Running for Development

```bash
npm run dev
```

## Production Seeding

> [!IMPORTANT]
> The `/api/seed` route has been removed for security. Use the CLI script `scripts/seed.ts` for database management.
