import Link from "next/link";
import { TERMS_VERSION } from "@/lib/privacy";

export default function TermsPage() {
    return (
        <main className="mx-auto max-w-3xl px-5 py-12 text-slate-800 dark:text-slate-100">
            <Link href="/" className="text-sm font-bold text-red-600 hover:underline">← Back to Mana Delivery</Link>
            <h1 className="mt-6 text-3xl font-black">Terms of Service</h1>
            <p className="mt-2 text-sm text-slate-500">Effective 31 July 2026 · Version {TERMS_VERSION}</p>
            <div className="mt-8 space-y-7 text-sm leading-7 text-slate-700 dark:text-slate-300">
                <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">Using the service</h2><p>You must provide accurate account, contact, and delivery information and keep your login credentials private. You are responsible for activity performed through your account.</p></section>
                <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">Orders, availability, and delivery</h2><p>Product availability, prices, delivery times, and service areas can change. An order is subject to shop acceptance, payment verification where applicable, and safe delivery conditions. We may contact you about substitutions, fulfilment, or delivery issues.</p></section>
                <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">Payments and refunds</h2><p>Payment methods, refunds, cancellations, and wallet credits are governed by the order status and applicable law. Refund eligibility can depend on whether an order has been prepared, dispatched, or delivered.</p></section>
                <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">Prohibited conduct</h2><p>Do not misuse the platform, create fraudulent orders, interfere with delivery operations, attempt unauthorised access, or use the service in violation of law. We may restrict accounts that create safety, security, or legal risks.</p></section>
                <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">Questions</h2><p>Contact Mana Delivery support through the app for an order, account, refund, or terms-related issue.</p></section>
            </div>
        </main>
    );
}
