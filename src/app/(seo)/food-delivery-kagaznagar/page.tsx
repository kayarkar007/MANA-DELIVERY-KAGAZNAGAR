import type { Metadata } from "next";
import Link from "next/link";
import { Utensils, Clock, MapPin, Star, ChevronRight, Phone } from "lucide-react";
import LocalBusinessSchema from "@/components/seo/LocalBusinessSchema";
import BreadcrumbSchema from "@/components/seo/BreadcrumbSchema";

export const metadata: Metadata = {
  title: "Food Delivery in Kagaznagar – Order Online | Mana Delivery",
  description:
    "Order food online in Sirpur Kagaznagar with fast home delivery. Get your favourite meals, tiffin, snacks & local food delivered in Kagaznagar. Call +91 9494378247.",
  keywords: [
    "food delivery kagaznagar",
    "online food order kagaznagar",
    "tiffin delivery kagaznagar",
    "food delivery sirpur kagaznagar",
    "home food delivery kagaznagar telangana",
    "food order online kagaznagar",
    "restaurant delivery kagaznagar",
    "khana delivery kagaznagar",
  ],
  alternates: {
    canonical: "https://manadelivery.in/food-delivery-kagaznagar",
  },
  openGraph: {
    title: "Food Delivery in Kagaznagar – Order Online | Mana Delivery",
    description:
      "Order food online in Sirpur Kagaznagar. Meals, tiffin & snacks delivered fast to your door.",
    url: "https://manadelivery.in/food-delivery-kagaznagar",
    type: "website",
  },
};

const faqs = [
  {
    question: "Is food delivery available in Kagaznagar?",
    answer:
      "Yes! Mana Delivery offers food delivery across Sirpur Kagaznagar. We partner with local restaurants and tiffin services to bring meals to your door.",
  },
  {
    question: "How fast is food delivery in Kagaznagar?",
    answer:
      "Delivery time depends on the restaurant and your location in Kagaznagar. Most food orders are delivered within 45–90 minutes.",
  },
  {
    question: "Can I order tiffin online in Kagaznagar?",
    answer:
      "Yes, tiffin and home-cooked meal delivery is available in Kagaznagar through Mana Delivery. Browse food categories for options.",
  },
  {
    question: "What foods can I order online in Kagaznagar?",
    answer:
      "You can order meals, tiffin, snacks, biryani, curries, and local Telangana cuisine delivered to your door in Kagaznagar.",
  },
];

export default function FoodDeliveryKagaznagarPage() {
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
      <BreadcrumbSchema
        items={[{ name: "Food Delivery Kagaznagar", url: "/food-delivery-kagaznagar" }]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="space-y-16">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[rgba(214,160,70,0.16)] bg-[linear-gradient(135deg,#3a0f0a,#6b1a14_45%,#8a2d20_82%,#d6a046_122%)] px-6 py-12 text-white shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:px-10 sm:py-16 md:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,160,70,0.2),transparent_40%)]" />
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em]">
              <Utensils className="h-3.5 w-3.5" />
              Food Delivery · Kagaznagar
            </span>
            <h1 className="font-display text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Food Delivery in Kagaznagar –{" "}
              <span className="text-[#d6a046]">Order Online, Eat at Home</span>
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/80">
              From biryani and tiffin to snacks and full meals — order food online in Sirpur Kagaznagar and get it delivered hot to your doorstep by Mana Delivery.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/search?q=food"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#d6a046] px-6 py-3 text-sm font-black text-slate-900 transition hover:bg-[#c49040]"
              >
                Order Food Now <ChevronRight className="h-4 w-4" />
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

        {/* Features */}
        <section className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: Clock, title: "Fast Delivery", desc: "Hot food delivered within 45–90 minutes of your order in Kagaznagar." },
            { icon: MapPin, title: "Kagaznagar Coverage", desc: "Serving Sirpur, Kagaznagar town, and surrounding areas across Adilabad district." },
            { icon: Star, title: "Local Favourites", desc: "Real local food from Kagaznagar restaurants, tiffin centres, and home cooks." },
          ].map((f) => (
            <div key={f.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-900/20">
                <f.icon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h2 className="font-display text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
            FAQs – Food Delivery in Kagaznagar
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
          <h2 className="font-display text-3xl font-black sm:text-4xl">Hungry? Order Now in Kagaznagar</h2>
          <p className="mx-auto mt-4 max-w-md text-white/70">
            Fast food delivery across Sirpur Kagaznagar — sign up free and get your first order delivered.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/" className="rounded-2xl bg-[#d6a046] px-8 py-3 text-sm font-black text-slate-900 transition hover:bg-[#c49040]">
              Order Now
            </Link>
            <Link href="/signup" className="rounded-2xl border border-white/20 bg-white/10 px-8 py-3 text-sm font-black text-white transition hover:bg-white/20">
              Sign Up Free
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/50">
            Kagaznagar, Telangana · 504296 ·{" "}
            <a href="tel:+919494378247" className="text-white/70 hover:text-white">+91 9494378247</a>
          </p>
        </section>
      </div>
    </>
  );
}
