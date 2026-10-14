import { Skeleton } from '@/components/ui/skeleton';
import { PerfumeCardSkeleton } from './PerfumeCardSkeleton';

// Mesmas dimensões da página do perfumista (cabeçalho editorial e grade de cards)
export function PerfumerDetailsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando perfumista"
      className="flex flex-col gap-10"
      role="status"
    >
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-2/3 md:w-1/3" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-20 w-full max-w-prose" />
      </div>
      <div className="grid grid-cols-1 gap-4 min-[30rem]:grid-cols-2 xl:grid-cols-3">
        <PerfumeCardSkeleton />
        <PerfumeCardSkeleton />
        <PerfumeCardSkeleton />
      </div>
    </div>
  );
}
