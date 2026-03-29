import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag, Clock, CreditCard, ChevronRight, Phone, Star } from "lucide-react";
import LocalBusinessSchema from "@/components/seo/LocalBusinessSchema";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";

export const metadata: Metadata = {
  title: "Online Shopping in Kagaznagar – Home Delivery | Mana Delivery",
  description:
    "Shop online in Kagaznagar with home delivery. Order groceries, essentials, medicines, and more online. Best prices, fast delivery in Sirpur Kagaznagar. Call +91 9494378247.",
  keywords: [
    "online shopping kagaznagar",
    "online order kagaznagar",
    "buy online kagaznagar",
    "shop online kagaznagar telangana",
    "online store kagaznagar",
    "home delivery kagaznagar",
    "ecommerce kagaznagar",
    "online grocery shopping kagaznagar",
    "online order sirpur kagaznagar",
  ],
  alternates: {
    canonical: "https://manadelivery.in/online-shopping-kagaznagar",
  },
  openGraph: {
    title: "Online Shopping in Kagaznagar – Home Delivery | Mana Delivery",
    description: "Shop online in Kagaznagar. Order groceries, medicines & essentials with fast home delivery.",
    url: "https://manadelivery.in/online-shopping-kagaznagar",
    type: "website",
  },
};

const faqs = [
  {
    question: "Is online shopping available in Kagaznagar?",
    answer:
      "Yes! Mana Delivery makes online shopping easy in Kagaznagar. Browse products and services, add to cart, and get home delivery right to your door.",
  },
  {
    question: "What can I buy online in Kagaznagar?",
    answer:
      "You can buy groceries, food, medicines, household essentials, and avail local services online through Mana Delivery in Kagaznagar.",
  },
  {
    question: "What payment methods are available for online orders in Kagaznagar?",
    answer:
      "Mana Delivery accepts UPI, wallet payments, and cash on delivery — whatever is most convenient for you.",
  },
  {
    question: "How do I track my online order in Kagaznagar?",
    answer:
      "After placing your order on manadelivery.in, you can track your delivery in real-time through the app or website.",
  },
];

export default function OnlineShoppingKagaznagarPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <LocalBusinessSchema />
      <BreadcrumbSchema items={[{ name: "Online Shopping Kagaznagar", url: "/online-shopping-kagaznagar" }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="space-y-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[rgba(160,100,214,0.16)] bg-[linear-gradient(135deg,#160a3a,#2d1469_45%,#4a1a8a_82%,#d6a046_122%)] px-6 py-12 text-white shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:px-10 sm:py-16 md:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(160,100,214,0.2),transparent_40%)]" />
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
              <ShoppingBag className="h-3.5 w-3.5" />
              Online Shopping · Kagaznagar
            </span>
            <h1 className="font-display text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Online Shopping in Kagaznagar –{" "}
              <span className="text-[#d6a046]">Delivered to Your Door</span>
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/80">
              Shop online in Kagaznagar without stepping out. Groceries, essentials, medicines, and services — all on Mana Delivery with real-time tracking and fast home delivery.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/" className="inline-flex items-center gap-2 rounded-2xl bg-[#d6a046] px-6 py-3 text-sm font-black text-slate-900 transition hover:bg-[#c49040]">
                Shop Now <ChevronRight className="h-4 w-4" />
              </Link>
              <a href="tel:+919494378247" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/20">
                <Phone className="h-4 w-4" /> 9494378247
              </a>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="space-y-8">
          <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
            How Online Shopping Works in Kagaznagar
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { step: "01", icon: ShoppingBag, title: "Browse & Add to Cart", desc: "Search for products or browse categories on manadelivery.in" },
              { step: "02", icon: CreditCard, title: "Pay Your Way", desc: "Pay via UPI, wallet, or cash on delivery — whatever suits you best." },
              { step: "03", icon: Clock, title: "Get it Delivered", desc: "Track your delivery in real-time as your rider heads to your door." },
            ].map((step) => (
              <div key={step.step} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="font-display text-5xl font-black text-slate-100 dark:text-slate-800">{step.step}</p>
                <div className="mt-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-900/20">
                  <step.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="mt-4 font-black text-slate-900 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="rounded-[2.5rem] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 sm:p-10">
          <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white">
            What to Buy Online in Kagaznagar
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Grocery Delivery", href: "/grocery-delivery-kagaznagar" },
              { name: "Food Delivery", href: "/food-delivery-kagaznagar" },
              { name: "Medicine Delivery", href: "/medicine-delivery-kagaznagar" },
              { name: "Daily Essentials", href: "/" },
              { name: "Household Items", href: "/" },
              { name: "Local Services", href: "/" },
            ].map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-black text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                <Star className="h-4 w-4 flex-shrink-0 text-[#d6a046]" />
                {cat.name} in Kagaznagar
                <ChevronRight className="ml-auto h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
            FAQs – Online Shopping in Kagaznagar
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="font-black text-slate-900 dark:text-white">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-[2.5rem] bg-[linear-gradient(135deg,#120507,#26090d_45%,#6d1016)] px-8 py-12 text-center text-white sm:px-12">
          <h2 className="font-display text-3xl font-black sm:text-4xl">Shop Online in Kagaznagar — Start Now</h2>
          <p className="mx-auto mt-4 max-w-md text-white/70">Create a free account and enjoy fast home delivery across Sirpur Kagaznagar.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/" className="rounded-2xl bg-[#d6a046] px-8 py-3 text-sm font-black text-slate-900 transition hover:bg-[#c49040]">Browse Products</Link>
            <Link href="/signup" className="rounded-2xl border border-white/20 bg-white/10 px-8 py-3 text-sm font-black text-white transition hover:bg-white/20">Create Account</Link>
          </div>
          <p className="mt-6 text-sm text-white/50">Kagaznagar, Telangana · 504296 · <a href="tel:+919494378247" className="text-white/70 hover:text-white">+91 9494378247</a></p>
        </section>
      </div>
    </>
  );
}
