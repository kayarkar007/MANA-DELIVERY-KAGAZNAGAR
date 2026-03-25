export default function Loading() {
    return (
        <div className="space-y-8">
            <div className="app-card-strong h-64 animate-pulse rounded-[2.5rem]" />
            <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="app-stat h-32 animate-pulse" />
                ))}
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="app-card h-80 animate-pulse rounded-[2.25rem]" />
                ))}
            </div>
        </div>
    );
}
