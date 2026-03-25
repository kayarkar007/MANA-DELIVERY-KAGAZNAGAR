import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        redirect("/login");
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden font-sans selection:bg-red-200 dark:selection:bg-red-900">
            <AdminSidebar />

            {/* Main Content — pt-14 offsets mobile top bar, pb-20 offsets mobile bottom nav */}
            <main className="flex-1 overflow-y-auto pt-14 lg:pt-0 pb-20 lg:pb-0 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-12 relative">
                <div className="max-w-6xl mx-auto w-full">{children}</div>
            </main>
        </div>
    );
}

