"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import { Loader2, Search, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

export default function SearchBar() {
    const router = useRouter();
    const wrapperRef = useRef<HTMLFormElement>(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const deferredQuery = useDeferredValue(query.trim());

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
        if (!deferredQuery) {
            setResults([]);
            setIsOpen(false);
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const fetchResults = async () => {
            setLoading(true);

            try {
                const res = await fetch(`/api/products/search?q=${encodeURIComponent(deferredQuery)}&limit=6`, {
                    signal: controller.signal,
                });
                const data = await res.json();

                if (!controller.signal.aborted && data.success) {
                    startTransition(() => {
                        setResults(data.data || []);
                        setIsOpen(true);
                    });
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setResults([]);
                    setIsOpen(true);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        const timeoutId = window.setTimeout(fetchResults, 220);
        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [deferredQuery]);

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        setIsOpen(false);

        const nextQuery = query.trim();
        if (nextQuery) {
            router.push(`/search?q=${encodeURIComponent(nextQuery)}`);
        }
    };

    return (
        <form
            ref={wrapperRef}
            onSubmit={handleSearch}
            className="relative z-30 mx-auto flex w-full max-w-3xl items-center"
        >
            <div className="pointer-events-none absolute left-4 text-slate-400 dark:text-slate-500 sm:left-5">
                <Search className="h-5 w-5" />
            </div>

            <input
                type="text"
                placeholder="Search groceries, medicines, services..."
                value={query}
                onFocus={() => {
                    if (results.length > 0 || loading || deferredQuery) setIsOpen(true);
                }}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Escape") setIsOpen(false);
                }}
                className="w-full rounded-[1.9rem] border border-white/50 bg-white/80 py-4 pl-12 pr-16 text-sm font-semibold text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.08)] outline-none placeholder:text-slate-400 dark:border-white/8 dark:bg-slate-950/78 dark:text-white sm:py-5 sm:pl-14 sm:pr-44 sm:text-base"
            />

            <button
                type="submit"
                className="app-button app-button-primary absolute inset-y-2 right-2 hidden items-center gap-2 whitespace-nowrap rounded-[1.35rem] px-6 leading-none sm:flex"
            >
                Search
            </button>
            <button
                type="submit"
                className="absolute right-2 top-2 flex h-[calc(100%-1rem)] w-11 items-center justify-center rounded-[1rem] bg-slate-950 text-white dark:bg-white dark:text-slate-950 sm:hidden"
                aria-label="Submit search"
            >
                <Search className="h-4 w-4" />
            </button>

            {isOpen && deferredQuery && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.85rem)] overflow-hidden rounded-[2rem] border border-white/55 bg-white/88 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-3xl dark:border-white/8 dark:bg-slate-950/90">
                    <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 dark:border-slate-800/90">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Quick picks</p>
                            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                Fast matches for "{deferredQuery}"
                            </p>
                        </div>
                        {loading && <Loader2 className="h-5 w-5 animate-spin text-red-600" />}
                    </div>

                    {loading && results.length === 0 ? (
                        <div className="flex items-center justify-center p-10">
                            <Loader2 className="h-7 w-7 animate-spin text-red-600" />
                        </div>
                    ) : results.length > 0 ? (
                        <ul className="max-h-[28rem] space-y-2 overflow-y-auto p-4">
                            {results.map((product) => (
                                <li key={product._id}>
                                    <Link
                                        href={`/search?q=${encodeURIComponent(product.name)}`}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-4 rounded-[1.5rem] border border-transparent p-3 hover:border-slate-200 hover:bg-white/80 dark:hover:border-slate-700 dark:hover:bg-slate-900/80"
                                    >
                                        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-900">
                                            {product.image ? (
                                                <Image src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <Store className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-base font-black text-slate-900 dark:text-white">{product.name}</p>
                                            <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                                                {product.unit || "Standard pack"}
                                            </p>
                                        </div>
                                        <p className="shrink-0 text-sm font-black text-slate-900 dark:text-white">
                                            {formatCurrency(product.price)}
                                        </p>
                                    </Link>
                                </li>
                            ))}

                            <li className="pt-2">
                                <button type="submit" className="app-button app-button-secondary flex w-full justify-center rounded-[1.4rem]">
                                    View all results
                                </button>
                            </li>
                        </ul>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <Search className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">No fast matches found.</p>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                Try a broader keyword or continue to the full results page.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </form>
    );
}
