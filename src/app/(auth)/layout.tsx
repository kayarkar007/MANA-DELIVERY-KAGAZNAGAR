import Image from "next/image";
import Link from "next/link";
import { Clock3, ShieldCheck, Wallet } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen overflow-hidden px-3 py-6 sm:px-4 sm:py-8 md:px-6 md:py-10 lg:px-8 lg:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(198,40,40,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(214,160,70,0.12),transparent_26%)]" />
            <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
                <section className="hidden overflow-hidden rounded-[2.5rem] border border-[rgba(214,160,70,0.16)] bg-[linear-gradient(135deg,#120507,#26090d_45%,#6d1016_82%,#d6a046_120%)] p-10 text-white shadow-[0_30px_80px_rgba(0,0,0,0.36)] lg:flex lg:flex-col">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                            <Image src="/logo2.png" alt="Mana Delivery" width={34} height={34} className="object-contain" priority />
                        </div>
                        <div>
                            <p className="font-display text-xl font-black uppercase tracking-[0.14em]">Mana Delivery</p>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/60">Local delivery operating system</p>
                        </div>
                    </Link>

                    <div className="mt-auto space-y-8">
                        <div className="space-y-4">
                            <span className="app-kicker border-white/12 bg-white/10 text-white">Faster repeat ordering</span>
                            <h1 className="app-title text-5xl text-white">Clean onboarding, smoother ordering, stronger retention.</h1>
                            <p className="text-base leading-8 text-white/72">
                                Users get a calmer first-run experience while the backend keeps wallet, order tracking, support, and rider coordination in sync.
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {[
                                { title: "Quick reorders", copy: "Saved address and profile flows reduce friction.", icon: Clock3 },
                                { title: "Trusted fulfilment", copy: "Tracked riders, support tickets, and delivery PIN verification.", icon: ShieldCheck },
                                { title: "Wallet aware", copy: "Manual top-up flow and ledger keep payments transparent.", icon: Wallet },
                            ].map((item) => (
                                <div key={item.title} className="rounded-[1.65rem] border border-white/12 bg-white/10 p-5 backdrop-blur-2xl">
                                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <p className="text-sm font-black uppercase tracking-[0.18em]">{item.title}</p>
                                    <p className="mt-2 text-sm leading-6 text-white/68">{item.copy}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="flex items-center justify-center">
                    <div className="w-full max-w-md space-y-6 sm:space-y-8">
                        {children}
                    </div>
                </section>
            </div>
        </div>
    );
}
