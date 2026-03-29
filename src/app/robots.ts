import { MetadataRoute } from 'next';

const BASE_URL = 'https://manadelivery.in';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/search',
          '/category/',
          '/grocery-delivery-kagaznagar',
          '/food-delivery-kagaznagar',
          '/medicine-delivery-kagaznagar',
          '/delivery-sirpur-kagaznagar',
          '/online-shopping-kagaznagar',
          '/login',
          '/signup',
        ],
        disallow: [
          '/admin/',
          '/rider/',
          '/profile/',
          '/track/',
          '/checkout/',
          '/api/',
          '/_next/',
          '/~offline',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
