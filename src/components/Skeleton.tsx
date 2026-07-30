import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80",
        className
      )}
      {...props}
    />
  );
}

export function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 p-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70">
      <Skeleton className="aspect-[4/3] w-full rounded-[1.5rem]" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-1/3 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl p-3">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
