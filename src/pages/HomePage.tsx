import { CalendarHeart, History, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DailyHighlight } from '@/components/daily/DailyHighlight';
import { DailyHistory } from '@/components/daily/DailyHistory';
import { DailySkeleton } from '@/components/daily/DailySkeleton';
import {
  DailySuggestionCard,
  DailySuggestionSkeleton,
} from '@/components/home/DailySuggestionCard';
import { FamilyExplorer } from '@/components/home/FamilyExplorer';
import { HomeHeader } from '@/components/home/HomeHeader';
import { RecentPerfumes } from '@/components/home/RecentPerfumes';
import { SimilarToToday } from '@/components/home/SimilarToToday';
import { SeoHead } from '@/components/seo/SeoHead';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { WeatherBar } from '@/components/weather/WeatherBar';
import { getErrorMessage } from '@/constants/errors';
import { useCollectionStatus } from '@/hooks/useCollection';
import { useDaily, useWearToday } from '@/hooks/useDaily';
import { useDailySuggestion } from '@/hooks/useDailySuggestion';
import { useProfileTimezone } from '@/hooks/useProfileTimezone';
import { useWeather } from '@/hooks/useWeather';
import { formatMonthYear } from '@/lib/format';
import { getBrowserTimezone, todayInTimezone } from '@/lib/timezone';

const CatalogButton = () => (
  <Button asChild>
    <Link to="/catalog">Explorar o catálogo</Link>
  </Button>
);

// Home do logado (a rota "/" mostra a Landing para visitante: ver routes/RootEntry). A assinatura
// da tela é a digitação do título; o resto é calmo. Clima, sugestão e Perfume do Dia dependem do
// perfil (RLS de dono).
export default function HomePage() {
  const daily = useDaily();
  const weather = useWeather();
  const suggestion = useDailySuggestion(weather.view);
  const wear = useWearToday();
  const timezone = useProfileTimezone().data ?? getBrowserTimezone();

  const today = daily.data?.today ?? null;
  const history = daily.data?.history ?? [];
  const suggested = suggestion.data ?? null;
  const isSuggestedOwned = useCollectionStatus(suggested?.perfume.id ?? '') === 'owned';

  return (
    <>
      <SeoHead
        title="Sillage"
        description="Descubra a fragrância de hoje e reveja os perfumes dos dias anteriores."
      />

      <div className="flex flex-col gap-10">
        <WeatherBar view={weather.view} location={weather.location} onRetry={weather.retry} />

        <HomeHeader edition={formatMonthYear(todayInTimezone(timezone))} />

        <>
          <section aria-label="Sugestão do dia" className="flex flex-col gap-4">
            <AsyncBoundary
              status={suggestion.status}
              isEmpty={suggested === null}
              loading={<DailySuggestionSkeleton />}
              empty={
                <EmptyState
                  icon={Sparkles}
                  title="Nenhuma sugestão por enquanto"
                  description="O catálogo ainda não tem perfumes para sugerir."
                  action={<CatalogButton />}
                />
              }
              onRetry={() => void suggestion.refetch()}
              errorTitle="Não foi possível carregar a sugestão do dia"
              errorDescription={getErrorMessage(suggestion.error)}
              offlineDescription="Conecte-se à internet para ver a sugestão do dia."
            >
              {suggested && (
                <DailySuggestionCard
                  suggestion={suggested}
                  isWornToday={today?.perfume.id === suggested.perfume.id}
                  isOwned={isSuggestedOwned}
                  isWearing={wear.isPending}
                  onWear={() => wear.mutate(suggested.perfume.id)}
                />
              )}
            </AsyncBoundary>
          </section>

          <AsyncBoundary
            status={daily.status}
            isEmpty={today === null && history.length === 0}
            loading={<DailySkeleton />}
            empty={
              <EmptyState
                icon={CalendarHeart}
                title="Você ainda não escolheu um Perfume do Dia"
                description="Escolha um perfume do catálogo e ele aparece aqui, junto com o histórico."
                action={<CatalogButton />}
              />
            }
            onRetry={() => void daily.refetch()}
            errorTitle="Não foi possível carregar o Perfume do Dia"
            errorDescription={getErrorMessage(daily.error)}
            offlineDescription="Conecte-se à internet para ver o seu Perfume do Dia."
          >
            <div className="flex flex-col gap-10">
              <section aria-labelledby="hoje" className="flex flex-col gap-4">
                <h2 id="hoje" className="font-heading text-2xl font-medium">
                  Seu Perfume de hoje
                </h2>
                {today ? (
                  <DailyHighlight entry={today} />
                ) : (
                  <EmptyState
                    icon={CalendarHeart}
                    title="Hoje ainda não tem Perfume do Dia"
                    description="Escolha o de hoje no catálogo."
                    action={<CatalogButton />}
                  />
                )}
              </section>

              <section aria-labelledby="memorial" className="flex flex-col gap-4">
                <h2 id="memorial" className="font-heading text-2xl font-medium">
                  Memorial
                </h2>
                {history.length > 0 ? (
                  <DailyHistory entries={history} />
                ) : (
                  <EmptyState
                    icon={History}
                    title="Seu histórico ainda está vazio"
                    description="Os perfumes dos dias anteriores aparecem aqui."
                  />
                )}
              </section>
            </div>
          </AsyncBoundary>
        </>

        <RecentPerfumes />
        <SimilarToToday perfumeId={today?.perfume.id ?? null} />
        <FamilyExplorer />
      </div>
    </>
  );
}
