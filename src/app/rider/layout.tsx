import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Rider Dashboard | Localu",
    description: "Manage your delivery assignments.",
};

export default async function RiderLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    if (session.user.role !== "rider") {
        redirect(session.user.role === "admin" ? "/admin" : "/login");
    }

    return (
        <div className="app-shell min-h-screen text-gray-900 dark:text-gray-100 font-sans">
            <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[20rem] bg-[radial-gradient(circle_at_top,rgba(198,40,40,0.2),transparent_42%)]" />
            {children}
        </div>
    );
}

