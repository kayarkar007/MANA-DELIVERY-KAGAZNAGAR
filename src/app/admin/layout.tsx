import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        redirect("/login");
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[24rem] bg-[radial-gradient(circle_at_top,rgba(198,40,40,0.2),transparent_42%)]" />
            <AdminSidebar />
            <main className="relative flex-1 overflow-y-auto pb-20 pt-14 lg:pb-0 lg:pt-0">
                <div className="mx-auto w-full max-w-7xl p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
