"use client";

import dynamic from "next/dynamic";
import { Navigation } from "lucide-react";

// Dynamically import the map because Leaflet needs window object (Client-side only)
const MapComponent = dynamic(() => import("@/components/admin/LiveTrackingMap"), { ssr: false });

export default function LiveTrackingPage() {
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-8">
                <div className="p-4 bg-gradient-to-br from-red-100 to-indigo-100 rounded-3xl shadow-sm border border-red-50">
                    <Navigation className="w-8 h-8 text-red-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Live Delivery Map</h1>
                    <p className="text-gray-500 font-medium mt-1 text-lg">Monitor active orders real-time across your service area.</p>
                </div>
            </div>

            <MapComponent />
        </div>
    );
}
