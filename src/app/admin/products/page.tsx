"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Loader2, Pencil, Trash2 } from "lucide-react";

export default function AdminProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", price: "", unit: "", categorySlug: "", image: "", description: "" });

    const fetchData = async () => {
        setLoading(true);
        const [pRes, cRes] = await Promise.all([fetch("/api/products"), fetch("/api/categories")]);
        const pData = await pRes.json();
        const cData = await cRes.json();
        if (pData.success) setProducts(pData.data);
        if (cData.success) setCategories(cData.data.filter((c: any) => c.type === "product"));
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingId ? `/api/products/${editingId}` : "/api/products";
        const method = editingId ? "PUT" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, price: Number(formData.price), inStock: true }) });
        if (res.ok) { setFormData({ name: "", price: "", unit: "", categorySlug: "", image: "", description: "" }); setIsAdding(false); setEditingId(null); fetchData(); }
    };

    const handleEdit = (product: any) => {
        setFormData({ name: product.name, price: product.price.toString(), unit: product.unit, categorySlug: product.categorySlug, image: product.image || "", description: product.description || "" });
        setEditingId(product._id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this product?")) return;
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (res.ok) fetchData();
    };

    const inputCls = "w-full bg-white dark:bg-gray-800 border dark:border-gray-700 p-3.5 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-gray-900 p-5 rounded-[2rem] border dark:border-gray-800 shadow-sm">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <ShoppingCart className="text-blue-600 dark:text-blue-400 w-7 h-7" /> Products
                </h1>
                <button
                    onClick={() => { setIsAdding(!isAdding); if (isAdding) setEditingId(null); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 text-sm"
                >
                    {isAdding ? "Cancel" : <><Plus className="w-4 h-4" /> Add Product</>}
                </button>
            </div>

            {/* Form */}
            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-5 sm:p-8 rounded-[2rem] border dark:border-gray-800 shadow-sm space-y-5">
                    <h2 className="text-xl font-bold border-b dark:border-gray-800 pb-4 dark:text-white">{editingId ? "Edit Product" : "Add New Product"}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Name</label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} placeholder="e.g. Tomatoes" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Price (₹)</label>
                            <input type="number" required min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className={inputCls} placeholder="e.g. 40" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Unit</label>
                            <input type="text" required value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className={inputCls} placeholder="e.g. 1 kg" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Category</label>
                            <select value={formData.categorySlug} onChange={(e) => setFormData({ ...formData, categorySlug: e.target.value })} className={inputCls} required>
                                <option value="" disabled>Select Category</option>
                                {categories.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Image URL</label>
                            <input type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className={inputCls} placeholder="https://images.unsplash.com/..." />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Description (optional)</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} placeholder="Short description..." />
                        </div>
                    </div>
                    <button type="submit" className="w-full sm:w-auto bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-8 py-3.5 rounded-xl font-black hover:bg-black dark:hover:bg-white transition-colors">
                        Save Product
                    </button>
                </form>
            )}

            {loading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" /></div>
            ) : products.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border dark:border-gray-800 text-gray-500 dark:text-gray-400">No products found.</div>
            ) : (
                <>
                    {/* ── MOBILE CARD VIEW (< md) ── */}
                    <div className="md:hidden space-y-3">
                        {products.map((p) => (
                            <div key={p._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex gap-4 items-start">
                                {p.image
                                    ? <img src={p.image} alt={p.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                                    : <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-xs flex-shrink-0">No Img</div>}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-black text-gray-900 dark:text-white truncate">{p.name}</p>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex-shrink-0 ${p.inStock ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                            {p.inStock ? "In Stock" : "Out"}
                                        </span>
                                    </div>
                                    <p className="text-green-600 dark:text-green-400 font-bold text-sm">₹{p.price} <span className="text-gray-400 font-medium">/ {p.unit}</span></p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{p.categorySlug}</p>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => handleEdit(p)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold">
                                            <Pencil className="w-3 h-3" /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(p._id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-bold">
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── DESKTOP TABLE VIEW (≥ md) ── */}
                    <div className="hidden md:block bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                                    <tr>
                                        {["Image", "Name", "Price", "Unit", "Category", "Stock", "Actions"].map(h => (
                                            <th key={h} className="p-5 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {products.map((p) => (
                                        <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-5">
                                                {p.image
                                                    ? <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-xl" />
                                                    : <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-xs border dark:border-gray-700">No Img</div>}
                                            </td>
                                            <td className="p-5 font-black text-gray-900 dark:text-white">{p.name}</td>
                                            <td className="p-5 font-bold text-green-600 dark:text-green-400">₹{p.price}</td>
                                            <td className="p-5 text-gray-500 dark:text-gray-400 font-medium">{p.unit}</td>
                                            <td className="p-5 text-gray-500 dark:text-gray-400 font-medium">{p.categorySlug}</td>
                                            <td className="p-5">
                                                <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg inline-block ${p.inStock ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                                                    {p.inStock ? "In Stock" : "Out of Stock"}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right space-x-2">
                                                <button onClick={() => handleEdit(p)} className="text-sm px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg font-bold transition-colors">Edit</button>
                                                <button onClick={() => handleDelete(p._id)} className="text-sm px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg font-bold transition-colors">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
