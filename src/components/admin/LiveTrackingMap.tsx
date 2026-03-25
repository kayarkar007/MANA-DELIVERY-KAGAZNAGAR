"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2, Package } from "lucide-react";

// Custom icons based on status
const createStatusIcon = (color: string) => L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const statusColors = {
    pending: "#f59e0b",
    processing: "#3b82f6",
    shipped: "#8b5cf6"
};

export default function LiveTrackingMap() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/admin/orders/active");
            const data = await res.json();
            if (data.success) {
                setOrders(data.data);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        const tick = () => {
            if (document.visibilityState === "visible") {
                fetchOrders();
            }
        };

        const interval = setInterval(tick, 30000);
        document.addEventListener("visibilitychange", tick);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", tick);
        };
    }, []);

    if (loading) return <div className="h-[600px] flex items-center justify-center bg-gray-50 rounded-3xl border border-gray-200"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;

    const center: [number, number] = orders.length > 0
        ? [orders[0].lat, orders[0].lng]
        : [17.3850, 78.4867]; // Default Hyderabad

    return (
        <div className="h-[600px] w-full rounded-3xl overflow-hidden shadow-sm border border-gray-200 relative">
            <MapContainer center={center} zoom={12} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {orders.map((order) => {
                    const iconColor = statusColors[order.status as keyof typeof statusColors] || "#6b7280";
                    return (
                        <Marker
                            key={order.id}
                            position={[order.lat, order.lng]}
                            icon={createStatusIcon(iconColor)}
                        >
                            <Popup className="rounded-2xl shadow-xl border-0 p-0 m-0 custom-popup">
                                <div className="p-2 min-w-[220px]">
                                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                                        <div className="bg-red-50 p-2 rounded-full"><Package className="w-5 h-5 text-red-600" /></div>
                                        <h3 className="font-bold text-gray-900 text-base">{order.customerName}</h3>
                                    </div>
                                    <div className="space-y-2 text-sm mb-4">
                                        <p className="flex justify-between items-center"><span className="text-gray-500 font-medium">Status:</span> <strong className="uppercase bg-gray-50 px-2 py-0.5 rounded-md text-xs" style={{ color: iconColor }}>{order.status}</strong></p>
                                        <p className="flex justify-between"><span className="text-gray-500 font-medium">Value:</span> <strong className="text-gray-900">₹{order.total}</strong></p>
                                        <p className="flex justify-between"><span className="text-gray-500 font-medium">Time:</span> <strong className="text-gray-900">{order.time}</strong></p>
                                    </div>
                                    <button className="w-full py-2 bg-gray-900 hover:bg-gray-800 transition-colors text-white text-xs font-bold rounded-xl" onClick={() => window.open(`/admin/orders`, '_blank')}>
                                        Manage Order
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>

            {/* Legend Overlay */}
            <div className="absolute bottom-6 left-6 z-[400] bg-white p-4 rounded-2xl shadow-xl border border-gray-100">
                <h4 className="font-bold text-sm text-gray-900 mb-3 border-b border-gray-100 pb-2">Live Map Legend</h4>
                <div className="space-y-3 text-xs font-bold text-gray-700">
                    <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-sm ring-1 ring-black/5"></div> Pending</div>
                    <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm ring-1 ring-black/5"></div> Processing</div>
                    <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white shadow-sm ring-1 ring-black/5"></div> Shipped (On the way)</div>
                </div>
                <div className="mt-4 pt-2 border-t border-gray-50 font-medium text-[10px] text-gray-400 text-right flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Auto-refreshes 30s
                </div>
            </div>

            <style>{`
                .leaflet-popup-content-wrapper { border-radius: 1rem; padding: 0; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
                .leaflet-popup-content { margin: 10px 12px; }
            `}</style>
        </div>
    );
}
