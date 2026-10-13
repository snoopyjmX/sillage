import { ArrowLeft, Scale, SearchX } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CollectionToggle } from '@/components/collection/CollectionToggle';
import { ComparePicker } from '@/components/compare/ComparePicker';
import { ReviewActions } from '@/components/reviews/ReviewActions';
import { ReviewSummaryLine } from '@/components/reviews/ReviewSummaryLine';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import { BestPrice } from '@/components/perfume/BestPrice';
import { PerfumeAffinity } from '@/components/perfume/PerfumeAffinity';
import { SimilarPerfumes } from '@/components/perfume/SimilarPerfumes';
import { OlfactoryPyramid } from '@/components/perfume/OlfactoryPyramid';
import { PerfumeDetailsSkeleton } from '@/components/perfume/PerfumeDetailsSkeleton';
import { PerfumeImage } from '@/components/perfume/PerfumeImage';
import { PerfumePlaceholder } from '@/components/perfume/PerfumePlaceholder';
import { PerfumeStage } from '@/components/perfume/PerfumeStage';
import { SeoHead } from '@/components/seo/SeoHead';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { AppError, getErrorMessage } from '@/constants/errors';
import { CONCENTRATION_LABELS, FAMILIES, GENDER_LABELS } from '@/constants/labels';
import { useNezPerfumeContext } from '@/hooks/useNez';
import { usePerfumeDetail } from '@/hooks/usePerfumes';
import { buildPerfumeContext } from '@/lib/nez';
import { toPerfumeSummary } from '@/lib/perfume';
import { buildComparePath } from '@/schemas/compareSearch';
import type { PerfumeDetail } from '@/types/catalog';

const BackToCatalog = () => (
  <Link
    to="/catalog"
    className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg text-sm font-medium text-primary outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
  >
    <ArrowLeft className="size-4" aria-hidden />
    Voltar ao catálogo
  </Link>
);

const buildSeoDescription = (perfume: PerfumeDetail) => {
  if (perfume.description) return perfume.description;
  const names = perfume.notes.slice(0, 5).map((note) => note.name);
  const base = `${perfume.name}, ${CONCENTRATION_LABELS[perfume.concentration]} de ${perfume.brandName}.`;
  return names.length > 0 ? `${base} Notas: ${names.join(', ')}.` : base;
};

// Enquanto carrega (ou se falhar) os metadados são genéricos; com dados, vêm do perfume
function DetailsSeo({ perfume }: { perfume: PerfumeDetail | undefined }) {
  if (!perfume) {
    return (
      <SeoHead
        title="Perfume"
        description="Veja a pirâmide olfativa, as avaliações e perfumes parecidos."
      />
    );
  }
  return (
    <SeoHead
      title={`${perfume.name} · ${perfume.brandName}`}
      description={buildSeoDescription(perfume)}
      imageUrl={perfume.imageUrl}
      type="article"
    />
  );
}

function PerfumeNotFound() {
  return (
    <>
      <SeoHead
        title="Perfume não encontrado"
        description="Esse perfume não existe ou foi removido do catálogo."
      />
      <meta name="robots" content="noindex" />
      <h1 className="sr-only">Perfume não encontrado</h1>
      <EmptyState
        icon={SearchX}
        title="Perfume não encontrado"
        description="Esse perfume não existe ou foi removido do catálogo."
        action={
          <Button asChild>
            <Link to="/catalog">Voltar ao catálogo</Link>
          </Button>
        }
      />
    </>
  );
}

// A foto pode ainda não ter sido enviada ao Storage: se falhar ao carregar, cai no placeholder
function PerfumeHeroImage({
  perfume,
  mainFamily,
}: {
  perfume: PerfumeDetail;
  mainFamily: (typeof FAMILIES)[number] | undefined;
}) {
  return (
    <PerfumeStage className="aspect-[4/5] w-full">
      <PerfumeImage
        key={perfume.imageUrl}
        url={perfume.imageUrl}
        variant="large"
        sizes="(min-width: 768px) 40vw, 100vw"
        priority
        alt={`Frasco do perfume ${perfume.name}, ${perfume.brandName}`}
        width={800}
        height={1000}
        className="size-full object-contain"
        fallback={<PerfumePlaceholder family={mainFamily} showIcon className="size-full" />}
      />
    </PerfumeStage>
  );
}

function PerfumeDetails({ perfume }: { perfume: PerfumeDetail }) {
  const mainFamily = FAMILIES.find((family) =>
    perfume.notes.some((note) => note.family === family)
  );
  const meta = [GENDER_LABELS[perfume.gender], perfume.releaseYear?.toString()]
    .filter(Boolean)
    .join(' · ');
  useNezPerfumeContext(buildPerfumeContext(perfume));
  const navigate = useNavigate();
  const [comparing, setComparing] = useState(false);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-10">
        <div className="overflow-hidden rounded-xl border bg-card shadow-card">
          <PerfumeHeroImage perfume={perfume} mainFamily={mainFamily} />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
            {perfume.brandName}
          </p>
          <h1 className="font-heading text-3xl leading-tight font-medium md:text-5xl">
            {perfume.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Chip variant="concentration">{CONCENTRATION_LABELS[perfume.concentration]}</Chip>
            <span className="text-sm text-muted-foreground">{meta}</span>
          </div>
          {perfume.perfumer && (
            <p className="text-sm text-muted-foreground">Perfumista: {perfume.perfumer}</p>
          )}
          <ReviewSummaryLine perfumeId={perfume.id} />
          {perfume.description && (
            <p className="max-w-prose text-base text-secondary-foreground">{perfume.description}</p>
          )}
          <div className="mt-4 flex flex-col gap-2 md:max-w-72">
            <CollectionToggle perfume={toPerfumeSummary(perfume)} />
            <ReviewActions perfume={{ id: perfume.id, name: perfume.name }} />
            <Button variant="outline" onClick={() => setComparing(true)}>
              <Scale aria-hidden />
              Comparar com…
            </Button>
          </div>
          <div className="md:max-w-72">
            <BestPrice perfume={perfume} />
          </div>
        </div>
      </div>

      <section aria-labelledby="pyramid-title" className="flex flex-col gap-4">
        <h2 id="pyramid-title" className="text-center font-heading text-2xl font-medium">
          Pirâmide olfativa
        </h2>
        {perfume.notes.length > 0 ? (
          <OlfactoryPyramid notes={perfume.notes} />
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            As notas deste perfume ainda não foram cadastradas.
          </p>
        )}
      </section>

      <PerfumeAffinity perfumeId={perfume.id} notes={perfume.notes} />

      <ReviewsSection perfumeId={perfume.id} />

      <SimilarPerfumes perfumeId={perfume.id} />

      <ComparePicker
        open={comparing}
        onOpenChange={setComparing}
        excludeSlugs={[perfume.slug]}
        onPick={(other) => {
          setComparing(false);
          void navigate(buildComparePath({ a: perfume.slug, b: other.slug }));
        }}
      />
    </>
  );
}

export default function PerfumeDetailsPage() {
  const { slug = '' } = useParams();
  const detail = usePerfumeDetail(slug);
  const notFound = detail.error instanceof AppError && detail.error.code === 'not_found';

  return (
    <div className="flex flex-col gap-6">
      {!notFound && <DetailsSeo perfume={detail.data} />}
      <BackToCatalog />
      {notFound ? (
        <PerfumeNotFound />
      ) : (
        <AsyncBoundary
          status={detail.status}
          loading={<PerfumeDetailsSkeleton />}
          onRetry={() => void detail.refetch()}
          errorTitle="Não foi possível carregar o perfume"
          errorDescription={getErrorMessage(detail.error)}
          offlineDescription="Conecte-se à internet para ver este perfume."
        >
          {detail.data && (
            <div className="flex flex-col gap-10">
              <PerfumeDetails perfume={detail.data} />
            </div>
          )}
        </AsyncBoundary>
      )}
    </div>
  );
}
