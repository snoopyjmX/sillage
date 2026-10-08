import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Mesmas dimensões do ReviewCard (cabeçalho, duas linhas de nota e comentário)
export function ReviewsSkeleton() {
  return (
    <ul
      aria-busy="true"
      aria-label="Carregando avaliações"
      className="grid grid-cols-1 gap-4 min-[40rem]:grid-cols-2"
    >
      {Array.from({ length: 2 }, (_, index) => (
        <li key={index}>
          <Card className="gap-3 p-4">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-10 w-full" />
          </Card>
        </li>
      ))}
    </ul>
  );
}
