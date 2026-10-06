import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPriceCents } from '@/lib/format';
import type { PerfumeDetail } from '@/types/catalog';

// Só http(s): o link vem do banco e vira <a href>, então nada de javascript: ou data:
const isHttpUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
};

// Melhor preço encontrado e o link da loja. Sem preço ou sem link válido, não renderiza nada.
export function BestPrice({
  perfume,
}: {
  perfume: Pick<PerfumeDetail, 'name' | 'lowestPriceCents' | 'storeName' | 'storeUrl'>;
}) {
  const { lowestPriceCents, storeName, storeUrl } = perfume;
  if (lowestPriceCents === null || !storeUrl || !isHttpUrl(storeUrl)) return null;

  const store = storeName ?? new URL(storeUrl).hostname.replace(/^www\./, '');

  return (
    <section
      aria-labelledby="best-price-title"
      data-slot="best-price"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-subtle"
    >
      <div className="flex flex-col gap-1">
        <h2 id="best-price-title" className="text-sm font-medium text-muted-foreground">
          Melhor preço encontrado
        </h2>
        <p className="text-base text-secondary-foreground">
          <span className="font-heading text-2xl font-medium text-foreground">
            {formatPriceCents(lowestPriceCents)}
          </span>{' '}
          na {store}
        </p>
      </div>
      <Button asChild variant="outline" size="sm" className="self-start">
        <a href={storeUrl} target="_blank" rel="noopener noreferrer">
          Ver na loja
          <ExternalLink className="size-4" aria-hidden />
          <span className="sr-only">
            : {perfume.name} na {store} (abre em nova aba)
          </span>
        </a>
      </Button>
    </section>
  );
}
