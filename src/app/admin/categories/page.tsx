"use client";

import { useState, useEffect } from "react";
import { CopyPlus, Plus, Loader2, Pencil, Trash2 } from "lucide-react";

export default function AdminCategories() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", slug: "", type: "product", image: "" });

    const fetchCategories = async () => {
        setLoading(true);
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) setCategories(data.data);
        setLoading(false);
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
        const method = editingId ? "PUT" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
        if (res.ok) { setFormData({ name: "", slug: "", type: "product", image: "" }); setIsAdding(false); setEditingId(null); fetchCategories(); }
    };

    const handleEdit = (c: any) => { setFormData({ name: c.name, slug: c.slug, type: c.type, image: c.image || "" }); setEditingId(c._id); setIsAdding(true); };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this category?")) return;
        const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
        if (res.ok) fetchCategories();
    };

    const inputCls = "w-full bg-white dark:bg-gray-800 border dark:border-gray-700 p-3.5 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-gray-900 p-5 rounded-[2rem] border dark:border-gray-800 shadow-sm">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <CopyPlus className="text-blue-600 dark:text-blue-400 w-7 h-7" /> Categories
                </h1>
                <button
                    onClick={() => { setIsAdding(!isAdding); if (isAdding) setEditingId(null); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 text-sm"
                >
                    {isAdding ? "Cancel" : <><Plus className="w-4 h-4" /> Add Category</>}
                </button>
            </div>

            {/* Form */}
            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-5 sm:p-8 rounded-[2rem] border dark:border-gray-800 shadow-sm space-y-5">
                    <h2 className="text-xl font-bold border-b dark:border-gray-800 pb-4 dark:text-white">{editingId ? "Edit Category" : "Add New Category"}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Name</label>
                            <input type="text" required value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                                className={inputCls} placeholder="e.g. Groceries" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Slug</label>
                            <input type="text" required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className={inputCls} placeholder="e.g. groceries" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Type</label>
                            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className={inputCls} required>
                                <option value="product">Product based (Cart)</option>
                                <option value="service">Service based (Form)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Image URL</label>
                            <input type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className={inputCls} placeholder="https://images.unsplash.com/..." />
                        </div>
                    </div>
                    <button type="submit" className="w-full sm:w-auto bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-8 py-3.5 rounded-xl font-black hover:bg-black dark:hover:bg-white transition-colors">
                        Save Category
                    </button>
                </form>
            )}

            {loading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600 dark:text-blue-400" /></div>
            ) : categories.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border dark:border-gray-800 text-gray-500 dark:text-gray-400">No categories yet. Click Add Category to create one.</div>
            ) : (
                <>
                    {/* ── MOBILE CARD VIEW (< md) ── */}
                    <div className="md:hidden space-y-3">
                        {categories.map((c) => (
                            <div key={c._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex gap-4 items-start">
                                {c.image
                                    ? <img src={c.image} alt={c.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                                    : <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-xs flex-shrink-0">No Img</div>}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2 justify-between">
                                        <p className="font-black text-gray-900 dark:text-white">{c.name}</p>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex-shrink-0 ${c.type === "service" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                                            {c.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.slug}</p>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => handleEdit(c)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold">
                                            <Pencil className="w-3 h-3" /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(c._id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-bold">
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
                                        {["Image", "Name", "Slug", "Type", "Actions"].map(h => (
                                            <th key={h} className="p-5 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {categories.map((c) => (
                                        <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-5">
                                                {c.image
                                                    ? <img src={c.image} alt={c.name} className="w-12 h-12 object-cover rounded-xl" />
                                                    : <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-xs border dark:border-gray-700">No Img</div>}
                                            </td>
                                            <td className="p-5 font-black text-gray-900 dark:text-white">{c.name}</td>
                                            <td className="p-5 text-gray-500 dark:text-gray-400 font-medium">{c.slug}</td>
                                            <td className="p-5">
                                                <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg inline-block ${c.type === "service" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                                                    {c.type}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right space-x-2">
                                                <button onClick={() => handleEdit(c)} className="text-sm px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg font-bold transition-colors">Edit</button>
                                                <button onClick={() => handleDelete(c._id)} className="text-sm px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg font-bold transition-colors">Delete</button>
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
