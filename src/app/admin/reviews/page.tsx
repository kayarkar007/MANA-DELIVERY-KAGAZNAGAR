"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquareQuote, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminReviewsPage() {
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "10",
            });
            if (status) params.set("status", status);

            const res = await fetch(`/api/admin/reviews?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setReviews(data.data || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, [page, status]);

    const moderate = async (reviewId: string, nextStatus: string) => {
        const res = await fetch("/api/admin/reviews", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reviewId, status: nextStatus }),
        });
        const data = await res.json();
        if (data.success) {
            toast.success("Review updated");
            fetchReviews();
        } else {
            toast.error(data.error || "Failed to update review");
        }
    };

    const remove = async (reviewId: string) => {
        const res = await fetch(`/api/admin/reviews?reviewId=${reviewId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
            toast.success("Review deleted");
            fetchReviews();
        } else {
            toast.error(data.error || "Failed to delete review");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <MessageSquareQuote className="w-7 h-7 text-red-600" /> Reviews
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Approve, hide, or remove user reviews.</p>
                </div>
                <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
                    <option value="">All</option>
                    <option value="approved">Approved</option>
                    <option value="hidden">Hidden</option>
                </select>
            </div>

            {loading ? (
                <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review._id} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">Order #{review.orderId?.slice?.(-6)?.toUpperCase?.() || review.orderId}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">User ID: {review.userId}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">{review.comment || "No comment"}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-amber-500">{review.rating}/5</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-2">
                                        {new Date(review.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-5">
                                <button onClick={() => moderate(review._id, "approved")} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold">
                                    Approve
                                </button>
                                <button onClick={() => moderate(review._id, "hidden")} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold">
                                    Hide
                                </button>
                                <button onClick={() => remove(review._id)} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-bold inline-flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                                <span className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-black uppercase tracking-widest text-gray-500">
                                    {review.status}
                                </span>
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-bold disabled:opacity-50">
                            Prev
                        </button>
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Page {page} / {totalPages}</span>
                        <button onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-bold disabled:opacity-50">
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
