"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, Heart, ArrowUpRight, ShoppingBag, Truck, Headphones } from "lucide-react";

const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/#categories" },
    { label: "Search Products", href: "/search" },
    { label: "My Orders", href: "/profile" },
    { label: "Wallet", href: "/profile/wallet" },
    { label: "Support Tickets", href: "/profile/tickets" },
];

const serviceLinks = [
    { label: "Grocery Delivery", href: "/grocery-delivery-kagaznagar" },
    { label: "Food Delivery", href: "/food-delivery-kagaznagar" },
    { label: "Medicine Delivery", href: "/medicine-delivery-kagaznagar" },
    { label: "Online Shopping", href: "/online-shopping-kagaznagar" },
];

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative mt-16 overflow-hidden sm:mt-24">
            {/* Top wave separator */}
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[color:var(--primary)] to-transparent opacity-30" />

            {/* Main footer content */}
            <div className="relative border-t border-[rgba(214,160,70,0.1)] bg-[rgba(8,3,5,0.95)] backdrop-blur-3xl dark:bg-[rgba(4,2,3,0.98)]">
                {/* Decorative glow */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-[rgba(198,40,40,0.08)] blur-[100px]" />
                    <div className="absolute -right-32 top-0 h-64 w-64 rounded-full bg-[rgba(214,160,70,0.06)] blur-[100px]" />
                </div>

                <div className="relative mx-auto max-w-7xl px-6 pb-8 pt-14 sm:px-8 sm:pt-16 lg:px-12">
                    {/* CTA Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-14 overflow-hidden rounded-[2rem] border border-[rgba(214,160,70,0.16)] bg-[linear-gradient(135deg,#120507,#26090d_45%,#6d1016_82%,#d6a046_122%)] p-8 text-white shadow-[0_28px_80px_rgba(0,0,0,0.4)] sm:mb-16 sm:p-10 lg:flex lg:items-center lg:justify-between"
                    >
                        <div className="space-y-3">
                            <h3 className="font-display text-2xl font-black tracking-tight sm:text-3xl">
                                Ready to order?
                            </h3>
                            <p className="max-w-md text-sm leading-7 text-white/70">
                                Get groceries, food, medicines & daily essentials delivered to your doorstep in Kagaznagar.
                            </p>
                        </div>
                        <Link
                            href="/#categories"
                            className="mt-6 inline-flex items-center gap-2 rounded-[1.2rem] bg-white px-7 py-4 text-xs font-black uppercase tracking-[0.18em] text-slate-900 shadow-xl transition-transform hover:-translate-y-0.5 lg:mt-0"
                        >
                            <ShoppingBag className="h-4 w-4" />
                            Start Shopping
                        </Link>
                    </motion.div>

                    {/* Footer grid */}
                    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                        {/* Brand column */}
                        <div className="space-y-6 sm:col-span-2 lg:col-span-1">
                            <div className="space-y-3">
                                <h2 className="font-display text-xl font-black uppercase tracking-[0.08em] text-white">
                                    Mana Delivery
                                </h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#caa898]">
                                    Hyperlocal essentials · Kagaznagar
                                </p>
                            </div>
                            <p className="max-w-xs text-sm leading-7 text-white/50">
                                Your trusted local delivery partner in Sirpur Kagaznagar. Fast, reliable, and always close to you.
                            </p>

                            {/* Feature pills */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { icon: Truck, label: "Same Day" },
                                    { icon: Headphones, label: "24/7 Support" },
                                    { icon: ShoppingBag, label: "Local Shops" },
                                ].map((item) => (
                                    <span
                                        key={item.label}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/60"
                                    >
                                        <item.icon className="h-3 w-3" />
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-5">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">
                                Quick Links
                            </h3>
                            <ul className="space-y-3">
                                {quickLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="group inline-flex items-center gap-2 text-sm font-semibold text-white/55 transition-colors hover:text-white"
                                        >
                                            <span className="h-1 w-1 rounded-full bg-white/20 transition-colors group-hover:bg-[color:var(--primary)]" />
                                            {link.label}
                                            <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Services */}
                        <div className="space-y-5">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">
                                Our Services
                            </h3>
                            <ul className="space-y-3">
                                {serviceLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="group inline-flex items-center gap-2 text-sm font-semibold text-white/55 transition-colors hover:text-white"
                                        >
                                            <span className="h-1 w-1 rounded-full bg-white/20 transition-colors group-hover:bg-[color:var(--accent)]" />
                                            {link.label}
                                            <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:opacity-100" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact */}
                        <div className="space-y-5">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40">
                                Get in Touch
                            </h3>
                            <ul className="space-y-4">
                                <li>
                                    <a
                                        href="tel:+919494378247"
                                        className="flex items-start gap-3 text-sm text-white/55 transition-colors hover:text-white"
                                    >
                                        <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--primary)]" />
                                        <span className="font-semibold">+91 9494378247</span>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://wa.me/919494378247"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-start gap-3 text-sm text-white/55 transition-colors hover:text-white"
                                    >
                                        <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        <span className="font-semibold">WhatsApp Support</span>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="mailto:manadelivery07@gmail.com"
                                        className="flex items-start gap-3 text-sm text-white/55 transition-colors hover:text-white"
                                    >
                                        <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                                        <span className="font-semibold">manadelivery07@gmail.com</span>
                                    </a>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-white/55">
                                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[color:var(--accent)]" />
                                    <span className="leading-6">
                                        3-1-313 Subhash Chandrabose Colony,<br />
                                        Sirpur Kagaznagar 504296
                                    </span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-white/55">
                                    <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-400" />
                                    <span>Daily: 7:00 AM – 10:00 PM</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 sm:flex-row">
                        <p className="flex items-center gap-1.5 text-xs text-white/30">
                            © {currentYear} Mana Delivery. Made with
                            <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                            in Kagaznagar
                        </p>
                        <div className="flex items-center gap-6">
                            <a
                                href="https://wa.me/919494378247"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/30 transition-colors hover:text-emerald-400"
                                aria-label="WhatsApp"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            </a>
                            <a
                                href="https://instagram.com/manadelivery"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/30 transition-colors hover:text-pink-400"
                                aria-label="Instagram"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
