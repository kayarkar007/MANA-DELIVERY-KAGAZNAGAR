import type { ReactNode } from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function CheckoutLayout({ children }: { children: ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/login");
    }

    return children;
}
