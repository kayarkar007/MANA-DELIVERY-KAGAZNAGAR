"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Copy, Loader2, PlusCircle, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function WalletPage() {
    const { status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [topupAmount, setTopupAmount] = useState("500");
    const [topupLoading, setTopupLoading] = useState(false);
    const [utrNumber, setUtrNumber] = useState("");
    const upiId = process.env.NEXT_PUBLIC_UPI_ID || "";

    const loadWalletData = async () => {
        const [profileRes, txRes] = await Promise.all([
            fetch("/api/user/profile"),
            fetch("/api/wallet/transactions?limit=25"),
        ]);
        const profileData = await profileRes.json();
        const txData = await txRes.json();

        if (profileData.success) {
            setWalletBalance(Number(profileData.data.walletBalance) || 0);
        }
        if (txData.success) {
            setTransactions(txData.data || []);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
            return;
        }

        if (status !== "authenticated") return;

        loadWalletData().finally(() => setLoading(false));
    }, [status, router]);

    const handleTopupRequest = async () => {
        const amount = Number(topupAmount);
        if (!Number.isFinite(amount) || amount < 50) {
            toast.error("Minimum top-up amount is Rs 50");
            return;
        }

        if (!upiId) {
            toast.error("UPI ID is not configured.");
            return;
        }

        if (!utrNumber.trim()) {
            toast.error("UPI payment ke baad UTR number enter karo.");
            return;
        }

        setTopupLoading(true);
        try {
            const res = await fetch("/api/support-tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: `Wallet top-up request - Rs ${amount}`,
                    category: "payment",
                    priority: "medium",
                    message: `Wallet top-up request submitted.\nAmount: Rs ${amount}\nUPI ID: ${upiId}\nUTR: ${utrNumber.trim()}\nPlease verify and credit wallet after confirmation.`,
                }),
            });
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || "Failed to submit wallet top-up request");
            }

            setUtrNumber("");
            toast.success("Top-up request submit ho gaya. Verification ke baad wallet credit hoga.");
        } catch (error: any) {
            toast.error(error.message || "Failed to submit wallet top-up request");
        } finally {
            setTopupLoading(false);
        }
    };

    if (loading || status === "loading") {
        return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <ArrowLeft className="w-4 h-4" /> Back to Profile
            </Link>

            <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-[2rem] p-8 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-100">Wallet Balance</p>
                        <h1 className="text-4xl font-black mt-2">Rs {walletBalance.toFixed(2)}</h1>
                        <p className="text-xs font-bold text-red-100 mt-3">Manual UPI payment se top-up request bhejo. Verification ke baad wallet credit hoga.</p>
                    </div>
                    <div className="w-16 h-16 rounded-3xl bg-white/15 flex items-center justify-center">
                        <Wallet className="w-8 h-8" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">Manual UPI Top-Up</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pay to your UPI ID, then submit the UTR for verification.</p>
                    </div>
                    <PlusCircle className="w-6 h-6 text-red-600" />
                </div>

                <div className="flex flex-wrap gap-2">
                    {[100, 250, 500, 1000].map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setTopupAmount(String(value))}
                            className={`px-4 py-2 rounded-xl text-sm font-bold ${topupAmount === String(value) ? "bg-red-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
                        >
                            Rs {value}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
                        {upiId ? (
                            <>
                                <div className="rounded-2xl bg-white p-3 border border-slate-200 shadow-sm">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("Localu")}&am=${Number(topupAmount || 0).toFixed(2)}&cu=INR`}
                                        alt="UPI QR"
                                        className="w-full aspect-square object-contain"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(upiId);
                                        toast.success("UPI ID copied");
                                    }}
                                    className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                                >
                                    <Copy className="w-3.5 h-3.5" /> {upiId}
                                </button>
                            </>
                        ) : (
                            <p className="text-sm text-rose-600">`NEXT_PUBLIC_UPI_ID` missing hai. `.env.local` me UPI ID set karo.</p>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-4 text-emerald-800 dark:text-emerald-300">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-black">Steps</p>
                                    <p className="mt-1">1. QR scan karke amount pay karo. 2. UTR enter karo. 3. Request submit karo. Admin verify karke wallet credit karega.</p>
                                </div>
                            </div>
                        </div>

                        <input
                            type="number"
                            min="50"
                            value={topupAmount}
                            onChange={(e) => setTopupAmount(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-bold"
                            placeholder="Enter top-up amount"
                        />
                        <input
                            type="text"
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value.trim())}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-bold"
                            placeholder="Enter UTR / transaction reference"
                        />
                        <button
                            type="button"
                            onClick={handleTopupRequest}
                            disabled={topupLoading || !upiId}
                            className="px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                        >
                            {topupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                            Submit Top-Up Request
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Wallet History</h2>
                </div>
                {transactions.length === 0 ? (
                    <div className="p-8 text-sm text-slate-500 dark:text-slate-400">No wallet transactions yet.</div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {transactions.map((item) => (
                            <div key={item._id} className="px-6 py-4 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">{item.note || item.source.replace(/_/g, " ")}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                        {new Date(item.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-black ${item.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                                        {item.type === "credit" ? "+" : "-"}Rs {Number(item.amount).toFixed(2)}
                                    </p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                        Balance: Rs {Number(item.balanceAfter).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
