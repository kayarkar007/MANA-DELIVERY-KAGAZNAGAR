import { WifiOff } from "lucide-react";
import OfflineReloadButton from "@/app/~offline/OfflineReloadButton";

export const metadata = {
    title: "Offline | Mana Delivery",
};

export default function OfflinePage() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
            <div className="mb-6 rounded-full bg-slate-100 p-6 dark:bg-slate-800">
                <WifiOff className="h-12 w-12 text-slate-400" />
            </div>
            <h1 className="mb-2 text-2xl font-bold dark:text-white">You are offline</h1>
            <p className="mb-8 max-w-sm text-slate-500 dark:text-slate-400">
                It seems you've lost your internet connection. Check your connection or explore cached pages.
            </p>
            <OfflineReloadButton />
        </div>
    );
}
