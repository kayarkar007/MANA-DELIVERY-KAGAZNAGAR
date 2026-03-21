"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

export default function AdminPromoPage() {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [form, setForm] = useState({ code: "", discountType: "percentage", discountValue: 0, minOrderAmount: 0, usageLimit: 0 });

    const fetchPromos = async () => {
        const res = await fetch("/api/admin/promo");
        const data = await res.json();
        if (data.success) setPromos(data.data);
        setLoading(false);
    };

    useEffect(() => { fetchPromos(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        const res = await fetch("/api/admin/promo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, usageLimit: form.usageLimit || undefined }) });
        const data = await res.json();
        setIsCreating(false);
        if (data.success) { toast.success("Promo Code Created"); setForm({ code: "", discountType: "percentage", discountValue: 0, minOrderAmount: 0, usageLimit: 0 }); fetchPromos(); }
        else toast.error(data.error);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        const res = await fetch(`/api/admin/promo?id=${id}`, { method: "DELETE" });
        if (res.ok) fetchPromos();
    };

    const inputCls = "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-3 rounded-xl font-medium outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 w-full text-sm";

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                <Tag className="w-7 h-7 text-blue-600 dark:text-blue-400" /> Manage Promo Codes
            </h1>

            {/* Create Form */}
            <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-lg font-bold mb-4 dark:text-white">Create New Code</h2>
                <form onSubmit={handleCreate} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input required type="text" placeholder="PROMO CODE" value={form.code}
                            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                            className={`${inputCls} uppercase font-bold tracking-widest`}
                        />
                        <select value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })} className={inputCls}>
                            <option value="percentage">Percentage %</option>
                            <option value="fixed">Fixed Amount ₹</option>
                        </select>
                        <input required type="number" placeholder="Discount Value" value={form.discountValue || ""}
                            onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })} className={inputCls}
                        />
                        <input type="number" placeholder="Min Order Amount (₹)" value={form.minOrderAmount || ""}
                            onChange={e => setForm({ ...form, minOrderAmount: Number(e.target.value) })} className={inputCls}
                        />
                        <input type="number" placeholder="Usage Limit (optional)" value={form.usageLimit || ""}
                            onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })} className={inputCls}
                        />
                    </div>
                    <button disabled={isCreating} type="submit"
                        className="w-full sm:w-auto bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 px-6 py-3 hover:bg-blue-700 transition text-sm">
                        {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Code</>}
                    </button>
                </form>
            </div>

            {/* Promo Cards */}
            {promos.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border dark:border-gray-800 text-gray-500 dark:text-gray-400">No promo codes yet.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {promos.map((p: any) => (
                        <div key={p._id} className="bg-white dark:bg-gray-900 p-5 rounded-3xl border dark:border-gray-800 shadow-sm relative overflow-hidden">
                            {/* Delete button — always visible on mobile, hover on desktop */}
                            <button
                                onClick={() => handleDelete(p._id)}
                                className="absolute top-4 right-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-full transition sm:opacity-0 sm:group-hover:opacity-100 group"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 tracking-wider uppercase mb-1 pr-10">{p.code}</h3>
                            <p className="text-gray-900 dark:text-gray-100 font-bold mb-3 text-base border-b dark:border-gray-800 pb-3">
                                {p.discountType === "percentage" ? `${p.discountValue}% OFF` : `₹${p.discountValue} FLAT OFF`}
                            </p>
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 space-y-2">
                                <p className="flex justify-between"><span>Min Order:</span><span className="text-gray-900 dark:text-gray-100 font-bold">₹{p.minOrderAmount}</span></p>
                                <p className="flex justify-between"><span>Used:</span><span className="text-gray-900 dark:text-gray-100 font-bold">{p.usedCount}{p.usageLimit ? ` / ${p.usageLimit}` : ""} times</span></p>
                                <p className="flex justify-between items-center">
                                    <span>Status:</span>
                                    <span className={p.isActive ? "text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded text-xs" : "text-red-500 dark:text-red-400 font-bold text-xs"}>
                                        {p.isActive ? "✅ Active" : "❌ Inactive"}
                                    </span>
                                </p>
                            </div>
                            {/* Always-visible delete on mobile */}
                            <button
                                onClick={() => handleDelete(p._id)}
                                className="sm:hidden mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
