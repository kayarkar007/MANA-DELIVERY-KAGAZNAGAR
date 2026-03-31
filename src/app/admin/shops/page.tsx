"use client";

import { useState, useEffect } from "react";
import { Store, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminShops() {
    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        address: "",
        locationUrl: "",
        ownerName: "",
        phone: "",
        image: "",
        isActive: true,
    });

    const fetchShops = async () => {
        setLoading(true);
        const res = await fetch("/api/shops?adminView=1");
        const data = await res.json();
        if (data.success) setShops(data.data);
        setLoading(false);
    };

    useEffect(() => { fetchShops(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingId ? `/api/shops/${editingId}` : "/api/shops";
        const method = editingId ? "PUT" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
        if (res.ok) {
            setFormData({ name: "", slug: "", description: "", address: "", locationUrl: "", ownerName: "", phone: "", image: "", isActive: true });
            setIsAdding(false);
            setEditingId(null);
            toast.success(editingId ? "Shop updated" : "Shop created");
            fetchShops();
        } else {
            toast.error("Failed to save shop. Ensure slug is unique.");
        }
    };

    const handleEdit = (s: any) => {
        setFormData({
            name: s.name,
            slug: s.slug,
            description: s.description || "",
            address: s.address,
            locationUrl: s.locationUrl || "",
            ownerName: s.ownerName,
            phone: s.phone,
            image: s.image || "",
            isActive: s.isActive ?? true,
        });
        setEditingId(s._id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this shop?")) return;
        const res = await fetch(`/api/shops/${id}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Shop deleted");
            fetchShops();
        }
    };

    const inputCls = "w-full bg-white dark:bg-gray-800 border dark:border-gray-700 p-3.5 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all font-medium text-sm";

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-gray-900 p-5 rounded-[2rem] border dark:border-gray-800 shadow-sm">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <Store className="text-red-600 dark:text-red-400 w-7 h-7" /> Shops (Vendors)
                </h1>
                <button
                    onClick={() => { setIsAdding(!isAdding); if (isAdding) setEditingId(null); }}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30 text-sm"
                >
                    {isAdding ? "Cancel" : <><Plus className="w-4 h-4" /> Add Shop</>}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-5 sm:p-8 rounded-[2rem] border dark:border-gray-800 shadow-sm space-y-5">
                    <h2 className="text-xl font-bold border-b dark:border-gray-800 pb-4 dark:text-white">{editingId ? "Edit Shop" : "Add New Shop"}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Shop Name</label>
                            <input type="text" required value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
                                className={inputCls} placeholder="e.g. Kagaznagar Supermart" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Slug</label>
                            <input type="text" required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className={inputCls} placeholder="e.g. kagaznagar-supermart" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Owner Name</label>
                            <input type="text" required value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} className={inputCls} placeholder="e.g. John Doe" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Owner Phone</label>
                            <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} placeholder="e.g. 9876543210" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Address</label>
                            <input type="text" required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={inputCls} placeholder="e.g. 12-B Market Road, Sirpur Kagaznagar" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Google Maps / Location URL (Optional)</label>
                            <input type="url" value={formData.locationUrl} onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })} className={inputCls} placeholder="https://maps.google.com/..." />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Cover Image URL</label>
                            <input type="url" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className={inputCls} placeholder="https://images.unsplash.com/..." />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Description</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className={inputCls} placeholder="Details about this vendor..." />
                        </div>
                    </div>
                    <button type="submit" className="w-full sm:w-auto bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-8 py-3.5 rounded-xl font-black hover:bg-black dark:hover:bg-white transition-colors">
                        Save Shop
                    </button>
                </form>
            )}

            {loading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-red-600 dark:text-red-400" /></div>
            ) : shops.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border dark:border-gray-800 text-gray-500 dark:text-gray-400">No shops (vendors) registered yet.</div>
            ) : (
                <>
                    <div className="md:hidden space-y-3">
                        {shops.map((s) => (
                            <div key={s._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 flex gap-4 items-start">
                                {s.image
                                    ? <img src={s.image} alt={s.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                                    : <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-xs flex-shrink-0">No Img</div>}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2 justify-between">
                                        <p className="font-black text-gray-900 dark:text-white truncate">{s.name}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.address}</p>
                                    <p className="text-xs text-gray-500 font-medium mt-1">Owner: {s.ownerName} ({s.phone})</p>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => handleEdit(s)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-bold">
                                            <Pencil className="w-3 h-3" /> Edit
                                        </button>
                                        <button onClick={() => handleDelete(s._id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-bold">
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
                                        {["Image", "Name", "Owner", "Phone", "Address", "Actions"].map(h => (
                                            <th key={h} className="p-5 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {shops.map((s) => (
                                        <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-5">
                                                {s.image
                                                    ? <img src={s.image} alt={s.name} className="w-12 h-12 object-cover rounded-xl" />
                                                    : <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-xs border dark:border-gray-700">No Img</div>}
                                            </td>
                                            <td className="p-5 font-black text-gray-900 dark:text-white truncate max-w-[150px]">{s.name}</td>
                                            <td className="p-5 text-gray-500 dark:text-gray-400 font-medium">{s.ownerName}</td>
                                            <td className="p-5 text-gray-500 dark:text-gray-400 font-medium">{s.phone}</td>
                                            <td className="p-5 text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{s.address}</td>
                                            <td className="p-5 text-right space-x-2">
                                                <button onClick={() => handleEdit(s)} className="text-sm px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg font-bold transition-colors">Edit</button>
                                                <button onClick={() => handleDelete(s._id)} className="text-sm px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg font-bold transition-colors">Delete</button>
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
