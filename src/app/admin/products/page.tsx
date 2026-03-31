"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Plus, Loader2, Pencil, Trash2, Search, Download, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type ProductForm = {
    name: string;
    price: string;
    unit: string;
    categorySlug: string;
    shopId: string;
    image: string;
    description: string;
    stockQuantity: string;
    lowStockThreshold: string;
    isHidden: boolean;
};

const emptyForm: ProductForm = {
    name: "",
    price: "",
    unit: "",
    categorySlug: "",
    shopId: "",
    image: "",
    description: "",
    stockQuantity: "10",
    lowStockThreshold: "5",
    isHidden: false,
};

export default function AdminProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<ProductForm>(emptyForm);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    // Admin fetches ALL products (including hidden) — using a special param
    const fetchProducts = async (nextPage = page, nextSearch = search) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(nextPage),
                limit: "16",
                adminView: "1", // flag so we can later support unfiltered admin view
            });
            if (nextSearch.trim()) {
                params.set("search", nextSearch.trim());
            }

            const res = await fetch(`/api/products?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setProducts(data.data || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchCategoriesAndShops = async () => {
        const [catRes, shopRes] = await Promise.all([
            fetch("/api/categories"),
            fetch("/api/shops?adminView=1"),
        ]);
        const catData = await catRes.json();
        const shopData = await shopRes.json();

        if (catData.success) {
            setCategories((catData.data || []).filter((c: any) => c.type === "product"));
        }
        if (shopData.success) {
            setShops((shopData.data || []).filter((s: any) => s.isActive));
        }
    };

    useEffect(() => {
        fetchCategoriesAndShops();
    }, []);

    useEffect(() => {
        fetchProducts(page, search);
    }, [page]);

    const handleSearch = async () => {
        setPage(1);
        await fetchProducts(1, search);
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setIsAdding(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = editingId ? `/api/products/${editingId}` : "/api/products";
            const method = editingId ? "PUT" : "POST";

            const payload = {
                ...formData,
                price: Number(formData.price),
                stockQuantity: Math.max(0, Number(formData.stockQuantity) || 0),
                lowStockThreshold: Math.max(0, Number(formData.lowStockThreshold) || 0),
                isHidden: formData.isHidden,
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || "Failed to save product");
            }

            toast.success(editingId ? "Product updated" : "Product created");
            resetForm();
            fetchProducts(page, search);
        } catch (error: any) {
            toast.error(error.message || "Failed to save product");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (product: any) => {
        setFormData({
            name: product.name || "",
            price: String(product.price || ""),
            unit: product.unit || "",
            categorySlug: product.categorySlug || "",
            shopId: product.shopId?._id || product.shopId || "",
            image: product.image || "",
            description: product.description || "",
            stockQuantity: String(product.stockQuantity ?? 10),
            lowStockThreshold: String(product.lowStockThreshold ?? 5),
            isHidden: product.isHidden ?? false,
        });
        setEditingId(product._id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this product? This cannot be undone.")) return;

        try {
            const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || "Failed to delete product");
            }
            toast.success("Product deleted");
            fetchProducts(page, search);
        } catch (error: any) {
            toast.error(error.message || "Failed to delete product");
        }
    };

    // Quick hide/unhide toggle — no full form needed
    const handleToggleHidden = async (product: any) => {
        setTogglingId(product._id);
        try {
            const res = await fetch(`/api/products/${product._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isHidden: !product.isHidden }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            toast.success(product.isHidden ? "Product is now visible to customers" : "Product hidden from customers");
            fetchProducts(page, search);
        } catch (error: any) {
            toast.error(error.message || "Failed to update visibility");
        } finally {
            setTogglingId(null);
        }
    };

    const exportCsv = () => {
        const rows = [
            ["Name", "Category", "Price", "Unit", "Hidden"],
            ...products.map((p) => [p.name, p.categorySlug, p.price, p.unit, p.isHidden ? "Yes" : "No"]),
        ];
        const csv = rows
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "products-export.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const inputCls = "w-full bg-white dark:bg-gray-800 border dark:border-gray-700 p-3.5 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-medium text-sm";
    const disabledInputCls = "w-full bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700 border-dashed p-3.5 rounded-xl text-gray-400 dark:text-gray-600 outline-none font-medium text-sm cursor-not-allowed";

    const hiddenCount = products.filter((p) => p.isHidden).length;
    const visibleCount = products.filter((p) => !p.isHidden).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-gray-900 p-5 rounded-[2rem] border dark:border-gray-800 shadow-sm">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <ShoppingCart className="text-red-600 dark:text-red-400 w-7 h-7" /> Products
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage inventory, visibility, and product details</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={exportCsv}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button
                        onClick={() => {
                            if (isAdding) { resetForm(); return; }
                            setIsAdding(true);
                        }}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 text-sm"
                    >
                        {isAdding ? "Close Form" : <><Plus className="w-4 h-4" /> Add Product</>}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Visible Products</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-3">{visibleCount}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-amber-500">Hidden from Customers</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-3">{hiddenCount}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total Products</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-3">{products.length}</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border dark:border-gray-800 shadow-sm flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Search by product name or description"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                </div>
                <button onClick={handleSearch} className="px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700">Search</button>
                <button onClick={() => fetchProducts(page, search)} className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300">Refresh</button>
            </div>

            {/* Form */}
            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-5 sm:p-8 rounded-[2rem] border dark:border-gray-800 shadow-sm space-y-5">
                    <h2 className="text-xl font-bold border-b dark:border-gray-800 pb-4 dark:text-white">
                        {editingId ? "Edit Product" : "Add New Product"}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Name</label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Price (Rs)</label>
                            <input type="number" required min="0" value={formData.price} onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Unit</label>
                            <input type="text" required value={formData.unit} onChange={(e) => setFormData((p) => ({ ...p, unit: e.target.value }))} className={inputCls} placeholder="e.g. kg, piece, litre" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Category</label>
                            <select value={formData.categorySlug} onChange={(e) => setFormData((p) => ({ ...p, categorySlug: e.target.value }))} className={inputCls} required>
                                <option value="" disabled>Select Category</option>
                                {categories.map((c) => (
                                    <option key={c._id} value={c.slug}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Shop (Vendor)</label>
                            <select value={formData.shopId} onChange={(e) => setFormData((p) => ({ ...p, shopId: e.target.value }))} className={inputCls}>
                                <option value="">Unassigned (General Store)</option>
                                {shops.map((s) => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Stock Quantity — disabled for now, re-enable later per product */}
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-500 dark:text-gray-500 flex items-center gap-2">
                                Stock Quantity
                                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">Disabled for now</span>
                            </label>
                            <input
                                type="number"
                                disabled
                                value={formData.stockQuantity}
                                className={disabledInputCls}
                                title="Stock management is disabled. Re-enable when needed."
                            />
                            <p className="text-xs text-gray-400 mt-1">Stock tracking is off. Products will always show as available.</p>
                        </div>

                        {/* Low Stock Threshold — disabled */}
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-500 dark:text-gray-500 flex items-center gap-2">
                                Low Stock Threshold
                                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">Disabled for now</span>
                            </label>
                            <input
                                type="number"
                                disabled
                                value={formData.lowStockThreshold}
                                className={disabledInputCls}
                                title="Stock threshold management is disabled."
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Image URL</label>
                            <input type="url" value={formData.image} onChange={(e) => setFormData((p) => ({ ...p, image: e.target.value }))} className={inputCls} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Description</label>
                            <textarea value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
                        </div>

                        {/* Hide/Unhide Toggle */}
                        <div className="sm:col-span-2">
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                                <div>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Hide from customers</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {formData.isHidden
                                            ? "⚠️ This product is hidden — customers cannot see or order it."
                                            : "✅ This product is visible to customers."}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData((p) => ({ ...p, isHidden: !p.isHidden }))}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none ${formData.isHidden ? "bg-red-500" : "bg-emerald-500"}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${formData.isHidden ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button type="submit" disabled={saving} className="px-8 py-3.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-black disabled:opacity-60">
                            {saving ? "Saving..." : "Save Product"}
                        </button>
                        <button type="button" onClick={resetForm} className="px-8 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-red-600 dark:text-red-400" /></div>
            ) : products.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border dark:border-gray-800 text-gray-500 dark:text-gray-400">No products found.</div>
            ) : (
                <>
                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                        {products.map((product) => (
                            <div key={product._id} className={`bg-white dark:bg-gray-900 rounded-2xl border shadow-sm p-4 flex gap-4 items-start transition-opacity ${product.isHidden ? "opacity-50 border-red-200 dark:border-red-900/40" : "border-gray-100 dark:border-gray-800"}`}>
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-xs flex-shrink-0">No Img</div>
                                )}
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-start gap-2 justify-between">
                                        <p className="font-black text-gray-900 dark:text-white truncate">{product.name}</p>
                                        {product.isHidden && (
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex-shrink-0">Hidden</span>
                                        )}
                                    </div>
                                    <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">Rs {product.price} <span className="text-gray-400 font-medium">/ {product.unit}</span></p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.categorySlug}</p>
                                    <div className="flex gap-2 pt-1 flex-wrap">
                                        <button onClick={() => handleEdit(product)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-bold">
                                            <Pencil className="w-3 h-3" /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleToggleHidden(product)}
                                            disabled={togglingId === product._id}
                                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${product.isHidden
                                                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                                }`}
                                        >
                                            {togglingId === product._id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : product.isHidden ? (
                                                <><Eye className="w-3 h-3" /> Unhide</>
                                            ) : (
                                                <><EyeOff className="w-3 h-3" /> Hide</>
                                            )}
                                        </button>
                                        <button onClick={() => handleDelete(product._id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg font-bold">
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                                    <tr>
                                        {["Image", "Name", "Category", "Price", "Visibility", "Actions"].map((h) => (
                                            <th key={h} className="p-5 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {products.map((product) => (
                                        <tr key={product._id} className={`transition-colors ${product.isHidden ? "bg-red-50/30 dark:bg-red-950/10 opacity-60" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}>
                                            <td className="p-5">
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded-xl" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-xs border dark:border-gray-700">No Img</div>
                                                )}
                                            </td>
                                            <td className="p-5 font-black text-gray-900 dark:text-white">{product.name}</td>
                                            <td className="p-5 text-gray-500 dark:text-gray-400 font-medium">{product.categorySlug}</td>
                                            <td className="p-5 font-bold text-emerald-600 dark:text-emerald-400">Rs {product.price}</td>
                                            <td className="p-5">
                                                <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg inline-flex items-center gap-1 ${product.isHidden
                                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                    }`}>
                                                    {product.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                    {product.isHidden ? "Hidden" : "Visible"}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right space-x-2 whitespace-nowrap">
                                                <button onClick={() => handleEdit(product)} className="text-sm px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg font-bold transition-colors">Edit</button>
                                                <button
                                                    onClick={() => handleToggleHidden(product)}
                                                    disabled={togglingId === product._id}
                                                    className={`text-sm px-3 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50 ${product.isHidden
                                                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200"
                                                        }`}
                                                >
                                                    {togglingId === product._id ? "..." : product.isHidden ? "Unhide" : "Hide"}
                                                </button>
                                                <button onClick={() => handleDelete(product._id)} className="text-sm px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-lg font-bold transition-colors">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-bold disabled:opacity-50">Prev</button>
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Page {page} / {totalPages}</span>
                            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-bold disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
