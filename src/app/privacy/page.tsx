import Link from "next/link";
import { PRIVACY_POLICY_VERSION } from "@/lib/privacy";

export default function PrivacyPage() {
    return (
        <main className="mx-auto max-w-3xl px-5 py-12 text-slate-800 dark:text-slate-100">
            <Link href="/" className="text-sm font-bold text-red-600 hover:underline">← Back to Mana Delivery</Link>
            <h1 className="mt-6 text-3xl font-black">Privacy Policy</h1>
            <p className="mt-2 text-sm text-slate-500">Effective 31 July 2026 · Version {PRIVACY_POLICY_VERSION}</p>
            <div className="mt-8 space-y-7 text-sm leading-7 text-slate-700 dark:text-slate-300">
                <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">Information we collect</h2><p>We collect account details, delivery addresses and contact details, order and payment references, support requests, and device or notification identifiers needed to operate the service. Location is used only when you choose delivery-location features.</p></section>
                <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">How we use it</h2><p>We use this information to create and secure accounts, process and deliver orders, handle payments and refunds, provide support, prevent fraud, and meet legal or accounting obligations. Optional marketing messages require your consent.</p></section>
                <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">Sharing and retention</h2><p>Order information may be shared with the shop and delivery rider needed to fulfil that order. Payment processing is handled by the selected payment provider. We keep records only for as long as needed for service, dispute, tax, accounting, fraud-prevention, or legal requirements.</p></section>
                <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">Your choices</h2><p>You can request a copy of your account data or request account deletion from an authenticated account. Deletion removes direct account and delivery identifiers where permitted; financial records may remain in de-identified form when required for accounting, fraud prevention, or law.</p></section>
                <section><h2 className="text-lg font-bold text-slate-900 dark:text-white">Contact</h2><p>For privacy questions or requests, contact Mana Delivery support using the support option in the app and include the email or phone number associated with your account.</p></section>
            </div>
        </main>
    );
}
