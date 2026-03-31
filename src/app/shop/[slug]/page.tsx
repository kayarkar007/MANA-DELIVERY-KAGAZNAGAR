import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import connectToDatabase from "@/lib/mongoose";
import Shop from "@/models/Shop";
import ProductListing from "@/components/ProductListing";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";

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
    const shop = await Shop.findOne({ slug }).select("name description image").lean();

    if (!shop) {
      return {
        title: "Shop Not Found",
        description: "This shop does not exist on Mana Delivery.",
      };
    }

    const title = `${shop.name} – Order Online via Mana Delivery`;
    const description = shop.description 
        ? `${shop.description} Order from ${shop.name} online in Sirpur Kagaznagar with Mana Delivery.` 
        : `Order from ${shop.name} online in Kagaznagar with same-day home delivery by Mana Delivery.`;

    return {
      title,
      description,
      alternates: { canonical: `${BASE_URL}/shop/${slug}` },
      openGraph: {
        title,
        description,
        url: `${BASE_URL}/shop/${slug}`,
        images: shop.image ? [{ url: shop.image as string }] : [],
        type: "website",
      },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return {
      title: "View Shop | Mana Delivery Kagaznagar",
      description: "Browse local vendors and shops on Mana Delivery.",
    };
  }
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  await connectToDatabase();
  const shop = await Shop.findOne({ slug }).lean();

  if (!shop || !shop.isActive) {
    notFound();
  }

  const shopName = shop.name as string;
  const shopDesc = (shop.description as string) || `Local vendor in Sirpur Kagaznagar partnering with Mana Delivery.`;
  const locationUrl = shop.locationUrl as string;

  return (
    <div className="space-y-8 sm:space-y-10">
      <BreadcrumbSchema items={[{ name: shopName, url: `/shop/${slug}` }]} />

      <Link href="/" className="app-button app-button-secondary w-fit rounded-[1.2rem]">
        <ChevronLeft className="h-4 w-4" />
        Back to local stores
      </Link>

      <section className="app-card-strong relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(217,71,47,0.18),transparent_65%)] blur-3xl" />
        {shop.image && (
          <div className="absolute inset-0 z-0 opacity-10">
            <img src={shop.image as string} alt={shopName} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-950/80" />
          </div>
        )}
        <div className="relative z-10 space-y-5">
          <span className="app-badge !bg-amber-500/10 !text-amber-600 dark:!text-amber-300">
            Certified Vendor
          </span>
          <div className="space-y-3">
            <h1 className="app-title text-4xl text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              {shopName}
            </h1>
            <p className="app-subtitle max-w-2xl">{shopDesc}</p>
            {locationUrl && (
                <a href={locationUrl} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 dark:text-red-400 hover:underline">
                    <MapPin className="w-4 h-4" /> View Store Location
                </a>
            )}
          </div>
        </div>
      </section>

      <section>
        <ProductListing shopId={String(shop._id)} />
      </section>
    </div>
  );
}
