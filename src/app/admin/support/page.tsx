"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function AdminSupportPage() {
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [savingId, setSavingId] = useState<string | null>(null);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "10",
            });
            if (search.trim()) params.set("search", search.trim());
            if (status) params.set("status", status);

            const res = await fetch(`/api/support-tickets?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setTickets(data.data || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTickets(); }, [page, status]);

    const updateTicket = async (ticketId: string, payload: Record<string, any>) => {
        setSavingId(ticketId);
        try {
            const res = await fetch(`/api/support-tickets/${ticketId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Ticket updated");
                fetchTickets();
            } else {
                toast.error(data.error || "Failed to update ticket");
            }
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <MessageSquare className="w-7 h-7 text-red-600" /> Support Tickets
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Resolve customer issues and refund/support requests.</p>
                </div>
                <div className="flex gap-3">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search tickets"
                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                    />
                    <button onClick={() => { setPage(1); fetchTickets(); }} className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold">
                        Search
                    </button>
                    <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm">
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <div key={ticket._id} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-lg font-black text-gray-900 dark:text-white">{ticket.subject}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{ticket.customerName} {ticket.customerPhone ? `- ${ticket.customerPhone}` : ""}</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {ticket.category}
                                        </span>
                                        <span className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-[10px] font-black uppercase tracking-widest text-red-600">
                                            {ticket.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">{ticket.message}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{new Date(ticket.createdAt).toLocaleString()}</p>
                                    <p className="text-xs font-black uppercase mt-2 text-red-600">{ticket.priority}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-3">
                                <select
                                    defaultValue={ticket.status}
                                    onChange={(e) => updateTicket(ticket._id, { status: e.target.value })}
                                    disabled={savingId === ticket._id}
                                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold"
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                                <select
                                    defaultValue={ticket.priority}
                                    onChange={(e) => updateTicket(ticket._id, { priority: e.target.value })}
                                    disabled={savingId === ticket._id}
                                    className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-bold"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                                <button
                                    onClick={() => updateTicket(ticket._id, { status: "resolved" })}
                                    disabled={savingId === ticket._id}
                                    className="px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50"
                                >
                                    Mark Resolved
                                </button>
                            </div>

                            <textarea
                                defaultValue={ticket.adminNotes || ""}
                                placeholder="Admin notes"
                                onBlur={(e) => updateTicket(ticket._id, { adminNotes: e.target.value })}
                                className="w-full min-h-24 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-sm"
                            />
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
