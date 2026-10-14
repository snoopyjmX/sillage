import { ArrowLeft, Feather, Globe, SearchX } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { PerfumeGrid } from '@/components/perfume/PerfumeGrid';
import { PerfumerDetailsSkeleton } from '@/components/perfume/PerfumerDetailsSkeleton';
import { SeoHead } from '@/components/seo/SeoHead';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { AppError, getErrorMessage } from '@/constants/errors';
import { usePerfumer } from '@/hooks/usePerfumer';
import type { PerfumerDetail } from '@/types/catalog';

const BackToCatalog = () => (
  <Link
    to="/catalog"
    className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg text-sm font-medium text-primary outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
  >
    <ArrowLeft className="size-4" aria-hidden />
    Voltar ao catálogo
  </Link>
);

function PerfumerNotFound() {
  return (
    <>
      <SeoHead
        title="Perfumista não encontrado"
        description="Esse perfumista não existe ou foi removido do catálogo."
      />
      <meta name="robots" content="noindex" />
      <h1 className="sr-only">Perfumista não encontrado</h1>
      <EmptyState
        icon={SearchX}
        title="Perfumista não encontrado"
        description="Esse perfumista não existe ou foi removido do catálogo."
        action={
          <Button asChild>
            <Link to="/catalog">Voltar ao catálogo</Link>
          </Button>
        }
      />
    </>
  );
}

function PerfumerDetails({ perfumer }: { perfumer: PerfumerDetail }) {
  return (
    <>
      <SeoHead
        title={`${perfumer.name} · Perfumista`}
        description={
          perfumer.bio ?? `Fragrâncias criadas por ${perfumer.name} presentes no catálogo.`
        }
        type="article"
      />
      <header className="flex flex-col gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-medium tracking-wider text-muted-foreground uppercase">
          <Feather className="size-4" aria-hidden />
          Perfumista
        </p>
        <h1 className="font-heading text-3xl leading-tight font-medium md:text-5xl">
          {perfumer.name}
        </h1>
        {perfumer.country && (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="size-4" aria-hidden />
            {perfumer.country}
          </p>
        )}
        {perfumer.bio && (
          <p className="max-w-prose text-base text-secondary-foreground">{perfumer.bio}</p>
        )}
      </header>

      <section aria-labelledby="perfumer-perfumes-title" className="flex flex-col gap-4">
        <h2 id="perfumer-perfumes-title" className="font-heading text-2xl font-medium">
          Fragrâncias no catálogo
        </h2>
        {perfumer.perfumes.length > 0 ? (
          <PerfumeGrid perfumes={perfumer.perfumes} />
        ) : (
          <EmptyState
            icon={SearchX}
            title="Nenhuma fragrância por aqui ainda"
            description="Este perfumista ainda não tem perfumes no catálogo."
            action={
              <Button asChild>
                <Link to="/catalog">Explorar o catálogo</Link>
              </Button>
            }
          />
        )}
      </section>
    </>
  );
}

export default function PerfumerDetailsPage() {
  const { slug = '' } = useParams();
  const perfumer = usePerfumer(slug);
  const notFound = perfumer.error instanceof AppError && perfumer.error.code === 'not_found';

  return (
    <div className="flex flex-col gap-6">
      <BackToCatalog />
      {notFound ? (
        <PerfumerNotFound />
      ) : (
        <AsyncBoundary
          status={perfumer.status}
          loading={<PerfumerDetailsSkeleton />}
          onRetry={() => void perfumer.refetch()}
          errorTitle="Não foi possível carregar o perfumista"
          errorDescription={getErrorMessage(perfumer.error)}
          offlineDescription="Conecte-se à internet para ver este perfumista."
        >
          {perfumer.data && (
            <div className="flex flex-col gap-10">
              <PerfumerDetails perfumer={perfumer.data} />
            </div>
          )}
        </AsyncBoundary>
      )}
    </div>
  );
}
