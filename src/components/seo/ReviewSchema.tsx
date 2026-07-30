interface ReviewItem {
  author: string;
  ratingValue: number;
  reviewBody: string;
  datePublished?: string;
}

interface ReviewSchemaProps {
  productName: string;
  reviews: ReviewItem[];
}

/**
 * Review / AggregateRating JSON-LD schema component.
 */
export default function ReviewSchema({ productName, reviews }: ReviewSchemaProps) {
  if (!reviews || reviews.length === 0) return null;

  const totalRating = reviews.reduce((sum, r) => sum + r.ratingValue, 0);
  const avgRating = (totalRating / reviews.length).toFixed(1);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: reviews.length,
      bestRating: "5",
      worstRating: "1",
    },
    review: reviews.map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: r.author || "Anonymous Customer",
      },
      datePublished: r.datePublished || new Date().toISOString().split("T")[0],
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.ratingValue,
        bestRating: "5",
        worstRating: "1",
      },
      reviewBody: r.reviewBody,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 0) }}
    />
  );
}
