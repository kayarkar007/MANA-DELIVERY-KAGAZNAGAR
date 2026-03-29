/**
 * WebSite JSON-LD with Sitelinks Searchbox.
 * Enables Google to show a search box directly in search results.
 */
export default function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://manadelivery.in/#website',
    name: 'Mana Delivery',
    url: 'https://manadelivery.in',
    description:
      'Kagaznagar ki apni hyperlocal delivery service. Order groceries, food, and essentials online.',
    inLanguage: ['en-IN', 'te', 'hi'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://manadelivery.in/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@id': 'https://manadelivery.in/#localbusiness',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
}
