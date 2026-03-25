export default function Skeleton({ className = "", ...props }) {
    return (
        <div
            className={`animate-pulse rounded-md bg-gray-200 ${className}`}
            {...props}
        />
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <Skeleton className="h-4 w-1/3 mb-4" />
            <Skeleton className="h-8 w-2/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    );
}

export function SkeletonTable({ rows = 5 }) {
    return (
        <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
            ))}
        </div>
    );
}
