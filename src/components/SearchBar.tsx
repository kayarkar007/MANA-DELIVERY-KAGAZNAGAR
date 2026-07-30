"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useRef, useState, useCallback } from "react";
import { Clock, Loader2, Mic, MicOff, Search, Store, TrendingUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

const RECENT_SEARCHES_KEY = "mana_recent_searches";
const MAX_RECENT = 5;

const trendingSearches = ["Milk", "Rice", "Atta", "Oil", "Sugar", "Eggs", "Bread"];

function getRecentSearches(): string[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
    } catch {
        return [];
    }
}

function saveRecentSearch(q: string) {
    if (typeof window === "undefined") return;
    const searches = getRecentSearches().filter((s) => s.toLowerCase() !== q.toLowerCase());
    searches.unshift(q);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)));
}

function clearRecentSearches() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(RECENT_SEARCHES_KEY);
}

export default function SearchBar() {
    const router = useRouter();
    const wrapperRef = useRef<HTMLFormElement>(null);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [hasVoiceSupport, setHasVoiceSupport] = useState(false);
    const [mounted, setMounted] = useState(false);
    const recognitionRef = useRef<any>(null);

    const deferredQuery = useDeferredValue(query.trim());

    // Load recent searches + detect voice support on mount
    useEffect(() => {
        setMounted(true);
        setRecentSearches(getRecentSearches());
        setHasVoiceSupport(
            "SpeechRecognition" in window || "webkitSpeechRecognition" in window
        );
    }, []);

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
            saveRecentSearch(nextQuery);
            setRecentSearches(getRecentSearches());
            router.push(`/search?q=${encodeURIComponent(nextQuery)}`);
        }
    };

    const handleRecentClick = (q: string) => {
        setQuery(q);
        setIsOpen(false);
        saveRecentSearch(q);
        setRecentSearches(getRecentSearches());
        router.push(`/search?q=${encodeURIComponent(q)}`);
    };

    const handleClearRecent = () => {
        clearRecentSearches();
        setRecentSearches([]);
    };

    // Voice Search
    const startVoiceSearch = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = "en-IN";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setQuery(transcript);
            setIsListening(false);
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    }, []);

    const stopVoiceSearch = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);



    // Show suggestions dropdown when input focused but no query typed
    const showSuggestions = isOpen && !deferredQuery && (recentSearches.length > 0 || trendingSearches.length > 0);
    const showResults = isOpen && deferredQuery;

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
                    if (results.length > 0 || loading || deferredQuery) {
                        setIsOpen(true);
                    } else if (recentSearches.length > 0 || trendingSearches.length > 0) {
                        setIsOpen(true);
                    }
                }}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Escape") setIsOpen(false);
                }}
                className="w-full rounded-[1.9rem] border border-white/50 bg-white/80 py-4 pl-12 pr-24 text-sm font-semibold text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.08)] outline-none placeholder:text-slate-400 dark:border-white/8 dark:bg-slate-950/78 dark:text-white sm:py-5 sm:pl-14 sm:pr-48 sm:text-base"
            />

            {/* Voice search button */}
            <div className="absolute right-[4.2rem] flex items-center sm:right-[8.5rem]">
                {mounted && hasVoiceSupport && (
                    <button
                        type="button"
                        onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                            isListening
                                ? "animate-voice-pulse bg-red-500 text-white"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                        }`}
                        aria-label={isListening ? "Stop listening" : "Search by voice"}
                    >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                )}
            </div>

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

            {/* ═══ Suggestions dropdown (no query) ═══ */}
            {showSuggestions && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.85rem)] overflow-hidden rounded-[2rem] border border-white/55 bg-white/92 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-3xl dark:border-white/8 dark:bg-slate-950/92">
                    <div className="p-4 sm:p-5">
                        {/* Recent searches */}
                        {recentSearches.length > 0 && (
                            <div className="mb-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Recent searches</p>
                                    <button
                                        type="button"
                                        onClick={handleClearRecent}
                                        className="text-[10px] font-black uppercase tracking-[0.16em] text-red-500 transition-colors hover:text-red-700"
                                    >
                                        Clear all
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recentSearches.map((q) => (
                                        <button
                                            key={q}
                                            type="button"
                                            onClick={() => handleRecentClick(q)}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                        >
                                            <Clock className="h-3 w-3" />
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Trending searches */}
                        <div>
                            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                                <TrendingUp className="mb-0.5 mr-1 inline-block h-3 w-3" />
                                Trending
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {trendingSearches.map((q) => (
                                    <button
                                        key={q}
                                        type="button"
                                        onClick={() => handleRecentClick(q)}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Search results dropdown ═══ */}
            {showResults && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.85rem)] overflow-hidden rounded-[2rem] border border-white/55 bg-white/88 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-3xl dark:border-white/8 dark:bg-slate-950/90">
                    <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 dark:border-slate-800/90">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Quick picks</p>
                            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                Fast matches for &quot;{deferredQuery}&quot;
                            </p>
                        </div>
                        {loading && <Loader2 className="h-5 w-5 animate-spin text-red-600" />}
                    </div>

                    {loading && results.length === 0 ? (
                        <div className="flex items-center justify-center p-10">
                            <Loader2 className="h-7 w-7 animate-spin text-red-600" />
                        </div>
                    ) : results.length > 0 ? (
                        <ul className="max-h-[min(28rem,50dvh)] space-y-2 overflow-y-auto p-3 sm:p-4">
                            {results.map((product) => (
                                <li key={product._id}>
                                    <Link
                                        href={`/search?q=${encodeURIComponent(product.name)}`}
                                        onClick={() => {
                                            setIsOpen(false);
                                            saveRecentSearch(product.name);
                                        }}
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
