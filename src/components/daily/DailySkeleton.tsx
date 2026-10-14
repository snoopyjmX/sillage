import { Skeleton } from '@/components/ui/skeleton';

// Mesmas dimensões do DailyHighlight e do DailyHistory, para não deslocar o layout.
export function DailySkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando o Perfume do Dia" className="flex flex-col gap-10">
      <div className="grid overflow-hidden rounded-2xl border bg-card shadow-floating md:grid-cols-2">
        <Skeleton className="h-48 w-full rounded-none sm:h-60 md:h-auto md:min-h-80" />
        <div className="flex flex-col justify-center gap-3 p-4 sm:p-6 md:p-10">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="flex gap-1.5">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 min-[30rem]:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <Skeleton className="size-16 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
