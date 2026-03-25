"use client";

import { useEffect, useState } from "react";
import { Users, Loader2, ShieldAlert, Package, User } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = async () => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            limit: "20",
        });
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
            setUsers(data.data || []);
            setTotalPages(data.pagination?.totalPages || 1);
        }
        setLoading(false);
    };

    useEffect(() => { fetchUsers(); }, [page]);

    const handleRoleChange = async (userId: string, role: string) => {
        setUpdating(userId);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role }),
            });
            const data = await res.json();
            if (data.success) {
                setUsers((prev) => prev.map((user) => user._id === userId ? { ...user, role } : user));
                toast.success(`Role updated to ${role}`);
            } else {
                toast.error(data.error || "Failed to update role");
            }
        } catch {
            toast.error("Error updating role");
        } finally {
            setUpdating(null);
        }
    };

    const handleWalletAdjust = async (userId: string) => {
        const type = window.prompt("Type credit or debit");
        if (!type || !["credit", "debit"].includes(type)) return;

        const amountText = window.prompt(`Enter ${type} amount`);
        const amount = Number(amountText);
        if (!Number.isFinite(amount) || amount <= 0) return;

        const note = window.prompt("Optional note") || "";

        setUpdating(userId);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "wallet_adjustment",
                    userId,
                    amount,
                    type,
                    note,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Wallet updated");
                fetchUsers();
            } else {
                toast.error(data.error || "Failed to update wallet");
            }
        } catch {
            toast.error("Error updating wallet");
        } finally {
            setUpdating(null);
        }
    };

    const roleIcon = (role: string) => {
        if (role === "admin") return <ShieldAlert className="w-3.5 h-3.5 text-red-500" />;
        if (role === "rider") return <Package className="w-3.5 h-3.5 text-emerald-500" />;
        return <User className="w-3.5 h-3.5 text-red-500" />;
    };

    const roleBadgeCls = (role: string) => {
        const styles: Record<string, string> = {
            admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            rider: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
            user: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        };
        return styles[role] || styles.user;
    };

    const exportCsv = () => {
        const rows = [
            ["Name", "Email", "Role", "Wallet", "Duty Status", "Joined"],
            ...users.map((user) => [
                user.name,
                user.email,
                user.role,
                `${user.walletBalance || 0}`,
                user.dutyStatus || (user.isOnDuty ? "on_duty" : "offline"),
                new Date(user.createdAt).toISOString(),
            ]),
        ];

        const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "users-export.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-gray-900 p-5 rounded-[2rem] border dark:border-gray-800 shadow-sm">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <Users className="text-red-600 dark:text-red-400 w-7 h-7" /> User Management
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{users.length} users on this page</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search users"
                        className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900"
                    />
                    <button onClick={() => { setPage(1); fetchUsers(); }} className="px-4 py-2 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
                        Search
                    </button>
                    <button onClick={exportCsv} className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        Export CSV
                    </button>
                    <button onClick={fetchUsers} className="px-4 py-2 text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-red-600" /></div>
            ) : users.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border dark:border-gray-800 text-gray-500 dark:text-gray-400">No users found.</div>
            ) : (
                <>
                    <div className="md:hidden space-y-3">
                        {users.map((user) => (
                            <div key={user._id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-700 dark:text-red-400 font-black text-sm flex-shrink-0">
                                        {user.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-gray-900 dark:text-white truncate">{user.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg flex-shrink-0 ${roleBadgeCls(user.role)}`}>
                                        {roleIcon(user.role)} {user.role}
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                    <span>Rs {(user.walletBalance || 0).toFixed(0)} wallet</span>
                                    <span>{user.dutyStatus || (user.isOnDuty ? "on_duty" : "offline")}</span>
                                    <span>{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                </div>

                                {updating === user._id ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                            className="w-full text-sm font-bold bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-red-500 outline-none cursor-pointer"
                                        >
                                            <option value="user">User</option>
                                            <option value="rider">Rider</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                        <button onClick={() => handleWalletAdjust(user._id)} className="text-xs px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold">
                                            Wallet
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="hidden md:block bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                                    <tr>
                                        {["Name", "Email", "Role", "Wallet", "Duty", "Joined", "Actions"].map((header) => (
                                            <th key={header} className="p-5 font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-700 dark:text-red-400 font-black text-sm">
                                                        {user.name?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                    <span className="font-black text-gray-900 dark:text-white">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-gray-500 dark:text-gray-400 font-medium text-sm max-w-[180px] truncate">{user.email}</td>
                                            <td className="p-5">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase px-3 py-1.5 rounded-lg ${roleBadgeCls(user.role)}`}>
                                                    {roleIcon(user.role)} {user.role}
                                                </span>
                                            </td>
                                            <td className="p-5 font-bold text-emerald-600 dark:text-emerald-400">Rs {(user.walletBalance || 0).toFixed(0)}</td>
                                            <td className="p-5 text-xs font-black uppercase text-gray-500 dark:text-gray-400">{user.dutyStatus || (user.isOnDuty ? "on_duty" : "offline")}</td>
                                            <td className="p-5 text-gray-500 dark:text-gray-400 text-sm font-medium">{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                                            <td className="p-5">
                                                {updating === user._id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={user.role}
                                                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                            className="text-sm font-bold bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none cursor-pointer"
                                                        >
                                                            <option value="user">User</option>
                                                            <option value="rider">Rider</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                        <button onClick={() => handleWalletAdjust(user._id)} className="text-sm px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold">
                                                            Wallet
                                                        </button>
                                                    </div>
                                                )}
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
