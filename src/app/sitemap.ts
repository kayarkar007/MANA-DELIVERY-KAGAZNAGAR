import { MetadataRoute } from 'next';
import connectToDatabase from '@/lib/mongoose';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Shop from '@/models/Shop';

const BASE_URL = 'https://manadelivery.in';

// Programmatic SEO landing pages
const SEO_LANDING_PAGES = [
  { slug: 'grocery-delivery-kagaznagar', priority: 0.9 },
  { slug: 'food-delivery-kagaznagar', priority: 0.9 },
  { slug: 'medicine-delivery-kagaznagar', priority: 0.85 },
  { slug: 'delivery-sirpur-kagaznagar', priority: 0.9 },
  { slug: 'online-shopping-kagaznagar', priority: 0.85 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let categoryEntries: MetadataRoute.Sitemap = [];
  let productEntries: MetadataRoute.Sitemap = [];
  let shopEntries: MetadataRoute.Sitemap = [];

  try {
    await connectToDatabase();
    
    const [categories, products, shops] = await Promise.all([
      Category.find({}).select('slug updatedAt').lean(),
      Product.find({ isHidden: false }).select('slug updatedAt').lean(),
      Shop.find({ isActive: true }).select('slug updatedAt').lean(),
    ]);

    categoryEntries = categories.map((cat: any) => ({
      url: `${BASE_URL}/category/${cat.slug}`,
      lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    productEntries = products.map((prod: any) => ({
      url: `${BASE_URL}/product/${prod.slug || prod._id}`,
      lastModified: prod.updatedAt ? new Date(prod.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    shopEntries = shops.map((shop: any) => ({
      url: `${BASE_URL}/shop/${shop.slug}`,
      lastModified: shop.updatedAt ? new Date(shop.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));
  } catch {
    // silently skip if DB is unavailable during build
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  const seoLandingPages: MetadataRoute.Sitemap = SEO_LANDING_PAGES.map((page) => ({
    url: `${BASE_URL}/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: page.priority,
  }));

  return [...staticPages, ...seoLandingPages, ...categoryEntries, ...shopEntries, ...productEntries];
}
