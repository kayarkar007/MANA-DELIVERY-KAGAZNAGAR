import connectToDatabase from "@/lib/mongoose";
import Product from "@/models/Product";
import Link from "next/link";
import { ArrowLeft, SearchX, ShoppingBag } from "lucide-react";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";

export const revalidate = 0; // Disable static caching

async function performSearch(params: any) {
    try {
        await connectToDatabase();
        if (!params.q && !params.minPrice && !params.maxPrice) return [];

        const dbQuery: any = {};

        if (params.q) {
            const searchRegex = new RegExp(params.q, "i"); // Case-insensitive
            dbQuery.$or = [
                { name: searchRegex },
                { description: searchRegex }
            ];
        }

        if (params.minPrice || params.maxPrice) {
            dbQuery.price = {};
            if (params.minPrice) dbQuery.price.$gte = Number(params.minPrice);
            if (params.maxPrice) dbQuery.price.$lte = Number(params.maxPrice);
        }

        let sortOption: any = { createdAt: -1 };
        if (params.sort === 'price_asc') sortOption = { price: 1 };
        if (params.sort === 'price_desc') sortOption = { price: -1 };

        const products = await Product.find(dbQuery).sort(sortOption).lean();

        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error("Search failed:", error);
        return [];
    }
}

export default async function SearchPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string, minPrice?: string, maxPrice?: string, sort?: string }>
}) {
    const resolvedParams = await searchParams;
    const query = resolvedParams.q || "";

    const results = await performSearch(resolvedParams);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 py-10 sm:py-20 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-16 border-b border-slate-100 dark:border-slate-800 pb-10">
                    <div className="space-y-4">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all font-black uppercase tracking-[0.2em] text-[10px]">
                            <ArrowLeft className="w-4 h-4" /> Back to Store
                        </Link>
                        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                            Results for <span className="text-gradient">"{query}"</span>
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="bg-red-600 text-white px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20">
                                {results.length} Matches Found
                            </span>
                        </div>
                    </div>
                </div>

                {results.length === 0 ? (
                    <div className="glass-card p-20 text-center border-white/20 premium-shadow rounded-[3rem] animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8">
                            <SearchX className="w-12 h-12 text-slate-200" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Silence of the results...</h2>
                        <p className="text-slate-400 font-bold mb-10 max-w-md mx-auto text-sm uppercase tracking-tight leading-relaxed">
                            We couldn't track down any items matching "{query}". <br/>
                            Try checking your spelling or using more generic terms.
                        </p>
                        <Link href="/" className="inline-block bg-red-600 text-white px-10 py-5 rounded-2xl font-black hover:bg-red-700 transition-all uppercase tracking-widest text-xs shadow-xl shadow-red-500/40">
                            Continue Browsing
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sidebar Filters */}
                        <div className="w-full lg:w-1/4">
                            <form action="/search" method="GET" className="glass-card p-10 border-white/20 premium-shadow rounded-[2.5rem] space-y-10 sticky top-24">
                                <input type="hidden" name="q" value={query} />

                                <div className="space-y-4">
                                    <h3 className="font-black text-slate-900 dark:text-white text-[10px] tracking-[0.2em] uppercase opacity-40">Display Priority</h3>
                                    <select name="sort" defaultValue={resolvedParams.sort || ""} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 dark:text-white rounded-2xl p-4 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/20 outline-none text-xs font-black uppercase tracking-widest transition-all">
                                        <option value="">Sort by Relevance</option>
                                        <option value="price_asc">Price: Lowest First</option>
                                        <option value="price_desc">Price: Highest First</option>
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-black text-slate-900 dark:text-white text-[10px] tracking-[0.2em] uppercase opacity-40">Value Range</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">₹</span>
                                            <input type="number" name="minPrice" placeholder="Min" defaultValue={resolvedParams.minPrice || ""} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 dark:text-white rounded-2xl py-4 pl-8 pr-4 outline-none text-xs font-black transition-all focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/20" />
                                        </div>
                                        <span className="text-slate-300">-</span>
                                        <div className="relative flex-1">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">₹</span>
                                            <input type="number" name="maxPrice" placeholder="Max" defaultValue={resolvedParams.maxPrice || ""} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 dark:text-white rounded-2xl py-4 pl-8 pr-4 outline-none text-xs font-black transition-all focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/20" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-16 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] hover:scale-95 transition-all shadow-xl active:scale-90">
                                    Refine Results
                                </button>

                                {(resolvedParams.minPrice || resolvedParams.maxPrice || resolvedParams.sort) && (
                                    <Link href={`/search?q=${query}`} className="block text-center text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600">
                                        Clear All Filters
                                    </Link>
                                )}
                            </form>
                        </div>

                        {/* Search Results Grid */}
                        <div className="w-full lg:w-3/4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {results.map((product: any, idx: number) => (
                                <div key={product._id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="glass-card p-6 md:p-8 border-white/20 premium-shadow rounded-[3rem] group hover:border-red-500/30 transition-all overflow-hidden flex flex-col h-full bg-white dark:bg-slate-900/20">
                                        <div className="relative aspect-square w-full rounded-[2.25rem] overflow-hidden mb-8 bg-slate-50 dark:bg-slate-950 shadow-inner">
                                            {product.image ? (
                                                <Image
                                                    src={product.image}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover group-hover:scale-115 transition-transform duration-1000"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-slate-200 dark:text-slate-800">
                                                    <ShoppingBag className="w-20 h-20" />
                                                </div>
                                            )}
                                            
                                            {/* Overlays */}
                                            <div className="absolute top-4 left-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-900 dark:text-white border border-white/20">
                                                Fastest Delivery
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2 line-clamp-1 group-hover:text-red-600 transition-colors">{product.name}</h3>
                                            <p className="text-xs text-slate-400 font-bold mb-8 line-clamp-2 leading-relaxed opacity-60 italic">{product.description || "Fresh local essentials delivered."}</p>

                                            <div className="mt-auto flex items-center justify-between gap-4">
                                                <div className="flex flex-col">
                                                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                        <span className="text-red-600 text-sm italic mr-1 font-black">₹</span>{product.price}
                                                    </div>
                                                    {product.originalPrice && product.originalPrice > product.price && (
                                                        <span className="text-[10px] text-rose-500 line-through font-black tracking-widest opacity-80 decoration-2">₹{product.originalPrice}</span>
                                                    )}
                                                </div>
                                                <AddToCartButton product={product} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
