"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Flame, Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false });

export default function AdminHeatmaps() {
    const [points, setPoints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHeatmap = async (isRefetch = false) => {
        if (isRefetch) setRefreshing(true);
        try {
            const res = await fetch("/api/admin/heatmap");
            const data = await res.json();
            if (data.success && data.data.length > 0) {
                setPoints(data.data);
            } else if (!isRefetch && data.success) {
                // If absolutely zero locations in db, inject a mock point so it doesn't crash map centering
                setPoints([{ lat: 17.3850, lng: 78.4867, status: "pending" }]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHeatmap();
    }, []);

    // Center map around first dense point or fallback to Hyderabad
    const center = points.length > 0 
        ? [points[0].lat, points[0].lng] 
        : [17.3850, 78.4867]; 

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 space-y-8 animate-slide-up">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <Link href="/admin" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 mb-4 transition-colors">
                        <ArrowLeft className="w-3 h-3" /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tighter">
                        <div className="min-w-[48px] h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                            <Flame className="w-6 h-6 text-white" />
                        </div>
                        Demand Zones
                    </h1>
                    <p className="text-sm font-bold text-slate-500 mt-2 max-w-xl">
                        Visually track order density in real-time. High-concentration areas indicate hot zones where more riders should be dispatched.
                    </p>
                </div>
                <button 
                    onClick={() => fetchHeatmap(true)}
                    disabled={refreshing || loading}
                    className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:shadow-lg transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> 
                    {refreshing ? "Syncing..." : "Sync Live Data"}
                </button>
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="relative w-full h-[600px] md:h-[700px] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                            <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest text-slate-500 rounded-full bg-white dark:bg-slate-800 px-6 py-2 shadow-sm">Tracking Thermal Signatures...</p>
                        </div>
                    ) : (
                        <MapContainer 
                            center={center as [number, number]} 
                            zoom={12} 
                            style={{ height: "100%", width: "100%", zIndex: 0 }}
                            // Overriding standard appearance manually to produce a stealth Map theme perfect for neon heatmaps
                            className="[&_.leaflet-layer]:brightness-[0.4] [&_.leaflet-layer]:contrast-[1.2] [&_.leaflet-layer]:sepia-[0.3] [&_.leaflet-layer]:hue-rotate-180 dark:[&_.leaflet-layer]:brightness-[0.3] dark:[&_.leaflet-layer]:contrast-[1.4]"
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            
                            {points.map((pt, i) => (
                                <CircleMarker 
                                    key={i} 
                                    center={[pt.lat, pt.lng]} 
                                    radius={24}  // Large radius for heavy overlap clustering
                                    pathOptions={{ 
                                        fillColor: pt.status === "delivered" ? "#fb923c" : "#f43f5e", 
                                        fillOpacity: 0.15, // Low opacity allows multiple orders in exact location to accumulate rich colors
                                        color: "transparent"
                                    }}
                                />
                            ))}
                        </MapContainer>
                    )}
                    
                    {/* Map Legend */}
                    {!loading && (
                        <div className="absolute bottom-6 left-6 z-[400] bg-white/90 dark:bg-slate-950/90 backdrop-blur-md px-6 py-4 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 block">Zone Intensity</p>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex relative w-12 h-6 items-center">
                                        <div className="w-6 h-6 rounded-full bg-rose-500/70 absolute left-0 blur-[2px]" />
                                        <div className="w-6 h-6 rounded-full bg-rose-500/70 absolute left-3 blur-[2px]" />
                                        <div className="w-6 h-6 rounded-full bg-rose-500/70 absolute left-6 blur-[2px]" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">High Demand (Surge)</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex relative w-12 h-6 items-center">
                                        <div className="w-6 h-6 rounded-full bg-orange-400/20 absolute left-3 blur-[1px]" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">Normal Activity</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
