"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";

export default function TicketsPage() {
    const { status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState<any[]>([]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
            return;
        }

        if (status !== "authenticated") return;

        fetch("/api/support-tickets?limit=25")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setTickets(data.data || []);
            })
            .finally(() => setLoading(false));
    }, [status, router]);

    if (loading || status === "loading") {
        return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <ArrowLeft className="w-4 h-4" /> Back to Profile
            </Link>

            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600">
                    <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Support Tickets</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Track your support conversations and resolutions.</p>
                </div>
            </div>

            <div className="space-y-4">
                {tickets.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-8 text-sm text-slate-500 dark:text-slate-400">
                        No support tickets yet.
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <div key={ticket._id} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">{ticket.subject}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{ticket.message}</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-black uppercase bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                        {ticket.status.replace("_", " ")}
                                    </span>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                                        {new Date(ticket.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {ticket.adminNotes && (
                                <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Admin Notes</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{ticket.adminNotes}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
