import { ArrowLeft, CalendarHeart, Compass } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { RecapSlides } from '@/components/recap/RecapSlides';
import { SeoHead } from '@/components/seo/SeoHead';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { RECAP_MIN_DAYS } from '@/constants/recap';
import { getErrorMessage } from '@/constants/errors';
import { useAnnualRecap } from '@/hooks/useAnnualRecap';
import { useProfileTimezone } from '@/hooks/useProfileTimezone';
import { useShareRecap } from '@/hooks/useShareRecap';
import { cityFromTimezone } from '@/lib/location';
import { isRecapTooEarly, parseRecapYear, yearOf } from '@/lib/recap';
import { DEFAULT_TIMEZONE, todayInTimezone } from '@/lib/timezone';

const BackToMemorial = () => (
  <Link
    to="/memorial"
    className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg text-sm font-medium text-primary outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
  >
    <ArrowLeft className="size-4" aria-hidden />
    Voltar ao Memorial
  </Link>
);

// Mesmas dimensões do carrossel: cartão da lâmina e a barra de navegação
function RecapSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando a retrospectiva"
      className="flex flex-col gap-4"
    >
      <Skeleton className="h-[28rem] w-full rounded-2xl" />
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-11 w-28" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-11 w-28" />
      </div>
    </div>
  );
}

function RecapUnavailable() {
  return (
    <>
      <SeoHead
        title="Retrospectiva indisponível"
        description="Esse ano não tem retrospectiva no Sillage."
      />
      <meta name="robots" content="noindex" />
      <h1 className="sr-only">Retrospectiva indisponível</h1>
      <EmptyState
        icon={Compass}
        title="Essa retrospectiva não existe"
        description="O Sillage montou retrospectivas a partir de 2026, até o ano de hoje."
        action={
          <Button asChild>
            <Link to="/memorial">Ver o Memorial</Link>
          </Button>
        }
      />
    </>
  );
}

// Rota privada (RequireAuth): `/recap/:year`. O ano vem da URL e é validado contra o ano de hoje no
// fuso do perfil; inválido é 404. Poucos dias vestidos mostram um estado vazio em vez de lâminas vazias.
export default function RecapPage() {
  const { year: yearParam } = useParams();
  const timezone = useProfileTimezone();
  const today = timezone.isPending ? null : todayInTimezone(timezone.data ?? DEFAULT_TIMEZONE);
  const year = today === null ? null : parseRecapYear(yearParam, yearOf(today));
  const invalid = today !== null && year === null;

  const recap = useAnnualRecap(year);
  const share = useShareRecap();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 pt-4 md:pt-8">
      <BackToMemorial />
      {invalid ? (
        <RecapUnavailable />
      ) : (
        <>
          <SeoHead
            title={`Seu ano em perfumes${year === null ? '' : ` · ${year}`}`}
            description="Os perfumes que marcaram o seu ano, estação por estação."
          />
          <header className="flex flex-col gap-1">
            <h1 className="font-heading text-3xl font-medium md:text-4xl">
              Seu ano em perfumes{year === null ? '' : ` · ${year}`}
            </h1>
            <p className="text-sm text-text-secondary">
              Um retrato do seu Memorial, em cinco lâminas.
            </p>
          </header>
          <AsyncBoundary
            status={year === null ? 'pending' : recap.status}
            isEmpty={recap.data ? isRecapTooEarly(recap.data) : false}
            loading={<RecapSkeleton />}
            empty={
              <EmptyState
                icon={CalendarHeart}
                title="Seu ano ainda está começando"
                description={`A retrospectiva aparece a partir de ${RECAP_MIN_DAYS} dias com perfume no Memorial. Escolha o seu Perfume do Dia e volte aqui.`}
                action={
                  <Button asChild>
                    <Link to="/">Escolher o perfume de hoje</Link>
                  </Button>
                }
              />
            }
            onRetry={() => void recap.refetch()}
            errorTitle="Não foi possível montar a retrospectiva"
            errorDescription={getErrorMessage(recap.error)}
            offlineDescription="Conecte-se à internet para ver a sua retrospectiva."
          >
            {recap.data && (
              <RecapSlides
                recap={recap.data}
                onShare={() =>
                  share.mutate({
                    recap: recap.data,
                    city: timezone.data ? cityFromTimezone(timezone.data) : null,
                  })
                }
                isSharing={share.isPending}
              />
            )}
          </AsyncBoundary>
        </>
      )}
    </div>
  );
}
