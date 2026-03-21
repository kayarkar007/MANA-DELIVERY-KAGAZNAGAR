"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const wrapperRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setResults([]);
                setIsOpen(false);
                return;
            }
            setLoading(true);
            try {
                const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&limit=5`);
                const data = await res.json();
                if (data.success) {
                    setResults(data.data);
                    setIsOpen(true);
                }
            } catch (e) {
                // Ignore
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsOpen(false);
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <form
            ref={wrapperRef}
            onSubmit={handleSearch}
            className="relative w-full max-w-2xl mx-auto flex items-center z-50"
        >
            <div className="absolute left-3 sm:left-4 text-gray-400 dark:text-gray-500">
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <input
                type="text"
                placeholder="Search products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-white/20 dark:bg-slate-900/40 backdrop-blur-3xl text-slate-900 dark:text-white border border-white/20 dark:border-slate-800/50 rounded-[2.5rem] py-3.5 sm:py-6 pl-10 sm:pl-14 pr-14 sm:pr-36 focus:outline-none focus:ring-4 sm:focus:ring-8 focus:ring-red-100/50 dark:focus:ring-red-900/20 focus:border-red-500/50 transition-all font-black shadow-2xl hover:shadow-red-500/10 placeholder:text-slate-400 placeholder:italic placeholder:font-bold tracking-tight text-sm sm:text-base"
            />
            <button
                type="submit"
                className="absolute right-2 sm:right-3 top-2 sm:top-3 bottom-2 sm:bottom-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-6 sm:px-10 rounded-[1.25rem] sm:rounded-[1.5rem] transition-all hover:scale-95 active:scale-90 hidden sm:block shadow-lg uppercase tracking-widest text-[10px]"
            >
                Search
            </button>
            <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-3.5 rounded-[1rem] transition-all hover:scale-95 active:scale-90 sm:hidden shadow-lg"
            >
                <Search className="w-4 h-4" />
            </button>

            {/* Dropdown Auto-suggest */}
            {isOpen && query.trim() !== "" && (
                <div className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-800/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-white/10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Recommended for you</p>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center p-12 text-red-600">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : results.length > 0 ? (
                        <ul className="max-h-[30rem] overflow-y-auto p-4 space-y-2">
                            {results.map((product) => (
                                <li key={product._id}>
                                    <Link
                                        href={`/search?q=${encodeURIComponent(product.name)}`}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-6 p-4 hover:bg-white/40 dark:hover:bg-slate-800/40 rounded-[1.5rem] transition-all group border border-transparent hover:border-white/20 dark:hover:border-slate-700/30"
                                    >
                                        <div className="relative w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                                            {product.image ? (
                                                <Image src={product.image} alt={product.name} fill className="object-cover" />
                                            ) : (
                                                <Store className="w-8 h-8 m-auto mt-4 text-slate-200 dark:text-slate-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-lg font-black text-slate-900 dark:text-white truncate tracking-tight">{product.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.unit || 'Standard'}</span>
                                            </div>
                                        </div>
                                        <div className="text-xl font-black text-slate-900 dark:text-white">
                                            <span className="text-red-600 text-sm italic mr-1">₹</span>{product.price}
                                        </div>
                                    </Link>
                                </li>
                            ))}
                            <li className="pt-4 px-2">
                                <button type="submit" className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:opacity-90 transition-all shadow-md">
                                    View all results for "{query}"
                                </button>
                            </li>
                        </ul>
                    ) : (
                        <div className="p-16 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                                No products found matching <br/>
                                <span className="text-slate-900 dark:text-white italic">"{query}"</span>
                            </p>
                        </div>
                    )}
                </div>
            )}
        </form>
    );
}
