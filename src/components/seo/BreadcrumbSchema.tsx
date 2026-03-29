interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

/**
 * BreadcrumbList JSON-LD schema.
 * Pass an array of { name, url } items — home is prepended automatically.
 *
 * Usage:
 *   <BreadcrumbSchema items={[
 *     { name: "Grocery Delivery", url: "/grocery-delivery-kagaznagar" }
 *   ]} />
 */
export default function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const BASE_URL = 'https://manadelivery.in';

  const allItems = [
    { name: 'Home', url: BASE_URL },
    ...items.map((item) => ({ ...item, url: `${BASE_URL}${item.url}` })),
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
}
