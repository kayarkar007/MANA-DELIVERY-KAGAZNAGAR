"use client";

import dynamic from "next/dynamic";

const AdminAnalyticsCharts = dynamic(
    () => import("@/components/admin/AdminAnalyticsCharts"),
    {
        ssr: false,
        loading: () => (
            <section className="grid gap-5 lg:grid-cols-2">
                {[0, 1].map((i) => (
                    <div
                        key={i}
                        className="app-card h-80 animate-pulse rounded-[2rem]"
                        aria-hidden="true"
                    />
                ))}
            </section>
        ),
    }
);

export default function AdminAnalyticsChartsWrapper() {
    return <AdminAnalyticsCharts />;
}
