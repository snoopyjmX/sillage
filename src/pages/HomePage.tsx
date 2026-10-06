import { CalendarHeart, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DailyHighlight } from '@/components/daily/DailyHighlight';
import { DailyHistory } from '@/components/daily/DailyHistory';
import { DailySkeleton } from '@/components/daily/DailySkeleton';
import { SeoHead } from '@/components/seo/SeoHead';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TypingAnimation } from '@/components/ui/typing-animation';
import { getErrorMessage } from '@/constants/errors';
import { useAuth } from '@/hooks/useAuth';
import { useDaily } from '@/hooks/useDaily';

const CatalogButton = () => (
  <Button asChild>
    <Link to="/catalog">Explorar o catálogo</Link>
  </Button>
);

function GuestInvite() {
  return (
    <EmptyState
      icon={CalendarHeart}
      title="Entre para ver o seu Perfume do Dia"
      description="Crie sua conta para escolher um perfume por dia e guardar o histórico."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/register">Criar conta</Link>
          </Button>
        </div>
      }
    />
  );
}

// Rota pública. A assinatura da tela é a digitação do título; o resto é calmo.
// O Perfume do Dia é privado (RLS de dono): visitante vê o convite, logado vê o dia e o histórico.
export default function HomePage() {
  const { status } = useAuth();
  const daily = useDaily();

  const authenticated = status === 'authenticated';
  const today = daily.data?.today ?? null;
  const history = daily.data?.history ?? [];

  return (
    <>
      <SeoHead
        title="Sillage"
        description="Descubra a fragrância de hoje e reveja os perfumes dos dias anteriores."
      />

      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-2 pt-4 md:pt-8">
          <h1 className="font-heading text-4xl leading-tight font-medium md:text-6xl">
            <TypingAnimation>Descubra a fragrância de hoje</TypingAnimation>
          </h1>
          <p className="max-w-xl text-base text-text-secondary">
            Um perfume por dia, no seu fuso, e o histórico de tudo que você já vestiu.
          </p>
        </header>

        {status === 'loading' ? (
          <DailySkeleton />
        ) : !authenticated ? (
          <GuestInvite />
        ) : (
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
                  Perfume de hoje
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

              <section aria-labelledby="historico" className="flex flex-col gap-4">
                <h2 id="historico" className="font-heading text-2xl font-medium">
                  Histórico
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
        )}
      </div>
    </>
  );
}
