import { Skeleton } from '@/components/ui/skeleton';

// Mesmas dimensões do PerfumeCard (proporção da imagem e alturas de linha), para não deslocar o layout.
export function PerfumeCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="mt-auto flex gap-1.5 pt-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>
      <div className="px-4 pb-4">
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}

const SKELETON_COUNT = 6;

export function PerfumeGridSkeleton() {
  return (
    <ul
      aria-busy="true"
      aria-label="Carregando perfumes"
      className="grid grid-cols-1 gap-4 min-[30rem]:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <li key={index}>
          <PerfumeCardSkeleton />
        </li>
      ))}
    </ul>
  );
}
