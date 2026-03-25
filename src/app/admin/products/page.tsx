"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Plus, Loader2, Pencil, Trash2, Search, Download, PackageCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type ProductForm = {
    name: string;
    price: string;
    unit: string;
    categorySlug: string;
    image: string;
    description: string;
    stockQuantity: string;
    lowStockThreshold: string;
};

const emptyForm: ProductForm = {
    name: "",
    price: "",
    unit: "",
    categorySlug: "",
    image: "",
    description: "",
    stockQuantity: "10",
    lowStockThreshold: "5",
};

export default function AdminProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<ProductForm>(emptyForm);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchProducts = async (nextPage = page, nextSearch = search) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(nextPage),
                limit: "16",
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

    const fetchCategories = async () => {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) {
            setCategories((data.data || []).filter((category: any) => category.type === "product"));
        }
    };

    useEffect(() => {
        fetchCategories();
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
            image: product.image || "",
            description: product.description || "",
            stockQuantity: String(product.stockQuantity ?? (product.inStock ? 10 : 0)),
            lowStockThreshold: String(product.lowStockThreshold ?? 5),
        });
        setEditingId(product._id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this product?")) return;

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

    const exportCsv = () => {
        const rows = [
            ["Name", "Category", "Price", "Unit", "Stock Quantity", "Low Stock Threshold", "Stock State"],
            ...products.map((product) => [
                product.name,
                product.categorySlug,
                product.price,
                product.unit,
                product.stockQuantity ?? 0,
                product.lowStockThreshold ?? 0,
                getStockLabel(product),
            ]),
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

    const getStockLabel = (product: any) => {
        const quantity = Number(product.stockQuantity ?? 0);
        const threshold = Number(product.lowStockThreshold ?? 0);

        if (quantity <= 0) return "Out of stock";
        if (quantity <= threshold) return "Low stock";
        return "Healthy";
    };

    const stockBadgeClass = (product: any) => {
        const label = getStockLabel(product);
        if (label === "Out of stock") return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
        if (label === "Low stock") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    };

    const lowStockCount = products.filter((product) => getStockLabel(product) === "Low stock").length;
    const outOfStockCount = products.filter((product) => getStockLabel(product) === "Out of stock").length;
    const inputCls = "w-full bg-white dark:bg-gray-800 border dark:border-gray-700 p-3.5 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-medium text-sm";

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-gray-900 p-5 rounded-[2rem] border dark:border-gray-800 shadow-sm">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <ShoppingCart className="text-red-600 dark:text-red-400 w-7 h-7" /> Products
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Inventory visibility, search, export, and stock thresholds</p>
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
                            if (isAdding) {
                                resetForm();
                                return;
                            }
                            setIsAdding(true);
                        }}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 text-sm"
                    >
                        {isAdding ? "Close Form" : <><Plus className="w-4 h-4" /> Add Product</>}
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Visible Products</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-3">{products.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-amber-500">Low Stock</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-3">{lowStockCount}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-rose-500">Out Of Stock</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-3">{outOfStockCount}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border dark:border-gray-800 shadow-sm flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by product name or description"
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                </div>
                <button onClick={handleSearch} className="px-4 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700">
                    Search
                </button>
                <button onClick={() => fetchProducts(page, search)} className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-600 dark:text-slate-300">
                    Refresh
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-5 sm:p-8 rounded-[2rem] border dark:border-gray-800 shadow-sm space-y-5">
                    <h2 className="text-xl font-bold border-b dark:border-gray-800 pb-4 dark:text-white">{editingId ? "Edit Product" : "Add New Product"}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Name</label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Price (Rs)</label>
                            <input type="number" required min="0" value={formData.price} onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Unit</label>
                            <input type="text" required value={formData.unit} onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Category</label>
                            <select value={formData.categorySlug} onChange={(e) => setFormData((prev) => ({ ...prev, categorySlug: e.target.value }))} className={inputCls} required>
                                <option value="" disabled>Select Category</option>
                                {categories.map((category) => (
                                    <option key={category._id} value={category.slug}>{category.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Stock Quantity</label>
                            <input type="number" required min="0" value={formData.stockQuantity} onChange={(e) => setFormData((prev) => ({ ...prev, stockQuantity: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Low Stock Threshold</label>
                            <input type="number" required min="0" value={formData.lowStockThreshold} onChange={(e) => setFormData((prev) => ({ ...prev, lowStockThreshold: e.target.value }))} className={inputCls} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Image URL</label>
                            <input type="url" value={formData.image} onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))} className={inputCls} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Description</label>
                            <textarea value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button type="submit" disabled={saving} className="px-8 py-3.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-black">
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
                    <div className="md:hidden space-y-3">
                        {products.map((product) => (
                            <div key={product._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex gap-4 items-start">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-xs flex-shrink-0">No Img</div>
                                )}
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="font-black text-gray-900 dark:text-white truncate">{product.name}</p>
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${stockBadgeClass(product)}`}>
                                            {getStockLabel(product)}
                                        </span>
                                    </div>
                                    <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">Rs {product.price} <span className="text-gray-400 font-medium">/ {product.unit}</span></p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.categorySlug}</p>
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-500 dark:text-gray-400">
                                        <span className="inline-flex items-center gap-1"><PackageCheck className="w-3 h-3" /> Qty {product.stockQuantity ?? 0}</span>
                                        <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low at {product.lowStockThreshold ?? 0}</span>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button onClick={() => handleEdit(product)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-bold">
                                            <Pencil className="w-3 h-3" /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(product._id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg font-bold">
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="hidden md:block bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                                    <tr>
                                        {["Image", "Name", "Category", "Price", "Stock Qty", "Low Threshold", "State", "Actions"].map((header) => (
                                            <th key={header} className="p-5 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {products.map((product) => (
                                        <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
                                            <td className="p-5 font-bold text-gray-900 dark:text-white">{product.stockQuantity ?? 0}</td>
                                            <td className="p-5 text-gray-500 dark:text-gray-400 font-medium">{product.lowStockThreshold ?? 0}</td>
                                            <td className="p-5">
                                                <span className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg inline-block ${stockBadgeClass(product)}`}>
                                                    {getStockLabel(product)}
                                                </span>
                                            </td>
                                            <td className="p-5 text-right space-x-2">
                                                <button onClick={() => handleEdit(product)} className="text-sm px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-bold">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDelete(product._id)} className="text-sm px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg font-bold">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
                            <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-bold disabled:opacity-50">Prev</button>
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Page {page} / {totalPages}</span>
                            <button onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-bold disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
