import { Download, Share2 } from 'lucide-react';
import { useState } from 'react';
import { AsyncBoundary } from '@/components/ui/async-boundary';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AppError, getErrorMessage } from '@/constants/errors';
import { SHARE_CARD_EXTENSION, SHARE_CARD_MIME, SHARE_CITY_STORAGE_KEY } from '@/constants/share';
import { useShareCard } from '@/hooks/useShareCard';
import { toast } from '@/lib/toast';
import { cityFromLabel, readStoredShareCity, storeShareCity } from '@/lib/sotdCard';
import { DEVICE_LOCATION_LABEL } from '@/hooks/useWeather';
import type { DailyEntry } from '@/types/daily';
import type { WeatherView } from '@/types/weather';

// Mesma altura da prévia e do skeleton, na proporção 9:16 do card
const PREVIEW_SIZE = 'mx-auto aspect-[9/16] h-[min(60dvh,32rem)] rounded-xl border';

interface ShareCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: DailyEntry;
  weather: WeatherView;
}

function ShareCardBody({ entry, weather }: Pick<ShareCardDialogProps, 'entry' | 'weather'>) {
  const [showCity, setShowCity] = useState(() => readStoredShareCity(SHARE_CITY_STORAGE_KEY));
  const card = useShareCard({ entry, weather, showCity, enabled: true });
  const { perfume } = entry;

  const hasCity =
    weather.status === 'ready' &&
    cityFromLabel(weather.location.label, DEVICE_LOCATION_LABEL) !== null;
  const filename = `sillage-${perfume.slug}-${entry.date}.${SHARE_CARD_EXTENSION}`;
  const file = card.data ? new File([card.data.blob], filename, { type: SHARE_CARD_MIME }) : null;
  const canShare =
    file !== null &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] });

  const handleCityChange = (checked: boolean) => {
    setShowCity(checked);
    storeShareCity(SHARE_CITY_STORAGE_KEY, checked);
  };

  const handleShare = async () => {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: `${perfume.name}, ${perfume.brandName}` });
    } catch (error) {
      // Fechar o painel de compartilhar não é erro
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        toast.error(getErrorMessage(new AppError('share_failed')));
      }
    }
  };

  const handleDownload = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <AsyncBoundary
        status={card.status}
        loading={
          <div role="status" aria-busy="true" aria-label="Gerando a imagem">
            <Skeleton className={PREVIEW_SIZE} />
          </div>
        }
        onRetry={() => void card.refetch()}
        errorTitle="Não foi possível gerar a imagem"
        errorDescription={getErrorMessage(card.error)}
        offlineDescription="Conecte-se à internet para gerar a imagem."
      >
        {card.data && (
          <img
            src={card.data.previewUrl}
            alt={`Card do Perfume do Dia: ${perfume.name}, ${perfume.brandName}`}
            width={1080}
            height={1920}
            className={`${PREVIEW_SIZE} w-auto object-contain`}
          />
        )}
      </AsyncBoundary>

      {hasCity && (
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={showCity}
            onChange={(event) => handleCityChange(event.target.checked)}
            className="size-5 accent-primary"
          />
          Mostrar a cidade
        </label>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {canShare && (
          <Button onClick={() => void handleShare()}>
            <Share2 aria-hidden />
            Compartilhar
          </Button>
        )}
        <Button
          variant={canShare ? 'outline' : 'default'}
          onClick={handleDownload}
          disabled={!file}
        >
          <Download aria-hidden />
          Baixar imagem
        </Button>
      </div>
    </>
  );
}

// Diálogo do card SOTD: prévia (a própria imagem gerada), "Mostrar a cidade" (D5) e as ações.
// O corpo só monta com o diálogo aberto, então nada é gerado antes do pedido.
export function ShareCardDialog({ open, onOpenChange, entry, weather }: ShareCardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-dvh overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar o seu dia</DialogTitle>
          <DialogDescription>Uma imagem para os stories, gerada no seu aparelho.</DialogDescription>
        </DialogHeader>
        <ShareCardBody entry={entry} weather={weather} />
      </DialogContent>
    </Dialog>
  );
}
