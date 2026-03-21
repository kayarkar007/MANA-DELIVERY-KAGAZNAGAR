import connectToDatabase from "@/lib/mongoose";
import Category from "@/models/Category";
import { notFound } from "next/navigation";
import ProductListing from "@/components/ProductListing";
import ServiceForm from "@/components/ServiceForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    await connectToDatabase();
    const category = await Category.findOne({ slug }).lean();

    if (!category) {
        notFound();
    }

    // Need to parse stringify because lean() still returns objects with ObjectIds which cant be passed to client components sometimes if we were passing the whole object, but here we just pass primitives.

    const categoryName = category.name as string;
    const categoryType = category.type as string;

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <Link href="/" className="inline-flex items-center gap-3 text-sm font-black text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all glass-card px-8 py-4 border-white/20 premium-shadow rounded-2xl w-fit hover:-translate-x-2 active:scale-95 duration-300 uppercase tracking-widest text-[10px]">
                <ChevronLeft className="w-4 h-4" /> Back to Store
            </Link>

            <div className="relative pt-6 pb-12 overflow-hidden">
                {/* Decorative Background Element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] mb-6">
                    {categoryName} <span className="text-gradient">Collection</span>
                </h1>
                
                <div className="flex items-center gap-4">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-lg ${
                        categoryType === "service" 
                        ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50" 
                        : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                    }`}>
                        {categoryType}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 dark:from-slate-800 to-transparent" />
                </div>
            </div>

            <div className="animate-slide-up">
                {categoryType === "product" ? (
                    <ProductListing categorySlug={slug} />
                ) : (
                    <div className="glass-card p-10 md:p-16 border-white/20 premium-shadow rounded-[3.5rem]">
                        <ServiceForm categoryName={categoryName} />
                    </div>
                )}
            </div>
        </div>
    );
}
