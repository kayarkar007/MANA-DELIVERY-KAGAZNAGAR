interface ProductSchemaProps {
  name: string;
  description?: string;
  image?: string;
  price: number;
  currency?: string;
  inStock: boolean;
  productUrl: string;
  sku?: string;
  ratingValue?: number;
  reviewCount?: number;
}

/**
 * Product JSON-LD schema component for rich search engine result snippets.
 */
export default function ProductSchema({
  name,
  description,
  image,
  price,
  currency = "INR",
  inStock,
  productUrl,
  sku,
  ratingValue,
  reviewCount,
}: ProductSchemaProps) {
  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || `${name} available for fast delivery in Kagaznagar via Mana Delivery.`,
    image: image ? [image] : ["https://manadelivery.in/og-image.webp"],
    sku: sku || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    brand: {
      "@type": "Brand",
      name: "Mana Delivery",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Mana Delivery Kagaznagar",
      },
    },
  };

  if (ratingValue && reviewCount) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toFixed(1),
      reviewCount: reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
}
