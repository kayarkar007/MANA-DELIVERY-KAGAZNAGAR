import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import * as motion from "framer-motion/client";
import { ArrowRight, Clock3, MapPin, ShieldCheck, ShoppingBag } from "lucide-react";
import { getServerSession } from "next-auth";
import connectToDatabase from "@/lib/mongoose";
import Category from "@/models/Category";
import { authOptions } from "@/lib/auth";

const SearchBar = dynamic(() => import("@/components/SearchBar"));
const RoleBanner = dynamic(() => import("@/components/RoleBanner"));

export const revalidate = 0;

async function getCategories() {
    try {
        await connectToDatabase();
        const categories = await Category.find({}).sort({ createdAt: -1 }).lean();
        return JSON.parse(JSON.stringify(categories));
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return [];
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
    const categories = await getCategories();
    const session = await getServerSession(authOptions);

    return (
        <div className="space-y-12 sm:space-y-16">
            <RoleBanner role={session?.user?.role} />

            <section className="relative overflow-hidden rounded-[2.5rem] border border-[rgba(214,160,70,0.16)] bg-[linear-gradient(135deg,#120507,#26090d_45%,#6d1016_82%,#d6a046_122%)] px-6 py-8 text-white shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:px-10 sm:py-12 md:px-14 md:py-16">
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
                        <span className="app-kicker border-white/10 bg-white/10 text-white">
                            Mana delivery experience
                        </span>

                        <div className="space-y-5">
                            <h1 className="app-title max-w-4xl text-5xl text-white sm:text-6xl lg:text-7xl">
                                Faster local delivery with a cleaner, calmer ordering flow.
                            </h1>
                            <p className="max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
                                Groceries, medicines, daily essentials, and trusted services from nearby partners. Built for repeat orders, quick checkout, wallet top-ups, rider tracking, and real local reliability.
                            </p>
                        </div>

                        <div className="max-w-3xl">
                            <SearchBar />
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link href="#categories" className="app-button app-button-primary rounded-[1.2rem]">
                                Explore services
                            </Link>
                            <Link href="/profile" className="app-button rounded-[1.2rem] border border-white/15 bg-white/10 text-white">
                                Track recent orders
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                        {trustPoints.map((point) => (
                            <div key={point.title} className="rounded-[1.75rem] border border-white/12 bg-white/10 p-5 backdrop-blur-2xl">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
                                    <point.icon className="h-5 w-5 text-white" />
                                </div>
                                <p className="text-sm font-black uppercase tracking-[0.18em] text-white">{point.title}</p>
                                <p className="mt-3 text-sm leading-6 text-white/70">{point.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                {[
                    { label: "Local categories", value: `${categories.length}+`, note: "Storefronts and service lanes" },
                    { label: "Unified flows", value: "User + Rider + Admin", note: "Consistent UI across each role" },
                    { label: "Smart fulfilment", value: "Wallet, tracking, support", note: "Built for operational clarity" },
                ].map((item) => (
                    <div key={item.label} className="app-stat p-6">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{item.label}</p>
                        <p className="mt-4 font-display text-3xl font-black text-slate-900 dark:text-white">{item.value}</p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{item.note}</p>
                    </div>
                ))}
            </section>

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
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        {categories.map((category: any, index: number) => (
                            <motion.div
                                key={category._id}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className="h-full"
                            >
                                <Link
                                    href={`/category/${category.slug}`}
                                    className="group relative flex h-full min-h-[22rem] overflow-hidden rounded-[2.25rem] border border-white/55 bg-slate-950 text-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
                                >
                                    <div className="absolute inset-0">
                                        {category.image ? (
                                            <Image
                                                src={category.image}
                                                alt={category.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
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

                                    <div className="relative z-10 flex h-full w-full flex-col justify-between p-6">
                                        <span className="w-fit rounded-full border border-white/18 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/80">
                                            {category.type}
                                        </span>

                                        <div className="space-y-4">
                                            <h3 className="font-display text-3xl font-black leading-none">{category.name}</h3>
                                            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/75">
                                                Explore collection
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
