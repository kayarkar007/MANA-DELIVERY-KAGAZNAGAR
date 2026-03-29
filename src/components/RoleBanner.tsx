"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, Truck, ArrowRight } from "lucide-react";
import * as motion from "framer-motion/client";

export default function RoleBanner({ role }: { role?: string }) {
    const router = useRouter();

    if (!role) return null;

    if (role === "admin") {
        return (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl text-red-600 dark:text-red-400">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-red-900 dark:text-red-100">Admin Mode Active</h3>
                        <p className="text-sm font-medium text-red-700 dark:text-red-300">You are logged in as an administrator.</p>
                    </div>
                </div>
                <button 
                    onClick={() => router.push("/admin")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors"
                >
                    Go to Admin Panel <ArrowRight className="w-4 h-4" />
                </button>
            </motion.div>
        );
    }

    if (role === "rider") {
        return (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                        <Truck className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-emerald-900 dark:text-emerald-100">Rider Mode Active</h3>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">You are logged in as a delivery rider.</p>
                    </div>
                </div>
                <button 
                    onClick={() => router.push("/rider")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors"
                >
                    Go to Rider Dashboard <ArrowRight className="w-4 h-4" />
                </button>
            </motion.div>
        );
    }

    return null;
}
