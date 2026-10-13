import { useState, type FormEvent } from 'react';
import { FORMAT_ICONS } from '@/components/collection/FormatBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { OfflineHint } from '@/components/ui/offline-hint';
import {
  COLLECTION_FORMATS,
  FORMAT_LABELS,
  FORMAT_VOLUMES,
  type CollectionFormat,
} from '@/constants/collection';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { formatVolume, volumeToInput } from '@/lib/collectionFormat';
import { cn } from '@/lib/utils';
import { collectionDetailsSchema, parseVolumeInput } from '@/schemas/collectionDetails';
import type { PerfumeSummary } from '@/types/catalog';
import type { CollectionDetails } from '@/types/collection';

interface CollectionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfume: PerfumeSummary;
  // O que já está gravado (formato e volume nulos = "não informado")
  initial: CollectionDetails;
  onSave: (details: CollectionDetails) => void;
}

const INVALID_VOLUME = 'Informe um volume de até 1.000 ml, com no máximo uma casa decimal.';

interface BodyProps extends Pick<CollectionDetailsDialogProps, 'initial' | 'onSave'> {
  onDone: () => void;
}

function CollectionDetailsBody({ initial, onSave, onDone }: BodyProps) {
  const online = useOnlineStatus();
  const [format, setFormat] = useState<CollectionFormat | null>(initial.format);
  const [volumeText, setVolumeText] = useState(volumeToInput(initial.volumeMl));
  const [error, setError] = useState<string | undefined>();

  const volume = parseVolumeInput(volumeText);
  const hasDetails = initial.format !== null;

  const handleFormatChange = (next: CollectionFormat) => {
    // Os volumes sugeridos são de cada formato: trocar de formato recomeça o volume
    if (next !== format) setVolumeText('');
    setFormat(next);
    setError(undefined);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!online) return;
    if (Number.isNaN(volume)) {
      setError(INVALID_VOLUME);
      return;
    }
    const parsed = collectionDetailsSchema.safeParse({ format, volumeMl: volume });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? INVALID_VOLUME);
      return;
    }
    onSave(parsed.data);
    onDone();
  };

  const handleClear = () => {
    if (!online) return;
    onSave({ format: null, volumeMl: null });
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">Formato</legend>
        <div className="grid grid-cols-3 gap-2">
          {COLLECTION_FORMATS.map((option) => {
            const Icon = FORMAT_ICONS[option];
            return (
              <label
                key={option}
                className={cn(
                  'flex min-h-11 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border bg-card px-2 py-3 text-sm font-medium',
                  'has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring'
                )}
              >
                <input
                  type="radio"
                  name="format"
                  value={option}
                  checked={format === option}
                  onChange={() => handleFormatChange(option)}
                  className="sr-only"
                />
                <Icon className="size-5" aria-hidden />
                {FORMAT_LABELS[option]}
              </label>
            );
          })}
        </div>
      </fieldset>

      {format !== null && (
        <div className="grid gap-3">
          <div role="group" aria-label="Volume sugerido" className="flex flex-wrap gap-2">
            {FORMAT_VOLUMES[format].map((option) => {
              const selected = volume === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setVolumeText(volumeToInput(option));
                    setError(undefined);
                  }}
                  className={cn(
                    'inline-flex min-h-11 min-w-14 items-center justify-center rounded-full border px-4 text-sm font-medium outline-none',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent'
                  )}
                >
                  {formatVolume(option)}
                </button>
              );
            })}
          </div>
          <Field
            label="Outro volume (ml)"
            inputMode="decimal"
            autoComplete="off"
            value={volumeText}
            onChange={(event) => {
              setVolumeText(event.target.value);
              setError(undefined);
            }}
            error={error}
          />
        </div>
      )}
      {format === null && error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </DialogClose>
        {hasDetails && (
          <OfflineHint>
            <Button type="button" variant="outline" disabled={!online} onClick={handleClear}>
              Remover detalhes
            </Button>
          </OfflineHint>
        )}
        <OfflineHint>
          <Button type="submit" disabled={!online || format === null}>
            Salvar
          </Button>
        </OfflineHint>
      </DialogFooter>
    </form>
  );
}

// "Detalhar formato" (RN11): formato e volume de um perfume em "Tenho". Opcional: sem formato é
// "não informado". O corpo só monta com o diálogo aberto, então o estado recomeça a cada abertura.
export function CollectionDetailsDialog({
  open,
  onOpenChange,
  perfume,
  initial,
  onSave,
}: CollectionDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhar formato</DialogTitle>
          <DialogDescription>
            {perfume.name}, {perfume.brandName}. Frasco, decant ou amostra: é opcional.
          </DialogDescription>
        </DialogHeader>
        <CollectionDetailsBody
          initial={initial}
          onSave={onSave}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
