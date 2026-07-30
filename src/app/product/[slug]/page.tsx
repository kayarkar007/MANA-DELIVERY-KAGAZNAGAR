import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ShoppingBag, Star, Store } from "lucide-react";
import { notFound } from "next/navigation";
import connectToDatabase from "@/lib/mongoose";
import Product from "@/models/Product";
import Shop from "@/models/Shop";
import ProductSchema from "@/components/seo/ProductSchema";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";
import ProductDetailActions from "@/components/ProductDetailActions";
import ProductListing from "@/components/ProductListing";

export const dynamic = "force-dynamic";

const BASE_URL = "https://manadelivery.in";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    await connectToDatabase();
    
    // Find product by slug, or by _id as fallback
    let product = await Product.findOne({ slug }).lean();
    if (!product && slug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(slug).lean();
    }

    if (!product) {
      return {
        title: "Product Not Found | Mana Delivery",
        description: "This item is not available on Mana Delivery Kagaznagar.",
      };
    }

    const title = `${product.name} – Order Online Kagaznagar | Mana Delivery`;
    const description = product.description
      ? `${product.description} Order ${product.name} online in Sirpur Kagaznagar with fast home delivery.`
      : `Order ${product.name} online in Kagaznagar at ₹${product.price}. Same-day delivery across Sirpur Kagaznagar with Mana Delivery.`;

    const productUrl = `${BASE_URL}/product/${product.slug || product._id}`;
    const imageUrl = product.image || `${BASE_URL}/og-image.webp`;

    return {
      title,
      description,
      alternates: { canonical: productUrl },
      openGraph: {
        title,
        description,
        url: productUrl,
        images: [{ url: imageUrl }],
        type: "website",
      },
      twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
    };
  } catch {
    return {
      title: "Product Details | Mana Delivery Kagaznagar",
      description: "Order groceries & products online in Sirpur Kagaznagar.",
    };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  await connectToDatabase();

  let product = await Product.findOne({ slug }).lean() as any;
  if (!product && slug.match(/^[0-9a-fA-F]{24}$/)) {
    product = await Product.findById(slug).lean() as any;
  }

  if (!product || product.isHidden) {
    notFound();
  }

  let shopName = "Mana Delivery Store";
  if (product.shopId) {
    const shop = await Shop.findById(product.shopId).select("name").lean();
    if (shop) shopName = shop.name as string;
  }

  const productSlugStr = product.slug || String(product._id);
  const productUrl = `${BASE_URL}/product/${productSlugStr}`;

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* JSON-LD Structured Data */}
      <ProductSchema
        name={product.name}
        description={product.description}
        image={product.image}
        price={product.price}
        inStock={product.inStock}
        productUrl={productUrl}
        sku={productSlugStr}
      />
      <BreadcrumbSchema
        items={[
          { name: "Products", url: "/search" },
          { name: product.name, url: `/product/${productSlugStr}` },
        ]}
      />

      {/* Back button */}
      <Link href="/search" className="app-button app-button-secondary w-fit rounded-[1.2rem]">
        <ChevronLeft className="h-4 w-4" />
        Back to browse
      </Link>

      {/* Main Product Card */}
      <div className="app-card overflow-hidden rounded-[2.5rem] p-6 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Image Column */}
          <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ShoppingBag className="h-20 w-20 text-slate-300 dark:text-slate-700" />
              </div>
            )}
          </div>

          {/* Details & Actions Column */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="app-badge">
                  {product.categorySlug}
                </span>
                {shopName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                    <Store className="h-3.5 w-3.5 text-red-500" />
                    {shopName}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl lg:text-5xl tracking-tight">
                {product.name}
              </h1>

              {product.description && (
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
                  {product.description}
                </p>
              )}
            </div>

            {/* Client Interactive Actions (Add to Cart, Wishlist, Price) */}
            <ProductDetailActions
              product={{
                _id: String(product._id),
                name: product.name,
                price: product.price,
                unit: product.unit,
                image: product.image,
                inStock: product.inStock,
                stockQuantity: product.stockQuantity,
                shop: product.shopId ? { shopId: String(product.shopId), name: shopName } : undefined,
              }}
            />
          </div>
        </div>
      </div>

      {/* Related Category Products */}
      <section className="space-y-6 pt-6">
        <div>
          <span className="app-kicker">Explore more</span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl mt-1">
            Similar Items in {product.categorySlug}
          </h2>
        </div>
        <ProductListing categorySlug={product.categorySlug} />
      </section>
    </div>
  );
}
