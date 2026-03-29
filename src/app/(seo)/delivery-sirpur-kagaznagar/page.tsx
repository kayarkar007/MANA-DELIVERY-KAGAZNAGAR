import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Clock, MapPin, ChevronRight, Phone, Star } from "lucide-react";
import LocalBusinessSchema from "@/components/seo/LocalBusinessSchema";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";

export const metadata: Metadata = {
  title: "Delivery Service in Sirpur Kagaznagar – Fast Home Delivery | Mana Delivery",
  description:
    "Mana Delivery is the #1 delivery service in Sirpur Kagaznagar. We deliver groceries, food, medicines & essentials across Kagaznagar, Telangana. Same-day delivery. Call +91 9494378247.",
  keywords: [
    "delivery sirpur kagaznagar",
    "delivery service kagaznagar",
    "home delivery kagaznagar",
    "local delivery kagaznagar",
    "doorstep delivery sirpur kagaznagar",
    "delivery app kagaznagar",
    "same day delivery sirpur",
    "delivery kagaznagar telangana",
    "localu delivery kagaznagar",
  ],
  alternates: {
    canonical: "https://manadelivery.in/delivery-sirpur-kagaznagar",
  },
  openGraph: {
    title: "Delivery Service in Sirpur Kagaznagar – Fast Home Delivery | Mana Delivery",
    description: "The #1 hyperlocal delivery service in Sirpur Kagaznagar, Telangana. Same-day delivery.",
    url: "https://manadelivery.in/delivery-sirpur-kagaznagar",
    type: "website",
  },
};

const faqs = [
  {
    question: "What is Mana Delivery in Sirpur Kagaznagar?",
    answer:
      "Mana Delivery is Kagaznagar's own hyperlocal delivery app. We deliver groceries, food, medicines, and daily essentials from local stores to your doorstep in Sirpur Kagaznagar.",
  },
  {
    question: "Is same-day delivery available in Kagaznagar?",
    answer:
      "Yes! Mana Delivery offers same-day delivery across Kirpur Kagaznagar. Order before noon for same-day fulfilment.",
  },
  {
    question: "Which areas does Mana Delivery cover in Kagaznagar?",
    answer:
      "We cover Sirpur, Kagaznagar town, and surrounding villages in Adilabad district, Telangana. Coverage is expanding regularly.",
  },
  {
    question: "How do I contact Mana Delivery in Kagaznagar?",
    answer:
      "You can call us at +91 9494378247 or visit manadelivery.in to place your order. We are based at 3-1-313 Subhash Chandrabose Colony, Sirpur Kagaznagar 504296.",
  },
];

export default function DeliverySirpurKagaznagarPage() {
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
      <BreadcrumbSchema items={[{ name: "Delivery Sirpur Kagaznagar", url: "/delivery-sirpur-kagaznagar" }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="space-y-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[rgba(214,160,70,0.16)] bg-[linear-gradient(135deg,#120507,#26090d_45%,#6d1016_82%,#d6a046_122%)] px-6 py-12 text-white shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:px-10 sm:py-16 md:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,160,70,0.25),transparent_40%)]" />
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
              <Truck className="h-3.5 w-3.5" />
              Delivery Service · Sirpur Kagaznagar
            </span>
            <h1 className="font-display text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Sirpur Kagaznagar ka{" "}
              <span className="text-[#d6a046]">#1 Delivery Service</span>
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/80">
              Mana Delivery is the hyperlocal delivery app built for Kagaznagar. Groceries, food, medicines, and daily essentials — all delivered same day across Sirpur Kagaznagar.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/" className="inline-flex items-center gap-2 rounded-2xl bg-[#d6a046] px-6 py-3 text-sm font-black text-slate-900 transition hover:bg-[#c49040]">
                Start Ordering <ChevronRight className="h-4 w-4" />
              </Link>
              <a href="tel:+919494378247" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/20">
                <Phone className="h-4 w-4" /> +91 9494378247
              </a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Delivery Area", value: "Sirpur Kagaznagar", note: "& surrounding villages" },
            { label: "Delivery Speed", value: "Same Day", note: "Order before noon" },
            { label: "Categories", value: "Grocery, Food,\nMedicine & More", note: "All in one app" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
              <p className="mt-3 font-display text-2xl font-black text-slate-900 dark:text-white" style={{ whiteSpace: "pre-line" }}>{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.note}</p>
            </div>
          ))}
        </section>

        {/* Why Mana Delivery */}
        <section className="rounded-[2.5rem] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 sm:p-10">
          <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
            Why Kagaznagar Chooses Mana Delivery
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              { icon: Clock, title: "Fastest in Kagaznagar", desc: "Our riders know every lane in Sirpur Kagaznagar — no wasted time, no wrong turns." },
              { icon: MapPin, title: "Truly Local", desc: "We source from Kagaznagar's own stores and services. Not a big-city app pretending." },
              { icon: Star, title: "Trusted by Locals", desc: "Hundreds of Kagaznagar families rely on Mana Delivery for their daily needs." },
              { icon: Truck, title: "All in One App", desc: "Groceries, food, medicines, services — one app, one delivery partner, one Kagaznagar." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
                  <item.icon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
            FAQs – Delivery Service in Sirpur Kagaznagar
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

        {/* Address + CTA */}
        <section className="rounded-[2.5rem] bg-[linear-gradient(135deg,#120507,#26090d_45%,#6d1016)] px-8 py-12 text-center text-white sm:px-12">
          <h2 className="font-display text-3xl font-black sm:text-4xl">Mana Delivery – Kagaznagar ka Apna App</h2>
          <address className="mt-4 not-italic text-white/60">
            3-1-313 Subhash Chandrabose Colony, Sirpur Kagaznagar, Telangana 504296<br />
            <a href="tel:+919494378247" className="text-white/80 hover:text-white">+91 9494378247</a>
          </address>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/" className="rounded-2xl bg-[#d6a046] px-8 py-3 text-sm font-black text-slate-900 transition hover:bg-[#c49040]">Order Now</Link>
            <Link href="/signup" className="rounded-2xl border border-white/20 bg-white/10 px-8 py-3 text-sm font-black text-white transition hover:bg-white/20">Sign Up Free</Link>
          </div>
        </section>
      </div>
    </>
  );
}
