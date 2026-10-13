import { Skeleton } from '@/components/ui/skeleton';

// Mesmas dimensões do conteúdo da página de detalhes (hero, textos, CTA, forma da pirâmide, barra de famílias e três camadas),
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
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
        <Skeleton className="mx-auto aspect-[5/3] w-28 shrink-0 md:mx-0 md:w-44" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
