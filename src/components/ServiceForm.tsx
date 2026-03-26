"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentLocation } from "@/lib/geolocation";
import { Loader2, MapPin } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ServiceForm({ categoryName }: { categoryName: string }) {
    const { data: session } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
    const [error, setError] = useState("");

    const handleServiceChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCustomerChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setCustomer({ ...customer, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!session?.user?.id) {
            router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`);
            return;
        }

        if (!navigator.onLine) {
            setError("You're offline. Reconnect to submit a service request.");
            return;
        }

        setLoading(true);

        try {
            const location = await getCurrentLocation();

            const payload = {
                type: "service",
                serviceCategory: categoryName,
                serviceDetails: formData,
                customerName: customer.name,
                customerPhone: customer.phone,
                address: customer.address,
                latitude: location.latitude,
                longitude: location.longitude,
            };

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            window.location.href = data.redirectUrl;
        } catch (err: any) {
            setError(err.message || "Please ensure location is enabled and try again.");
            setLoading(false);
        }
    };

    const renderFields = () => {
        const slug = categoryName.toLowerCase();

        if (slug.includes("petrol") || slug.includes("fuel")) {
            return (
                <>
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            Fuel Type
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer border p-4 rounded-2xl flex-1 hover:bg-gray-50 transition-colors border-gray-200">
                                <input
                                    type="radio"
                                    name="fuelType"
                                    value="Petrol"
                                    onChange={handleServiceChange}
                                    required
                                    className="w-4 h-4 text-purple-600"
                                />
                                <span className="font-bold text-gray-900">Petrol</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer border p-4 rounded-2xl flex-1 hover:bg-gray-50 transition-colors border-gray-200">
                                <input
                                    type="radio"
                                    name="fuelType"
                                    value="Diesel"
                                    onChange={handleServiceChange}
                                    required
                                    className="w-4 h-4 text-purple-600"
                                />
                                <span className="font-bold text-gray-900">Diesel</span>
                            </label>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            Quantity (Liters)
                        </label>
                        <input
                            type="number"
                            name="quantity"
                            min="1"
                            onChange={handleServiceChange}
                            required
                            className="w-full border border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all font-medium text-gray-900"
                            placeholder="e.g. 5"
                        />
                    </div>
                </>
            );
        }

        if (slug.includes("pickup") || slug.includes("drop")) {
            return (
                <>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700">
                                Pickup Location Details
                            </label>
                            <input
                                type="text"
                                name="pickupLocation"
                                onChange={handleServiceChange}
                                required
                                className="w-full border border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all font-medium"
                                placeholder="e.g. 123 Main St, Apartment 4B"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700">
                                Drop Location Details
                            </label>
                            <input
                                type="text"
                                name="dropLocation"
                                onChange={handleServiceChange}
                                required
                                className="w-full border border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all font-medium"
                                placeholder="e.g. 456 Elm St, Gate 2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700">
                                Item Description & Urgency
                            </label>
                            <textarea
                                name="itemDescription"
                                onChange={handleServiceChange}
                                required
                                className="w-full border border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all h-28 font-medium"
                                placeholder="What are we picking up? How urgent is it?"
                            />
                        </div>
                    </div>
                </>
            );
        }

        if (slug.includes("event") || slug.includes("party")) {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            Event Type
                        </label>
                        <input
                            type="text"
                            name="eventType"
                            onChange={handleServiceChange}
                            required
                            className="w-full border border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all font-medium"
                            placeholder="e.g. Birthday Party, Corporate Setup"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold mb-2 text-gray-700">
                                Date
                            </label>
                            <input
                                type="date"
                                name="eventDate"
                                onChange={handleServiceChange}
                                required
                                className="w-full border border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all font-medium"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-semibold mb-2 text-gray-700">
                                Guests
                            </label>
                            <input
                                type="number"
                                name="peopleCount"
                                onChange={handleServiceChange}
                                required
                                className="w-full border border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all font-medium"
                                placeholder="100"
                            />
                        </div>
                    </div>
                </div>
            );
        }

        if (slug.includes("medicine")) {
            return (
                <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Medicine List / Requirements
                    </label>
                    <textarea
                        name="requirements"
                        onChange={handleServiceChange}
                        required
                        className="w-full border border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all h-36 font-medium"
                        placeholder="List the medicines. A representative will contact you for prescriptions if needed."
                    />
                </div>
            );
        }

        return (
            <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Request Details
                </label>
                <textarea
                    name="details"
                    onChange={handleServiceChange}
                    required
                    className="w-full border border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all h-36 font-medium"
                    placeholder="Detailed description of what you need..."
                />
            </div>
        );
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="max-w-2xl mx-auto space-y-10 bg-white p-6 md:p-10 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50"
        >
            <div className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 border-b-2 border-gray-100 pb-4">
                    1. Service Details
                </h2>
                {renderFields()}
            </div>

            <div className="space-y-6 pt-4">
                <h2 className="text-2xl font-black text-gray-900 border-b-2 border-gray-100 pb-4">
                    2. Customer Info
                </h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={customer.name}
                            onChange={handleCustomerChange}
                            required
                            className="w-full border border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all font-medium"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            Phone Number (WhatsApp)
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={customer.phone}
                            onChange={handleCustomerChange}
                            required
                            className="w-full border border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all font-medium"
                            placeholder="+91 99999 99999"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            Current Address
                        </label>
                        <textarea
                            name="address"
                            value={customer.address}
                            onChange={handleCustomerChange}
                            required
                            className="w-full border border-gray-200 p-4 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all h-32 font-medium"
                            placeholder="House Number, Street, Landmark..."
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 text-center">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-purple-600 text-white font-black text-lg rounded-2xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/30 flex items-center justify-center gap-3 active:scale-[0.98] transform disabled:opacity-70 disabled:active:scale-100"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-6 h-6 animate-spin" /> Processing...
                    </>
                ) : (
                    <>
                        <MapPin className="w-6 h-6" /> {session?.user?.id ? "Share GPS & Request Service" : "Log In to Request Service"}
                    </>
                )}
            </button>
            <p className="text-xs text-center text-gray-400 font-medium">
                We require your GPS location to provide accurate service. Your browser will
                prompt for permission.
            </p>
        </form>
    );
}
