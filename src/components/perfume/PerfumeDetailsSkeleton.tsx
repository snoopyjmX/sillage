import { Skeleton } from '@/components/ui/skeleton';

// Mesmas dimensões do conteúdo da página de detalhes (hero, textos, CTA e três camadas),
// para o layout não pular quando os dados chegam.
export function PerfumeDetailsSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando perfume"
      className="flex flex-col gap-10"
      role="status"
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10">
        <Skeleton className="aspect-[4/5] w-full rounded-xl" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="mt-2 h-20 w-full" />
          <Skeleton className="mt-4 h-11 w-full md:w-72" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-16 w-4/5 rounded-xl md:w-3/5" />
        <Skeleton className="h-16 w-9/10 rounded-xl md:w-4/5" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}
