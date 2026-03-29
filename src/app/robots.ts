import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/rider/', '/profile/', '/track/', '/checkout/'],
    },
    sitemap: `${process.env.NEXTAUTH_URL || 'https://manadelivery.vercel.app'}/sitemap.xml`,
  };
}
