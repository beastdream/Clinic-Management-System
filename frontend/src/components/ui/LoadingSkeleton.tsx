import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/80', className)}
      {...props}
    />
  );
}

export function LoadingCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="grid grid-cols-2 gap-4 pt-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
