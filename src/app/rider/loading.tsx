export default function RiderLoading() {
    return (
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
            <div className="app-card h-20 animate-pulse rounded-[2rem]" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="app-stat h-28 animate-pulse" />
                ))}
            </div>
            <div className="app-card h-64 animate-pulse rounded-[2rem]" />
            <div className="app-card h-80 animate-pulse rounded-[2rem]" />
        </div>
    );
}
