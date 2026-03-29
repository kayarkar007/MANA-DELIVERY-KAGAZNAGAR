/**
 * LocalBusiness JSON-LD structured data for Mana Delivery.
 * Renders an invisible <script> tag that Google uses for Local Pack ranking.
 */
export default function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://manadelivery.in/#localbusiness',
    name: 'Mana Delivery',
    alternateName: ['Mana Delivery Kagaznagar', 'Localu Delivery'],
    description:
      'Mana Delivery is Kagaznagar\'s fastest hyperlocal delivery service. Order groceries, food, medicines, and daily essentials online with same-day delivery in Sirpur Kagaznagar.',
    url: 'https://manadelivery.in',
    logo: 'https://manadelivery.in/logo2.png',
    image: 'https://manadelivery.in/logo2.png',
    telephone: '+91-9494378247',
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI, Wallet',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '3-1-313 Subhash Chandrabose Colony',
      addressLocality: 'Sirpur Kagaznagar',
      addressRegion: 'Telangana',
      postalCode: '504296',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 19.1667,
      longitude: 79.4667,
    },
    areaServed: [
      { '@type': 'City', name: 'Sirpur Kagaznagar' },
      { '@type': 'City', name: 'Kagaznagar' },
      { '@type': 'City', name: 'Asifabad' },
      { '@type': 'State', name: 'Telangana' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday', 'Tuesday', 'Wednesday',
          'Thursday', 'Friday', 'Saturday', 'Sunday',
        ],
        opens: '08:00',
        closes: '22:00',
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Delivery Services',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Grocery Delivery' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Food Delivery' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Medicine Delivery' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Daily Essentials Delivery' } },
      ],
    },
    sameAs: [
      'https://manadelivery.vercel.app',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
}
