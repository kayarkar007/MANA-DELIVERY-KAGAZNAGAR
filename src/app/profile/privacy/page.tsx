"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { ArrowLeft, Download, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePrivacyPage() {
    const [exporting, setExporting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmation, setConfirmation] = useState("");

    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await fetch("/api/privacy/export", { cache: "no-store" });
            if (!response.ok) {
                throw new Error("Unable to prepare your data export.");
            }

            const file = await response.blob();
            const url = URL.createObjectURL(file);
            const link = document.createElement("a");
            link.href = url;
            link.download = "mana-delivery-data-export.json";
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Your data export has been downloaded.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to prepare your data export.");
        } finally {
            setExporting(false);
        }
    };

    const handleDelete = async () => {
        if (confirmation !== "DELETE") {
            toast.error('Type DELETE to confirm account deletion.');
            return;
        }

        setDeleting(true);
        try {
            const response = await fetch("/api/privacy/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirmation }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Unable to delete your account.");
            }

            toast.success("Your account has been deleted.");
            await signOut({ callbackUrl: "/" });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to delete your account.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
            <Link href="/profile" className="app-button app-button-secondary mb-8 w-fit rounded-2xl">
                <ArrowLeft className="h-4 w-4" /> Back to profile
            </Link>

            <header className="mb-8">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">Account controls</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">Privacy & Data</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Download the information associated with your account, or permanently remove your account data where permitted.</p>
            </header>

            <section className="glass-card mb-6 rounded-3xl p-6 sm:p-8">
                <div className="flex gap-4">
                    <div className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"><Download className="h-6 w-6" /></div>
                    <div><h2 className="text-lg font-black text-slate-900 dark:text-white">Download your data</h2><p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">Includes account details, orders, wallet history, reviews, support tickets, notifications, and saved preferences.</p></div>
                </div>
                <button onClick={handleExport} disabled={exporting} className="app-button app-button-primary mt-6 rounded-2xl disabled:opacity-50">
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download JSON export
                </button>
            </section>

            <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/40 dark:bg-rose-950/20 sm:p-8">
                <div className="flex gap-4"><div className="rounded-2xl bg-rose-100 p-3 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"><ShieldAlert className="h-6 w-6" /></div><div><h2 className="text-lg font-black text-rose-950 dark:text-rose-100">Delete account</h2><p className="mt-1 text-sm leading-6 text-rose-800/80 dark:text-rose-200/80">This removes account credentials, contact details, addresses, reviews, notifications, and support message content. Completed order and wallet records remain de-identified when needed for financial, fraud-prevention, or legal obligations.</p></div></div>
                <label htmlFor="delete-confirmation" className="mt-6 block text-sm font-bold text-rose-950 dark:text-rose-100">Type <code>DELETE</code> to confirm</label>
                <input id="delete-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" className="mt-2 w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 dark:border-rose-900/50 dark:bg-slate-950 dark:text-white" />
                <button onClick={handleDelete} disabled={deleting || confirmation !== "DELETE"} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
                    {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Permanently delete account
                </button>
            </section>
        </main>
    );
}
