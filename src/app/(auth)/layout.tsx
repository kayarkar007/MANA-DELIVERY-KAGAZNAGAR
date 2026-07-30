import Image from "next/image";
import Link from "next/link";
import { Clock3, ShieldCheck, Wallet } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen overflow-x-hidden">
            {/* Background gradient */}
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(198,40,40,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(214,160,70,0.10),transparent_30%)] dark:opacity-100 opacity-40" />

            <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1fr_1fr] xl:grid-cols-[0.9fr_1.1fr]">

                {/* ── Left: Branding Panel (hidden on mobile/tablet) ────────────── */}
                <aside className="hidden lg:flex lg:flex-col overflow-hidden bg-[linear-gradient(135deg,#120507,#26090d_45%,#6d1016_82%,#d6a046_120%)] text-white px-8 py-10 xl:px-12 xl:py-14">
                    <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                            <Image src="/logo2.png" alt="Mana Delivery" width={32} height={32} className="object-contain" priority />
                        </div>
                        <div>
                            <p className="text-lg font-black uppercase tracking-[0.14em]">Mana Delivery</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">Hyperlocal · Kagaznagar</p>
                        </div>
                    </Link>

                    <div className="mt-auto space-y-7">
                        <div className="space-y-4">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em]">
                                ✦ Faster repeat ordering
                            </span>
                            <h2 className="text-3xl xl:text-4xl font-black leading-tight">
                                Clean onboarding,<br />smoother ordering,<br />stronger retention.
                            </h2>
                            <p className="text-sm leading-7 text-white/68 max-w-sm">
                                Users get a calmer first-run experience while the backend keeps wallet, order tracking, support, and rider coordination in sync.
                            </p>
                        </div>

                        <div className="grid gap-3">
                            {[
                                { title: "Quick reorders", copy: "Saved address and profile flows reduce friction.", icon: Clock3 },
                                { title: "Trusted fulfilment", copy: "Tracked riders, support tickets, and delivery PIN verification.", icon: ShieldCheck },
                                { title: "Wallet aware", copy: "Manual top-up flow and ledger keep payments transparent.", icon: Wallet },
                            ].map((item) => (
                                <div key={item.title} className="rounded-[1.5rem] border border-white/12 bg-white/8 p-4 xl:p-5 backdrop-blur-2xl">
                                    <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/12">
                                        <item.icon className="h-4 w-4" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-[0.18em]">{item.title}</p>
                                    <p className="mt-1.5 text-xs leading-5 text-white/62">{item.copy}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* ── Right: Form Panel ─────────────────────────────────────────── */}
                <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-8 lg:py-14">
                    {/* Mobile-only logo (shown above form when left panel is hidden) */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 lg:hidden">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                            <Image src="/logo2.png" alt="Mana Delivery" width={22} height={22} className="object-contain" />
                        </div>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-tight">Mana Delivery</span>
                    </div>

                    <div className="w-full max-w-sm sm:max-w-md mt-10 sm:mt-0">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
