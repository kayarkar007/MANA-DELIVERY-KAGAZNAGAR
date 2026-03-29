import type { Metadata } from "next";
import Link from "next/link";
import { Pill, Clock, ShieldCheck, ChevronRight, Phone } from "lucide-react";
import LocalBusinessSchema from "@/components/seo/LocalBusinessSchema";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";

export const metadata: Metadata = {
  title: "Medicine Delivery in Kagaznagar – Order Online | Mana Delivery",
  description:
    "Order medicines online in Kagaznagar with fast home delivery. Get prescription medicines, OTC drugs & healthcare products delivered in Sirpur Kagaznagar. Call +91 9494378247.",
  keywords: [
    "medicine delivery kagaznagar",
    "online pharmacy kagaznagar",
    "medicine home delivery sirpur kagaznagar",
    "order medicine online kagaznagar",
    "medicine delivery kagaznagar telangana",
    "dawai delivery kagaznagar",
    "pharmacy delivery kagaznagar",
    "healthcare delivery kagaznagar",
  ],
  alternates: {
    canonical: "https://manadelivery.in/medicine-delivery-kagaznagar",
  },
  openGraph: {
    title: "Medicine Delivery in Kagaznagar – Order Online | Mana Delivery",
    description: "Get medicines delivered to your home in Kagaznagar. Fast, reliable pharmacy delivery.",
    url: "https://manadelivery.in/medicine-delivery-kagaznagar",
    type: "website",
  },
};

const faqs = [
  {
    question: "Can I get medicine delivered at home in Kagaznagar?",
    answer:
      "Yes! Mana Delivery provides medicine home delivery in Sirpur Kagaznagar. Order from local pharmacies and get medicines delivered to your door.",
  },
  {
    question: "How do I order medicine online in Kagaznagar?",
    answer:
      "Visit manadelivery.in, go to the medicine category, add your required medicines, and place your order. You can also call +91 9494378247 for assistance.",
  },
  {
    question: "Does Mana Delivery deliver prescription medicines in Kagaznagar?",
    answer:
      "We work with local pharmacies to fulfil medicine orders. For prescription medicines, you may be required to share a valid prescription.",
  },
  {
    question: "Is medicine delivery available in Sirpur?",
    answer:
      "Yes, we deliver medicines across Sirpur, Kagaznagar, and nearby areas of Adilabad district, Telangana.",
  },
];

export default function MedicineDeliveryKagaznagarPage() {
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
      <BreadcrumbSchema items={[{ name: "Medicine Delivery Kagaznagar", url: "/medicine-delivery-kagaznagar" }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="space-y-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[rgba(100,160,214,0.16)] bg-[linear-gradient(135deg,#0a1a3a,#0f2d6b_45%,#1a4a8a_82%,#d6a046_122%)] px-6 py-12 text-white shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:px-10 sm:py-16 md:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,160,214,0.2),transparent_40%)]" />
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
              <Pill className="h-3.5 w-3.5" />
              Medicine Delivery · Kagaznagar
            </span>
            <h1 className="font-display text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Medicine Delivery in Kagaznagar –{" "}
              <span className="text-[#d6a046]">Safe, Fast & Reliable</span>
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/80">
              Order prescription medicines, OTC drugs, and healthcare essentials online. Mana Delivery connects you with local Kagaznagar pharmacies for reliable home delivery.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/search?q=medicine" className="inline-flex items-center gap-2 rounded-2xl bg-[#d6a046] px-6 py-3 text-sm font-black text-slate-900 transition hover:bg-[#c49040]">
                Order Medicine <ChevronRight className="h-4 w-4" />
              </Link>
              <a href="tel:+919494378247" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/20">
                <Phone className="h-4 w-4" /> Call: 9494378247
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: Clock, title: "Fast Delivery", desc: "Medicines delivered same day across Kagaznagar and Sirpur, Telangana." },
            { icon: ShieldCheck, title: "Verified Pharmacies", desc: "We partner only with licensed local pharmacies in Kagaznagar for your safety." },
            { icon: Pill, title: "Wide Range", desc: "OTC medicines, prescription drugs, vitamins, and healthcare products available." },
          ].map((f) => (
            <div key={f.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20">
                <f.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
            FAQs – Medicine Delivery in Kagaznagar
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
          <h2 className="font-display text-3xl font-black sm:text-4xl">Need Medicine in Kagaznagar?</h2>
          <p className="mx-auto mt-4 max-w-md text-white/70">Don&apos;t step out — order online and get it delivered right to your door.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/" className="rounded-2xl bg-[#d6a046] px-8 py-3 text-sm font-black text-slate-900 transition hover:bg-[#c49040]">Shop Now</Link>
            <Link href="/signup" className="rounded-2xl border border-white/20 bg-white/10 px-8 py-3 text-sm font-black text-white transition hover:bg-white/20">Sign Up Free</Link>
          </div>
          <p className="mt-6 text-sm text-white/50">Kagaznagar, Telangana · 504296 · <a href="tel:+919494378247" className="text-white/70 hover:text-white">+91 9494378247</a></p>
        </section>
      </div>
    </>
  );
}
