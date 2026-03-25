import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, SearchX, ShoppingBag } from "lucide-react";
import connectToDatabase from "@/lib/mongoose";
import Product from "@/models/Product";
import AddToCartButton from "@/components/AddToCartButton";
import { formatCurrency } from "@/lib/utils";

export const revalidate = 0;

async function performSearch(params: { q?: string; minPrice?: string; maxPrice?: string; sort?: string }) {
    try {
        await connectToDatabase();
        if (!params.q && !params.minPrice && !params.maxPrice) return [];

        const dbQuery: any = {};

        if (params.q) {
            const searchRegex = new RegExp(params.q, "i");
            dbQuery.$or = [{ name: searchRegex }, { description: searchRegex }];
        }

        if (params.minPrice || params.maxPrice) {
            dbQuery.price = {};
            if (params.minPrice) dbQuery.price.$gte = Number(params.minPrice);
            if (params.maxPrice) dbQuery.price.$lte = Number(params.maxPrice);
        }

        let sortOption: any = { createdAt: -1 };
        if (params.sort === "price_asc") sortOption = { price: 1 };
        if (params.sort === "price_desc") sortOption = { price: -1 };

        const products = await Product.find(dbQuery).sort(sortOption).lean();
        return JSON.parse(JSON.stringify(products));
    } catch (error) {
        console.error("Search failed:", error);
        return [];
    }
}

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; minPrice?: string; maxPrice?: string; sort?: string }>;
}) {
    const resolvedParams = await searchParams;
    const query = resolvedParams.q || "";
    const results = await performSearch(resolvedParams);

    return (
        <div className="space-y-8 pb-28 sm:space-y-10 md:pb-10">
            <section className="app-card-strong px-6 py-7 sm:px-10 sm:py-9">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-4">
                        <Link href="/" className="app-button app-button-secondary w-fit rounded-[1.2rem]">
                            <ArrowLeft className="h-4 w-4" />
                            Back to store
                        </Link>
                        <div className="space-y-3">
                            <span className="app-kicker">Search results</span>
                            <h1 className="app-title text-4xl text-slate-900 dark:text-white sm:text-5xl">
                                {query ? <>Results for <span className="text-gradient">"{query}"</span></> : "Refine your search"}
                            </h1>
                            <p className="app-subtitle max-w-2xl">
                                Use filters to tighten price range, sort order, and product relevance without losing the fast add-to-cart flow.
                            </p>
                        </div>
                    </div>

                    <div className="app-panel px-5 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Matches</p>
                        <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{results.length}</p>
                    </div>
                </div>
            </section>

            {results.length === 0 ? (
                <div className="app-card rounded-[2.5rem] p-16 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <SearchX className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">No matching products yet.</h2>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        Try a broader keyword, remove price limits, or browse the store categories directly.
                    </p>
                    <Link href="/" className="app-button app-button-primary mt-8 rounded-[1.2rem]">
                        Continue browsing
                    </Link>
                </div>
            ) : (
                <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
                    <aside className="app-card h-fit rounded-[2rem] p-6 lg:sticky lg:top-28">
                        <form action="/search" method="GET" className="space-y-6">
                            <input type="hidden" name="q" value={query} />

                            <div>
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sort order</label>
                                <select name="sort" defaultValue={resolvedParams.sort || ""} className="app-select text-sm font-semibold">
                                    <option value="">Relevance</option>
                                    <option value="price_asc">Price: low to high</option>
                                    <option value="price_desc">Price: high to low</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Price range</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="number" name="minPrice" defaultValue={resolvedParams.minPrice || ""} placeholder="Min" className="app-input text-sm font-semibold" />
                                    <input type="number" name="maxPrice" defaultValue={resolvedParams.maxPrice || ""} placeholder="Max" className="app-input text-sm font-semibold" />
                                </div>
                            </div>

                            <button type="submit" className="app-button app-button-primary flex w-full justify-center rounded-[1.2rem]">
                                Apply filters
                            </button>

                            {(resolvedParams.minPrice || resolvedParams.maxPrice || resolvedParams.sort) && (
                                <Link href={`/search?q=${query}`} className="block text-center text-[11px] font-black uppercase tracking-[0.18em] text-rose-500">
                                    Clear filters
                                </Link>
                            )}
                        </form>
                    </aside>

                    <section className="grid gap-5 pb-8 sm:grid-cols-2 md:pb-0 xl:grid-cols-3">
                        {results.map((product: any) => (
                            <article
                                key={product._id}
                                className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/72"
                            >
                                <div className="relative aspect-square overflow-hidden border-b border-slate-200/80 bg-slate-100 dark:border-slate-800/90 dark:bg-slate-900">
                                    {product.image ? (
                                        <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <ShoppingBag className="h-16 w-16 text-slate-300 dark:text-slate-700" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-5 p-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="line-clamp-1 text-xl font-black text-slate-900 dark:text-white">{product.name}</h3>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                                {product.unit || "Pack"}
                                            </span>
                                        </div>
                                        <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                            {product.description || "Fresh essentials delivered quickly from local partners."}
                                        </p>
                                    </div>

                                    <div className="flex items-end justify-between gap-4 border-t border-slate-200/80 pt-5 dark:border-slate-800/90">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Price</p>
                                            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(product.price)}</p>
                                        </div>
                                        <AddToCartButton product={product} />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>
                </div>
            )}
        </div>
    );
}
