import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBasket, Clock, MapPin, Star, ChevronRight, Phone } from "lucide-react";
import LocalBusinessSchema from "@/components/seo/LocalBusinessSchema";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";

export const metadata: Metadata = {
  title: "Grocery Delivery in Kagaznagar – Same Day Home Delivery | Mana Delivery",
  description:
    "Order groceries online in Kagaznagar with fast home delivery. Fresh vegetables, fruits, dairy, pulses & daily essentials delivered to your door in Sirpur Kagaznagar. Call +91 9494378247.",
  keywords: [
    "grocery delivery kagaznagar",
    "online grocery kagaznagar",
    "grocery home delivery sirpur kagaznagar",
    "fresh vegetables delivery kagaznagar",
    "online grocery shopping kagaznagar telangana",
    "sabzi delivery kagaznagar",
    "daily essentials delivery kagaznagar",
  ],
  alternates: {
    canonical: "https://manadelivery.in/grocery-delivery-kagaznagar",
  },
  openGraph: {
    title: "Grocery Delivery in Kagaznagar – Same Day Home Delivery | Mana Delivery",
    description:
      "Order groceries online in Kagaznagar with fast home delivery. Fresh vegetables, fruits, dairy & daily essentials delivered right to your door.",
    url: "https://manadelivery.in/grocery-delivery-kagaznagar",
    type: "website",
  },
};

const faqs = [
  {
    question: "Does Mana Delivery deliver groceries in Kagaznagar?",
    answer:
      "Yes! Mana Delivery provides fast grocery home delivery across Sirpur Kagaznagar. We deliver vegetables, fruits, dairy, and daily essentials to your doorstep.",
  },
  {
    question: "How long does grocery delivery take in Kagaznagar?",
    answer:
      "Typically within the same day. Delivery times depend on availability and your location within Kagaznagar or Sirpur.",
  },
  {
    question: "What groceries can I order online in Kagaznagar?",
    answer:
      "You can order fresh vegetables, fruits, rice, pulses, milk, eggs, bread, household essentials, and much more through Mana Delivery.",
  },
  {
    question: "How do I place a grocery order in Kagaznagar?",
    answer:
      "Simply visit manadelivery.in, browse the grocery category, add items to your cart, and checkout. You can pay via UPI, wallet, or cash on delivery.",
  },
];

export default function GroceryDeliveryKagaznagarPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <LocalBusinessSchema />
      <BreadcrumbSchema
        items={[
          { name: "Grocery Delivery Kagaznagar", url: "/grocery-delivery-kagaznagar" },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="space-y-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[rgba(214,160,70,0.16)] bg-[linear-gradient(135deg,#0f3a12,#1a6b1f_45%,#2d8a34_82%,#d6a046_122%)] px-6 py-12 text-white shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:px-10 sm:py-16 md:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,160,70,0.2),transparent_40%)]" />
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
              <ShoppingBasket className="h-3.5 w-3.5" />
              Grocery Delivery · Kagaznagar
            </span>
            <h1 className="font-display text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Grocery Delivery in Kagaznagar –{" "}
              <span className="text-[#d6a046]">Same Day, Doorstep</span>
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/80">
              Order fresh vegetables, fruits, dairy, pulses & daily essentials online. Mana Delivery brings Kagaznagar&apos;s best grocery stores right to your home in Sirpur Kagaznagar.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/search?q=grocery"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#d6a046] px-6 py-3 text-sm font-black text-slate-900 transition hover:bg-[#c49040]"
              >
                Order Groceries Now <ChevronRight className="h-4 w-4" />
              </Link>
              <a
                href="tel:+919494378247"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/20"
              >
                <Phone className="h-4 w-4" /> Call: 9494378247
              </a>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Clock,
              title: "Same-Day Delivery",
              desc: "Order before noon and get your groceries delivered the same day in Kagaznagar.",
            },
            {
              icon: MapPin,
              title: "Sirpur Kagaznagar Coverage",
              desc: "Full coverage across Sirpur, Kagaznagar town, and nearby areas of Adilabad district.",
            },
            {
              icon: Star,
              title: "Local & Fresh",
              desc: "Sourced from trusted local partners — fresher than supermarkets, faster than going yourself.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 dark:bg-green-900/20">
                <feature.icon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </section>

        {/* What We Deliver */}
        <section className="rounded-[2.5rem] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 sm:p-10">
          <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
            What We Deliver in Kagaznagar
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Browse these grocery categories available for home delivery in Sirpur Kagaznagar:
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Fresh Vegetables & Sabzi",
              "Fruits & Seasonal Produce",
              "Dairy — Milk, Curd, Eggs",
              "Rice, Pulses & Grains",
              "Spices & Masala",
              "Atta, Maida & Flour",
              "Packaged & Processed Foods",
              "Oils & Ghee",
              "Household & Cleaning Essentials",
              "Snacks & Beverages",
              "Baby & Personal Care",
              "Frozen & Ready-to-Cook",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ Section */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
            Frequently Asked Questions – Grocery Delivery in Kagaznagar
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-[1.75rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <h3 className="font-black text-slate-900 dark:text-white">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-[2.5rem] bg-[linear-gradient(135deg,#120507,#26090d_45%,#6d1016)] px-8 py-12 text-center text-white sm:px-12">
          <h2 className="font-display text-3xl font-black sm:text-4xl">
            Ready to Order Groceries in Kagaznagar?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/70">
            Join hundreds of Kagaznagar families who save time with Mana Delivery every week.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="rounded-2xl bg-[#d6a046] px-8 py-3 text-sm font-black text-slate-900 transition hover:bg-[#c49040]"
            >
              Shop Now
            </Link>
            <Link
              href="/signup"
              className="rounded-2xl border border-white/20 bg-white/10 px-8 py-3 text-sm font-black text-white transition hover:bg-white/20"
            >
              Create Free Account
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/50">
            Delivering in Sirpur Kagaznagar, Telangana · 504296 ·{" "}
            <a href="tel:+919494378247" className="text-white/70 hover:text-white">
              +91 9494378247
            </a>
          </p>
        </section>
      </div>
    </>
  );
}
