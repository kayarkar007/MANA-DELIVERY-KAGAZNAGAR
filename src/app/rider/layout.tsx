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

    if (!session || !["rider", "admin"].includes(session.user.role)) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
            {children}
        </div>
    );
}

