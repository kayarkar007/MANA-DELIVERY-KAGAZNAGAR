import Link from "next/link";
import Image from "next/image";
import nextDynamic from "next/dynamic";
import { unstable_cache } from "next/cache";
import * as motion from "framer-motion/client";
import { ArrowRight, Clock3, MapPin, ShieldCheck, ShoppingBag, Search, Truck, CreditCard, Star, Quote, Zap, Package, Sparkles } from "lucide-react";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/mongoose";
import Category from "@/models/Category";
import Shop from "@/models/Shop";
import Order from "@/models/Order";
import { authOptions } from "@/lib/auth";

import SearchBar from "@/components/SearchBar";
const RoleBanner = nextDynamic(() => import("@/components/RoleBanner"));
const AnimatedCounter = nextDynamic(() => import("@/components/AnimatedCounter"));

export const dynamic = "force-dynamic";

const SEO_PAGES = [
    { href: "/grocery-delivery-kagaznagar", label: "Grocery Delivery in Kagaznagar" },
    { href: "/food-delivery-kagaznagar", label: "Food Delivery in Kagaznagar" },
    { href: "/medicine-delivery-kagaznagar", label: "Medicine Delivery in Kagaznagar" },
    { href: "/delivery-sirpur-kagaznagar", label: "Delivery in Sirpur Kagaznagar" },
    { href: "/online-shopping-kagaznagar", label: "Online Shopping in Kagaznagar" },
];

const homeFaqs = [
    {
        q: "What is Mana Delivery?",
        a: "Mana Delivery is Kagaznagar's own hyperlocal delivery app. We deliver groceries, food, medicines, and daily essentials right to your doorstep in Sirpur Kagaznagar.",
    },
    {
        q: "Which areas does Mana Delivery cover?",
        a: "We cover Sirpur Kagaznagar, Kagaznagar town, and surrounding areas of Adilabad district, Telangana. Our coverage is expanding regularly.",
    },
    {
        q: "How fast is delivery in Kagaznagar?",
        a: "Most orders are delivered the same day. Delivery time depends on the category and your location within Kagaznagar.",
    },
    {
        q: "What payment methods does Mana Delivery accept?",
        a: "We accept UPI, wallet, and cash on delivery. Choose whatever is convenient for you.",
    },
];

const testimonials = [
    {
        name: "Priya Sharma",
        text: "Mana Delivery ne meri grocery shopping bahut easy kar di. Same day delivery milta hai aur prices bhi reasonable hain!",
        rating: 5,
        location: "Kagaznagar Town",
    },
    {
        name: "Rahul Reddy",
        text: "Medicine delivery at home was a lifesaver for my parents. Very reliable and the rider was very polite.",
        rating: 5,
        location: "Sirpur Colony",
    },
    {
        name: "Anjali Devi",
        text: "Best delivery service in our area! Wallet feature makes checkout super fast. I order almost every week now.",
        rating: 4,
        location: "Subhash Colony",
    },
];

const howItWorks = [
    {
        step: "01",
        title: "Browse & Add",
        description: "Explore categories, search products, and add items to your cart from local shops.",
        icon: Search,
        accent: "from-red-500 to-orange-500",
    },
    {
        step: "02",
        title: "Quick Checkout",
        description: "Pay via UPI, Cash on Delivery, or Mana Wallet. Apply promo codes for discounts.",
        icon: CreditCard,
        accent: "from-amber-500 to-yellow-500",
    },
    {
        step: "03",
        title: "Track & Receive",
        description: "Track your order live on the map. Receive at your doorstep with delivery PIN verification.",
        icon: Truck,
        accent: "from-emerald-500 to-teal-500",
    },
];

const getCachedCategories = unstable_cache(
    async () => {
        await connectToDatabase();
        const Product = (await import("@/models/Product")).default;
        const activeSlugs = await Product.distinct("categorySlug", {
            categorySlug: { $exists: true, $ne: "" },
            isHidden: { $ne: true },
        });
        if (!activeSlugs.length) return [];
        const categories = await Category.find({ slug: { $in: activeSlugs } })
            .select("name slug type image createdAt")
            .sort({ createdAt: -1 })
            .lean();
        return JSON.parse(JSON.stringify(categories));
    },
    ["home-categories"],
    { revalidate: 300 }
);

async function getCategories() {
    try {
        return await getCachedCategories();
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return [];
    }
}

const getCachedShops = unstable_cache(
    async () => {
        await connectToDatabase();
        const shops = await Shop.find({ isActive: true })
            .select("name slug description image createdAt")
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();
        return JSON.parse(JSON.stringify(shops));
    },
    ["home-shops"],
    { revalidate: 300 }
);

async function getShops() {
    try {
        return await getCachedShops();
    } catch (error) {
        console.error("Failed to fetch shops:", error);
        return [];
    }
}

const getCachedDeliveredCount = unstable_cache(
    async () => {
        await connectToDatabase();
        return await Order.countDocuments({ status: "delivered" });
    },
    ["home-delivered-count"],
    { revalidate: 300 }
);

async function getDeliveredCount() {
    try {
        return await getCachedDeliveredCount();
    } catch {
        return 0;
    }
}

const trustPoints = [
    {
        title: "Hyperlocal speed",
        description: "Focused local fulfilment keeps delivery windows tighter and more predictable.",
        icon: Clock3,
    },
    {
        title: "Trusted partners",
        description: "Orders route through local stores, service partners, riders, and tracked handoffs.",
        icon: ShieldCheck,
    },
    {
        title: "Address-aware service",
        description: "Optimized for repeat households, saved addresses, wallet, and live delivery tracking.",
        icon: MapPin,
    },
];

export default async function Home() {
    const [categories, shops, session, deliveredCount] = await Promise.all([
        getCategories(),
        getShops(),
        getServerSession(authOptions),
        getDeliveredCount(),
    ]);

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: homeFaqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
    };

    return (
        <div className="space-y-12 sm:space-y-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <RoleBanner role={session?.user?.role} />

            {/* ═══════════ HERO SECTION ═══════════ */}
            <section className="relative overflow-hidden rounded-[2.5rem] border border-[rgba(214,160,70,0.16)] bg-[linear-gradient(135deg,#120507,#26090d_45%,#6d1016_82%,#d6a046_122%)] px-6 py-8 text-white shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:px-10 sm:py-12 md:px-14 md:py-16">
                {/* Animated gradient orbs */}
                <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 animate-float rounded-full bg-[rgba(198,40,40,0.25)] blur-[80px]" />
                <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-[rgba(214,160,70,0.2)] blur-[60px]" style={{ animationDelay: "1.5s", animationDuration: "4s" }} />
                <div className="pointer-events-none absolute left-1/2 top-1/3 h-32 w-32 rounded-full bg-[rgba(225,58,50,0.15)] blur-[50px]" style={{ animationDelay: "0.8s" }} />

                <div className="absolute inset-0 opacity-35">
                    <Image
                        src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=40&w=1200&v=avif_opt2"
                        alt="Fresh delivery essentials"
                        fill
                        priority
                        quality={45}
                        sizes="100vw"
                        className="object-cover mix-blend-soft-light"
                    />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,160,70,0.28),transparent_30%),radial-gradient(circle_at_left,rgba(198,40,40,0.22),transparent_35%),linear-gradient(180deg,rgba(5,2,3,0.18),rgba(5,2,3,0.74))]" />

                <div className="relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
                    <div className="space-y-8">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="app-kicker border-white/10 bg-white/10 text-white"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Mana delivery experience
                        </motion.span>

                        <div className="space-y-5">
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="app-title max-w-4xl text-5xl text-white sm:text-6xl lg:text-7xl"
                            >
                                Grocery, Food &amp; Medicine Delivery in Kagaznagar, Sirpur
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="max-w-2xl text-base leading-8 text-white/78 sm:text-lg"
                            >
                                Groceries, medicines, daily essentials, and trusted services from nearby partners. Built for repeat orders, quick checkout, wallet top-ups, rider tracking, and real local reliability.
                            </motion.p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="max-w-3xl"
                        >
                            <SearchBar />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55 }}
                            className="flex flex-wrap gap-3"
                        >
                            <Link href="#categories" className="app-button app-button-primary rounded-[1.2rem]">
                                Explore services
                            </Link>
                            <Link href="/profile" className="app-button rounded-[1.2rem] border border-white/15 bg-white/10 text-white">
                                Track recent orders
                            </Link>
                        </motion.div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                        {trustPoints.map((point, index) => (
                            <motion.div
                                key={point.title}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur-2xl"
                            >
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
                                    <point.icon className="h-5 w-5 text-white" />
                                </div>
                                <p className="text-sm font-black uppercase tracking-[0.18em] text-white">{point.title}</p>
                                <p className="mt-3 text-sm leading-6 text-white/70">{point.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════ ANIMATED STATS ═══════════ */}
            <section className="grid gap-4 md:grid-cols-4">
                {[
                    { label: "Orders Delivered", value: deliveredCount || 50, suffix: "+", icon: Package },
                    { label: "Local Categories", value: categories.length || 5, suffix: "+", icon: ShoppingBag },
                    { label: "Active Shops", value: shops.length || 3, suffix: "+", icon: MapPin },
                    { label: "Happy Customers", value: Math.max(deliveredCount * 2, 100), suffix: "+", icon: Star },
                ].map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.08 }}
                        className="app-stat flex items-center gap-4 p-6"
                    >
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-red-500/10">
                            <item.icon className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                            <div className="mt-1 font-display text-3xl font-black text-slate-900 dark:text-white">
                                <AnimatedCounter target={item.value} suffix={item.suffix} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </section>

            {/* ═══════════ HOW IT WORKS ═══════════ */}
            <section className="space-y-8 sm:space-y-10">
                <div className="space-y-3 text-center">
                    <span className="app-kicker mx-auto">
                        <Zap className="h-3.5 w-3.5" />
                        Simple process
                    </span>
                    <h2 className="app-title text-4xl text-slate-900 dark:text-white sm:text-5xl">
                        How it works.
                    </h2>
                    <p className="app-subtitle mx-auto max-w-xl">
                        Order in 3 simple steps. No complicated signups, no hidden fees.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {howItWorks.map((step, index) => (
                        <motion.div
                            key={step.step}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.12 }}
                            className="group relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 p-8 shadow-[0_12px_36px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all hover:shadow-[0_18px_50px_rgba(15,23,42,0.1)] dark:border-slate-800/80 dark:bg-slate-950/72"
                        >
                            {/* Step number watermark */}
                            <div className="pointer-events-none absolute -right-3 -top-5 font-display text-[7rem] font-black leading-none text-slate-100 dark:text-slate-900/60">
                                {step.step}
                            </div>

                            <div className={`relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${step.accent} shadow-lg`}>
                                <step.icon className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="relative z-10 text-xl font-black text-slate-900 dark:text-white">{step.title}</h3>
                            <p className="relative z-10 mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ═══════════ CATEGORIES ═══════════ */}
            <section id="categories" className="space-y-8 sm:space-y-10">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-3">
                        <span className="app-kicker">Available today</span>
                        <h2 className="app-title text-4xl text-slate-900 dark:text-white sm:text-5xl">
                            Shop by category.
                        </h2>
                        <p className="app-subtitle max-w-2xl">
                            Browse products and service-led categories with the same fast ordering structure, cleaner cards, and clearer empty states.
                        </p>
                    </div>
                    <Link href="#categories" className="app-button app-button-secondary w-fit rounded-[1.2rem]">
                        Browse all
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {categories.length === 0 ? (
                    <div className="app-card rounded-[2.5rem] border-dashed p-16 text-center">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <ShoppingBag className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">No services found yet.</h3>
                        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                            Set up your first category from the admin panel and it will appear here automatically.
                        </p>
                        <Link href="/admin" className="app-button app-button-primary mt-8 rounded-[1.2rem]">
                            Setup store
                        </Link>
                    </div>
                ) : (
                    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
                        <div
                            className="scroll-strip flex gap-4 overflow-x-auto px-4 pb-4 sm:gap-5 sm:px-6 lg:px-8"
                            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
                        >
                            {categories.map((category: any, index: number) => (
                                <motion.div
                                    key={category._id}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.04 }}
                                    className="flex-none"
                                    style={{ scrollSnapAlign: "start" }}
                                >
                                    <Link
                                        href={`/category/${category.slug}`}
                                        className="group relative flex h-52 w-44 flex-col overflow-hidden rounded-[1.75rem] border border-white/55 bg-slate-950 text-white shadow-[0_24px_60px_rgba(15,23,42,0.14)] sm:h-64 sm:w-52"
                                    >
                                        <div className="absolute inset-0">
                                            {category.image ? (
                                                <Image
                                                    src={category.image}
                                                    alt={category.name}
                                                    fill
                                                    sizes="224px"
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div
                                                    className="h-full w-full"
                                                    style={{
                                                        background:
                                                            category.type === "service"
                                                                ? "linear-gradient(135deg, #120507, #6d1016 65%, #d6a046)"
                                                                : "linear-gradient(135deg, #28070b, #c62828 60%, #d6a046)",
                                                    }}
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                                        </div>

                                        <div className="relative z-10 flex h-full w-full flex-col justify-between p-4">
                                            <span className="w-fit rounded-full border border-white/18 bg-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-white/80">
                                                {category.type}
                                            </span>

                                            <div className="space-y-2">
                                                <h3 className="font-display text-xl font-black leading-none">{category.name}</h3>
                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
                                                    Explore
                                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* ═══════════ SHOPS ═══════════ */}
            {shops && shops.length > 0 && (
                <section className="space-y-6 sm:space-y-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-3">
                            <span className="app-kicker">Local Vendors</span>
                            <h2 className="app-title text-4xl text-slate-900 dark:text-white sm:text-5xl">
                                Shop by Shop.
                            </h2>
                            <p className="app-subtitle max-w-2xl">
                                Order directly from your favourite local stores in Kagaznagar. Each shop carries its own curated stock, updated in real time.
                            </p>
                        </div>
                    </div>
                    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
                        <div
                            className="scroll-strip flex gap-4 overflow-x-auto px-4 pb-4 sm:gap-5 sm:px-6 lg:px-8"
                            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
                        >
                            {shops.map((shop: any, index: number) => (
                                <motion.div
                                    key={shop._id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                    className="flex-none"
                                    style={{ scrollSnapAlign: "start" }}
                                >
                                    <Link
                                        href={`/shop/${shop.slug}`}
                                        className="group relative block h-56 w-40 overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.12)] bg-[#100709] shadow-lg dark:border-[rgba(255,255,255,0.06)] dark:bg-black sm:h-64 sm:w-48"
                                    >
                                        <div className="pointer-events-none absolute inset-0 z-10 transition-colors duration-500 group-hover:bg-slate-950/20" />
                                        {shop.image ? (
                                            <Image
                                                src={shop.image}
                                                alt={shop.name}
                                                fill
                                                className="object-cover opacity-80 transition-transform duration-[1.2s] ease-[0.16,1,0.3,1] group-hover:scale-110 group-hover:opacity-100"
                                                sizes="192px"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-slate-200 dark:bg-slate-900">
                                                <ShoppingBag className="h-12 w-12 text-slate-400 dark:text-slate-600" />
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 z-20 h-1/2 bg-gradient-to-t from-[#0a0406] via-[#0a0406]/85 to-transparent" />
                                        <div className="absolute inset-0 z-30 flex flex-col justify-end p-4 transition-transform duration-[0.4s] group-hover:translate-y-[-0.25rem]">
                                            <div className="space-y-2">
                                                <h3 className="line-clamp-2 text-base font-black leading-[1.15] text-white">
                                                    {shop.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
                                                    Visit store
                                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ═══════════ TESTIMONIALS ═══════════ */}
            <section className="space-y-8 sm:space-y-10">
                <div className="space-y-3 text-center">
                    <span className="app-kicker mx-auto">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        Customer stories
                    </span>
                    <h2 className="app-title text-4xl text-slate-900 dark:text-white sm:text-5xl">
                        What our customers say.
                    </h2>
                    <p className="app-subtitle mx-auto max-w-xl">
                        Real feedback from real people in Kagaznagar and Sirpur.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.name}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 p-7 shadow-[0_12px_36px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/72 sm:p-8"
                        >
                            {/* Quote decoration */}
                            <Quote className="absolute right-5 top-5 h-8 w-8 text-slate-100 dark:text-slate-900/60" />

                            <div className="relative z-10">
                                {/* Stars */}
                                <div className="mb-5 flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${
                                                i < testimonial.rating
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-slate-200 dark:text-slate-800"
                                            }`}
                                        />
                                    ))}
                                </div>

                                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                                    &ldquo;{testimonial.text}&rdquo;
                                </p>

                                <div className="mt-6 flex items-center gap-3 border-t border-slate-200/80 pt-5 dark:border-slate-800/80">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-sm font-black text-white">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">{testimonial.name}</p>
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                            {testimonial.location}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Internal links to SEO landing pages */}
            <section className="space-y-6">
                <div className="space-y-2">
                    <span className="app-kicker">Delivery in Kagaznagar</span>
                    <h2 className="app-title text-3xl text-slate-900 dark:text-white sm:text-4xl">
                        What do you need delivered today?
                    </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {SEO_PAGES.map((page) => (
                        <Link
                            key={page.href}
                            href={page.href}
                            className="flex items-center justify-between rounded-[1.75rem] border border-slate-200 bg-white p-5 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                        >
                            {page.label}
                            <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
                        </Link>
                    ))}
                </div>
            </section>

            {/* FAQ Section for SEO */}
            <section className="space-y-6">
                <div className="space-y-2">
                    <span className="app-kicker">Help &amp; FAQs</span>
                    <h2 className="app-title text-3xl text-slate-900 dark:text-white sm:text-4xl">
                        Frequently Asked Questions
                    </h2>
                </div>
                <div className="space-y-4">
                    {homeFaqs.map((faq) => (
                        <div key={faq.q} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                            <h3 className="font-black text-slate-900 dark:text-white">{faq.q}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{faq.a}</p>
                        </div>
                    ))}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Have more questions?{" "}
                    <a href="tel:+919494378247" className="font-black text-red-600 hover:underline dark:text-red-400">
                        Call us: +91 9494378247
                    </a>{" "}
                    · 3-1-313 Subhash Chandrabose Colony, Sirpur Kagaznagar 504296
                </p>
            </section>
        </div>
    );
}
