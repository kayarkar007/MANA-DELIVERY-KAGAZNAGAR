"use client";

import { useState, useEffect, use, useRef } from "react";
import dynamic from "next/dynamic";
import { Package, MapPin, Truck, CheckCircle, Navigation, Loader2, Clock, Phone, MessageSquare, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";

// Dynamic import for Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const orderId = resolvedParams.id;
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [eta, setEta] = useState<string>("Calculating...");
    const [L, setL] = useState<any>(null);

    const [animatedRiderLoc, setAnimatedRiderLoc] = useState<{lat: number, lng: number} | null>(null);
    const currentLocRef = useRef<{lat: number, lng: number} | null>(null);

    const prevStatusRef = useRef<string | null>(null);
    const prevDeliveryStatusRef = useRef<string | null>(null);

    const [supportOpen, setSupportOpen] = useState(false);
    const [supportMsg, setSupportMsg] = useState("");
    const [supportSending, setSupportSending] = useState(false);

    const handleSupportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!supportMsg.trim()) return;
        setSupportSending(true);
        // Mock API call delay
        setTimeout(() => {
            toast.success("Support ticket created. We will reach out shortly!", { icon: "🎫" });
            setSupportMsg("");
            setSupportOpen(false);
            setSupportSending(false);
        }, 1500);
    };

    useEffect(() => {
        import("leaflet").then((leaflet) => {
            setL(leaflet);
        });

        // Request Push Notification Permission
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // Interpolate rider location marker
    useEffect(() => {
        if (order?.riderLocation?.latitude && order?.riderLocation?.longitude) {
            const targetLoc = { lat: order.riderLocation.latitude, lng: order.riderLocation.longitude };
            
            if (!currentLocRef.current) {
                currentLocRef.current = targetLoc;
                setAnimatedRiderLoc(targetLoc);
                return;
            }

            const startLoc = { ...currentLocRef.current };
            const startTime = Date.now();
            const duration = 9000;

            let animationFrameId: number;

            const animateMarker = () => {
                const now = Date.now();
                const progress = Math.min((now - startTime) / duration, 1);
                const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                const currentFrameLoc = {
                    lat: startLoc.lat + (targetLoc.lat - startLoc.lat) * easeProgress,
                    lng: startLoc.lng + (targetLoc.lng - startLoc.lng) * easeProgress
                };

                currentLocRef.current = currentFrameLoc;
                setAnimatedRiderLoc(currentFrameLoc);

                if (progress < 1) {
                    animationFrameId = requestAnimationFrame(animateMarker);
                }
            };

            animationFrameId = requestAnimationFrame(animateMarker);
            return () => cancelAnimationFrame(animationFrameId);
        }
    }, [order?.riderLocation?.latitude, order?.riderLocation?.longitude]);

    // Push Notifications for Status Changes
    useEffect(() => {
        if (!order) return;

        if (prevStatusRef.current && prevStatusRef.current !== order.status) {
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Order Update", {
                    body: `Your order is now ${order.status.replace('_', ' ')}!`,
                    icon: "/logo.png"
                });
            }
        }

        if (prevDeliveryStatusRef.current && prevDeliveryStatusRef.current !== order.deliveryStatus) {
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Delivery Update", {
                    body: `Delivery status updated to ${order.deliveryStatus.replace('_', ' ')}!`,
                    icon: "/logo.png"
                });
            }
        }

        prevStatusRef.current = order.status;
        prevDeliveryStatusRef.current = order.deliveryStatus;
    }, [order?.status, order?.deliveryStatus]);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/orders/${orderId}`);
            const data = await res.json();
            if (data.success) {
                setOrder(data.data);
                calculateETA(data.data);
            }
        } catch (error) {
            console.error("Error fetching order:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();

        // 100% Free Live Tracking using Server-Sent Events (SSE)
        const eventSource = new EventSource(`/api/orders/${orderId}/track`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setOrder((prev: any) => {
                    const nextOrder = { ...prev, ...data };
                    calculateETA(nextOrder);
                    return nextOrder;
                });
            } catch (err) {
                console.error("SSE Parsing Error:", err);
            }
        };

        eventSource.onerror = () => {
             // Silently reconnect typical for SSE
        };

        return () => {
            eventSource.close();
        };
    }, [orderId]);

    const calculateETA = (orderData: any) => {
        if (!orderData.riderLocation || !orderData.latitude || !orderData.longitude) {
            setEta("Location not available");
            return;
        }

        // Simple Haversine distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = (orderData.latitude - orderData.riderLocation.latitude) * Math.PI / 180;
        const dLon = (orderData.longitude - orderData.riderLocation.longitude) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(orderData.riderLocation.latitude * Math.PI / 180) * Math.cos(orderData.latitude * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        // Assuming average speed of 20km/h in city traffic
        const timeInMinutes = Math.round((distance / 20) * 60);
        
        if (timeInMinutes < 2) {
            setEta("Arriving soon!");
        } else {
            setEta(`${timeInMinutes + 2} - ${timeInMinutes + 5} mins`);
        }
    };

    if (loading || !L) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-4 w-full md:w-1/2">
                        <div className="h-4 w-24 bg-slate-100 dark:bg-slate-900 rounded-full animate-pulse" />
                        <div className="h-12 md:h-16 w-3/4 bg-slate-100 dark:bg-slate-900 rounded-3xl animate-pulse" />
                        <div className="h-3 w-32 bg-slate-100 dark:bg-slate-900 rounded-full animate-pulse" />
                    </div>
                    <div className="h-20 w-48 bg-slate-100 dark:bg-slate-900 rounded-3xl animate-pulse" />
                </div>
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 relative bg-slate-100 dark:bg-slate-900 rounded-3xl md:rounded-[3rem] h-[400px] sm:h-[500px] lg:h-[600px] animate-pulse" />
                    <div className="space-y-6 md:space-y-8">
                        <div className="h-[400px] bg-slate-100 dark:bg-slate-900 rounded-3xl md:rounded-[3rem] animate-pulse" />
                        <div className="h-32 bg-slate-100 dark:bg-slate-900 rounded-2xl lg:rounded-[2.5rem] animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return <div className="p-8 text-center">Order not found.</div>;
    }

    const riderIcon = L ? new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/3144/3144456.png',
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38]
    }) : null;

    const userIcon = L ? new L.Icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38]
    }) : null;

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-10 animate-slide-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-[0.3em] mb-4"
                    >
                        <span className="w-10 h-[2px] bg-red-600 rounded-full" /> Live Tracking
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        Track Your <br />
                        <span className="text-gradient">Happiness.</span>
                    </h1>
                    <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest pt-2">
                        Order <span className="text-red-600">#{order._id.slice(-6).toUpperCase()}</span>
                    </p>
                </div>
                <div className="glass-card p-6 flex items-center gap-4 premium-shadow border-white/20 animate-float">
                    <div className="bg-red-600 text-white p-3 rounded-2xl shadow-lg shadow-red-500/30">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Delivery</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{eta}</p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="relative bg-slate-100 dark:bg-slate-950 rounded-3xl md:rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-950/20 border-4 border-white dark:border-slate-800 h-[400px] sm:h-[500px] lg:h-[600px] group">
                        {typeof window !== "undefined" && (
                            <MapContainer 
                                center={[order.latitude, order.longitude]} 
                                zoom={15} 
                                style={{ height: "100%", width: "100%", zIndex: 0 }}
                                scrollWheelZoom={false}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                />
                                <Marker position={[order.latitude, order.longitude]} icon={userIcon}>
                                    <Popup>Delivery Address</Popup>
                                </Marker>
                                {animatedRiderLoc && (
                                    <Marker position={[animatedRiderLoc.lat, animatedRiderLoc.lng]} icon={riderIcon}>
                                        <Popup>Rider is here</Popup>
                                    </Marker>
                                )}
                            </MapContainer>
                        )}
                        <div className="absolute top-6 left-6 z-10 glass-card px-4 py-2 flex items-center gap-2 border-white/20">
                            <Navigation className="w-4 h-4 text-red-600 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Live Updates</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 md:space-y-8">
                    <div className="glass-card p-5 sm:p-8 md:p-10 border-white/20 premium-shadow rounded-3xl md:rounded-[3rem]">
                        <h3 className="font-black text-slate-900 dark:text-white mb-10 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                             Journey <span className="w-2 h-2 rounded-full bg-red-600" />
                        </h3>
                        <div className="space-y-12">
                            {[
                                { status: "pending", label: "Order Placed", icon: Package },
                                { status: "processing", label: "Restuarant Confirmed", icon: CheckCircle },
                                { status: "picked_up", label: "Picked Up", icon: Package },
                                { status: "out_for_delivery", label: "On the way", icon: Truck },
                                { status: "delivered", label: "Delivered", icon: CheckCircle },
                            ].map((step, index, array) => {
                                const isCompleted = ["pending", "processing", "shipped", "delivered"].indexOf(order.status) >= index || 
                                                  ["assigned", "picked_up", "out_for_delivery"].indexOf(order.deliveryStatus) + 1 >= index - 1;
                                
                                let active = false;
                                if (order.deliveryStatus === step.status) active = true;
                                if (order.status === step.status) active = true;

                                return (
                                    <div key={step.status} className="flex gap-6 items-start">
                                        <div className="relative flex flex-col items-center">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                                                active ? 'bg-red-600 border-red-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] scale-110' :
                                                isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-300'
                                            }`}>
                                                <step.icon className={`w-5 h-5 ${active ? 'animate-pulse' : ''}`} />
                                            </div>
                                            {index !== array.length - 1 && (
                                                <div className={`w-[2px] h-12 mt-2 rounded-full transition-colors duration-500 ${isCompleted ? 'bg-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800'}`} />
                                            )}
                                        </div>
                                        <div className="pt-2">
                                            <p className={`text-sm font-black uppercase tracking-widest transition-colors duration-500 ${active ? 'text-red-600' : isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-300'}`}>
                                                {step.label}
                                            </p>
                                            {active && (
                                                <motion.p 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-[10px] font-bold text-red-600/60 mt-1 uppercase"
                                                >
                                                    Current Status
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <motion.div 
                        whileHover={{ y: -5 }}
                        className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-3xl lg:rounded-[2.5rem] p-6 lg:p-8 shadow-2xl transition-all relative overflow-hidden group"
                    >
                        {/* Interactive Toggle */}
                        <div className="flex items-center justify-between mb-6 relative z-10 cursor-pointer" onClick={() => setSupportOpen(!supportOpen)}>
                            <div className="flex items-center gap-4">
                                <div className="bg-white/10 dark:bg-slate-900/10 p-3 rounded-2xl group-hover:bg-red-600 transition-colors group-hover:text-white">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Priority Help</p>
                                    <p className="font-black text-xl italic">Request Support</p>
                                </div>
                            </div>
                            <div className={`w-8 h-8 rounded-full border-2 border-white/20 dark:border-slate-900/20 flex items-center justify-center transition-transform ${supportOpen ? 'rotate-180' : ''}`}>
                                <span>↓</span>
                            </div>
                        </div>

                        {/* Collapsed Description */}
                        {!supportOpen && (
                            <p className="text-xs opacity-70 leading-relaxed font-bold relative z-10">
                                Issue with your order? Our 24/7 dedicated support is ready to assist you.
                            </p>
                        )}

                        {/* Expanded Form */}
                        <AnimatePresence>
                            {supportOpen && (
                                <motion.form 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    onSubmit={handleSupportSubmit}
                                    className="relative z-10 space-y-4"
                                >
                                    <textarea
                                        required
                                        value={supportMsg}
                                        onChange={(e) => setSupportMsg(e.target.value)}
                                        placeholder="Briefly describe your issue..."
                                        className="w-full bg-white/5 dark:bg-slate-900/5 border border-white/10 dark:border-slate-900/10 rounded-2xl p-4 text-sm font-bold resize-none outline-none focus:ring-2 focus:ring-white/20 dark:focus:ring-slate-900/20 placeholder:text-white/30 dark:placeholder:text-slate-900/30 text-white dark:text-slate-900"
                                        rows={3}
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={supportSending}
                                        className="w-full bg-red-600 text-white p-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                        {supportSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Ticket</>}
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        {/* Deco Element */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 dark:bg-slate-900/5 rounded-full blur-2xl" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
