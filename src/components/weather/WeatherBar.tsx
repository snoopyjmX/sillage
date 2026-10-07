import {
  AlertCircle,
  CloudOff,
  Droplets,
  LocateFixed,
  MapPin,
  RotateCw,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Skeleton } from '@/components/ui/skeleton';
import { FAMILY_LABELS } from '@/constants/labels';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { formatInteger } from '@/lib/format';
import type { GeolocationStatus, WeatherView } from '@/types/weather';

interface LocationControls {
  supported: boolean;
  status: GeolocationStatus;
  error: string | null;
  request: () => void;
}

interface WeatherBarProps {
  view: WeatherView;
  location: LocationControls;
  onRetry: () => void;
}

function LocationButton({ location }: { location: LocationControls }) {
  if (!location.supported) return null;
  const requesting = location.status === 'requesting';
  return (
    <Button
      variant="outline"
      size="sm"
      className="min-h-11"
      onClick={location.request}
      aria-disabled={requesting}
      aria-busy={requesting}
    >
      <LocateFixed aria-hidden />
      {requesting ? 'Localizando…' : 'Usar minha localização'}
    </Button>
  );
}

const SHELL =
  'flex flex-col gap-4 rounded-xl border bg-card px-4 py-4 text-card-foreground shadow-subtle sm:px-6';

// Barra de clima no topo da Home. Só apresenta: tudo chega pronto por props.
export function WeatherBar({ view, location, onRetry }: WeatherBarProps) {
  const online = useOnlineStatus();

  if (view.status === 'loading') {
    return (
      <div role="status" aria-busy="true" aria-label="Carregando o clima" className={SHELL}>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-11 w-48" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (view.status !== 'ready') {
    const offline = !online;
    const Icon = offline ? WifiOff : CloudOff;
    const title = offline ? 'Você está offline' : 'Clima indisponível';
    const detail =
      view.status === 'error'
        ? view.message
        : offline
          ? 'Conecte-se à internet para ver o clima.'
          : 'Não encontramos o clima da sua cidade.';
    return (
      <section aria-label="Clima de hoje" className={SHELL}>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p className="flex items-center gap-2 text-sm">
            {view.status === 'error' ? (
              <AlertCircle className="size-5 text-error" aria-hidden />
            ) : (
              <Icon className="size-5 text-muted-foreground" aria-hidden />
            )}
            <span className="font-medium">{title}</span>
            <span className="text-muted-foreground">{detail}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {view.status === 'error' && (
              <Button variant="ghost" size="sm" onClick={onRetry}>
                <RotateCw aria-hidden />
                Tentar novamente
              </Button>
            )}
            <LocationButton location={location} />
          </div>
        </div>
        {location.error && (
          <p role="alert" className="text-sm text-error">
            {location.error}
          </p>
        )}
      </section>
    );
  }

  const { weather, location: place, description, phrase, families } = view;
  return (
    <section aria-label="Clima de hoje" className={SHELL}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <MapPin className="size-4 text-primary" aria-hidden />
          {place.label}
        </p>
        <LocationButton location={location} />
      </div>
      {location.error && (
        <p role="alert" className="text-sm text-error">
          {location.error}
        </p>
      )}
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span className="font-heading text-3xl leading-none font-medium sm:text-4xl">
          {formatInteger(Math.round(weather.temperature))}°C
        </span>
        <span className="text-sm text-muted-foreground">{description}</span>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Droplets className="size-4 self-center" aria-hidden />
          Umidade {formatInteger(Math.round(weather.humidity))}%
        </span>
      </div>
      <div className="flex flex-col gap-2 rounded-lg bg-accent/40 px-4 py-3">
        <p className="text-sm text-text-secondary">{phrase}</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Sillage recomendada
          </span>
          <ul aria-label="Famílias em destaque hoje" className="flex flex-wrap gap-1.5">
            {families.map((family) => (
              <li key={family}>
                <Chip family={family}>{FAMILY_LABELS[family]}</Chip>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
