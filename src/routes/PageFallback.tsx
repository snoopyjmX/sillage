import { PerfumeGridSkeleton } from '@/components/perfume/PerfumeCardSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

// Mostrado enquanto o chunk da página (lazy) carrega no primeiro acesso.
export function PageFallback() {
  return (
    <div aria-busy="true" className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-20">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-11 w-full" />
      <PerfumeGridSkeleton />
    </div>
  );
}
