export default function AdminLoading() {
    return (
        <div className="space-y-6">
            <div className="app-card-strong h-44 animate-pulse rounded-[2.25rem]" />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="app-stat h-32 animate-pulse" />
                ))}
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
                <div className="app-card h-72 animate-pulse rounded-[2rem]" />
                <div className="app-card h-72 animate-pulse rounded-[2rem]" />
            </div>
        </div>
    );
}
