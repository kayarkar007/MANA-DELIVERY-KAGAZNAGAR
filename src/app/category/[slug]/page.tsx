import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import connectToDatabase from "@/lib/mongoose";
import Category from "@/models/Category";
import ProductListing from "@/components/ProductListing";
import ServiceForm from "@/components/ServiceForm";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";

export const dynamic = "force-dynamic";

const BASE_URL = "https://manadelivery.in";

// Generate per-category metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    await connectToDatabase();
    const category = await Category.findOne({ slug }).select("name type").lean();

    if (!category) {
      return {
        title: "Category Not Found",
        description: "This category does not exist on Mana Delivery.",
      };
    }

    const name = category.name as string;
    const type = category.type as string;
    const isService = type === "service";

    const title = isService
      ? `${name} Service in Kagaznagar – Book Online | Mana Delivery`
      : `Buy ${name} Online in Kagaznagar – Fast Delivery | Mana Delivery`;

    const description = isService
      ? `Book ${name} services online in Sirpur Kagaznagar. Fast response, local partners, and real-time tracking via Mana Delivery. Call +91 9494378247.`
      : `Order ${name} online in Kagaznagar with same-day home delivery. Best prices, local stock, and fast fulfilment by Mana Delivery.`;

    return {
      title,
      description,
      alternates: {
        canonical: `${BASE_URL}/category/${slug}`,
      },
      openGraph: {
        title,
        description,
        url: `${BASE_URL}/category/${slug}`,
        type: "website",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Shop by Category | Mana Delivery Kagaznagar",
      description: "Browse all product and service categories on Mana Delivery.",
    };
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  await connectToDatabase();
  const category = await Category.findOne({ slug }).lean();

  if (!category) {
    notFound();
  }

  const categoryName = category.name as string;
  const categoryType = category.type as string;

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Breadcrumb JSON-LD */}
      <BreadcrumbSchema
        items={[{ name: categoryName, url: `/category/${slug}` }]}
      />

      <Link href="/" className="app-button app-button-secondary w-fit rounded-[1.2rem]">
        <ChevronLeft className="h-4 w-4" />
        Back to store
      </Link>

      <section className="app-card-strong relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(217,71,47,0.18),transparent_65%)] blur-3xl" />
        <div className="relative z-10 space-y-5">
          <span
            className={`app-badge ${categoryType === "service" ? "!bg-sky-500/10 !text-sky-600 dark:!text-sky-300" : ""}`}
          >
            {categoryType === "service" ? "Service flow" : "Product collection"}
          </span>
          <div className="space-y-3">
            <h1 className="app-title text-4xl text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              {categoryName}
            </h1>
            <p className="app-subtitle max-w-2xl">
              {categoryType === "product"
                ? `Order ${categoryName} online in Kagaznagar. Fast home delivery, best prices, local stock — fulfilled by Mana Delivery.`
                : `Book ${categoryName} services in Sirpur Kagaznagar. Submit a request, get a quick response from local partners.`}
            </p>
          </div>
        </div>
      </section>

      <section>
        {categoryType === "product" ? (
          <ProductListing categorySlug={slug} />
        ) : (
          <div className="app-card rounded-[2.5rem] p-6 sm:p-10">
            <ServiceForm categoryName={categoryName} />
          </div>
        )}
      </section>
    </div>
  );
}
