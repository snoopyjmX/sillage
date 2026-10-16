import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatInteger } from '@/lib/format';

interface StatCardProps {
  label: string;
  // Destino do atalho: o cartão inteiro é o link
  to: string;
  value: number;
  hint: string;
}

// `dl > div > dt + dd` continua válido: o link fica dentro do `dt` e se estende por cima do cartão
// inteiro (`after:absolute after:inset-0`), então o cartão todo é clicável.
const StatCard = ({ label, to, value, hint }: StatCardProps) => (
  <Card className="relative gap-1 p-4 shadow-subtle transition-colors hover:bg-accent">
    <dt className="text-sm font-medium text-muted-foreground">
      <Link
        to={to}
        className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
      >
        {label}
      </Link>
    </dt>
    <dd className="flex flex-col gap-1">
      <span className="font-heading text-3xl leading-tight font-medium text-foreground">
        {formatInteger(value)}
      </span>
      <span className="text-sm text-muted-foreground">{hint}</span>
    </dd>
  </Card>
);

export function ProfileStatsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando o resumo"
      className="grid gap-3 sm:grid-cols-3"
    >
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

interface ProfileStatsProps {
  owned: number;
  wanted: number;
  memorialDays: number;
}

// Cartões de resumo: números reais da coleção e do memorial, cada um como atalho para a tela
// correspondente. Só apresenta.
export function ProfileStats({ owned, wanted, memorialDays }: ProfileStatsProps) {
  return (
    <dl aria-label="Resumo" className="grid gap-3 sm:grid-cols-3">
      <StatCard
        label="Tenho"
        to="/collection"
        value={owned}
        hint={owned === 1 ? 'perfume' : 'perfumes'}
      />
      <StatCard
        label="Quero"
        to="/collection?tab=wanted"
        value={wanted}
        hint={wanted === 1 ? 'perfume' : 'perfumes'}
      />
      <StatCard
        label="No memorial"
        to="/memorial"
        value={memorialDays}
        hint={memorialDays === 1 ? 'dia registrado' : 'dias registrados'}
      />
    </dl>
  );
}
