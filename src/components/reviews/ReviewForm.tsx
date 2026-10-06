import { useId, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Rating } from '@/components/ui/rating';
import { SubmitButton } from '@/components/ui/submit-button';
import { Textarea } from '@/components/ui/textarea';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useDeleteReview, useUpsertReview } from '@/hooks/useReviews';
import { zodResolver } from '@/lib/zodResolver';
import { MAX_COMMENT_LENGTH, reviewSchema, type ReviewValues } from '@/schemas/review';
import type { UserReview } from '@/types/review';

interface ReviewFormProps {
  perfumeId: string;
  // Avaliação atual do usuário (edição); null = primeira avaliação
  existing: UserReview | null;
  // Chamado quando a avaliação foi salva ou removida (o contêiner fecha)
  onDone: () => void;
}

interface RatingFieldProps {
  label: string;
  hint: string;
  value: number | undefined;
  error: string | undefined;
  onChange: (value: number) => void;
}

// Fixação e projeção são grupos de rádios (RN05): setas, Home/End, alvos de 44 px (componente Rating)
function RatingField({ label, hint, value, error, onChange }: RatingFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-sm text-text-secondary">{hint}</span>
      <Rating label={label} value={value ?? null} onValueChange={onChange} showValue />
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function ReviewForm({ perfumeId, existing, onDone }: ReviewFormProps) {
  const commentId = useId();
  const online = useOnlineStatus();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const upsert = useUpsertReview(perfumeId);
  const remove = useDeleteReview(perfumeId);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewValues>({
    // Notas começam vazias numa primeira avaliação: o usuário precisa escolher
    defaultValues: {
      longevity: existing?.longevity,
      projection: existing?.projection,
      comment: existing?.comment ?? '',
    },
    resolver: zodResolver(reviewSchema),
  });

  const length = useWatch({ control, name: 'comment' }).length;
  const busy = upsert.isPending || remove.isPending;

  const onSubmit = handleSubmit((values) => upsert.mutate(values, { onSuccess: onDone }));
  const onDelete = () => remove.mutate(undefined, { onSuccess: onDone });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Controller
        control={control}
        name="longevity"
        render={({ field }) => (
          <RatingField
            label="Fixação"
            hint="Quanto tempo o perfume dura na pele."
            value={field.value}
            error={errors.longevity?.message}
            onChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="projection"
        render={({ field }) => (
          <RatingField
            label="Projeção"
            hint="Quanto o perfume se faz notar ao redor."
            value={field.value}
            error={errors.projection?.message}
            onChange={field.onChange}
          />
        )}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor={commentId} className="text-sm font-medium text-foreground">
          Comentário (opcional)
        </label>
        <Textarea
          id={commentId}
          maxLength={MAX_COMMENT_LENGTH + 100}
          aria-invalid={errors.comment ? true : undefined}
          aria-describedby={`${commentId}-hint`}
          {...register('comment')}
        />
        <p
          id={`${commentId}-hint`}
          className={`text-sm ${errors.comment ? 'text-error' : 'text-text-secondary'}`}
        >
          {errors.comment?.message ??
            `Sua avaliação e seu nome ficam visíveis a todos. ${length}/${MAX_COMMENT_LENGTH}`}
        </p>
      </div>

      {!online && (
        <p role="status" className="text-sm text-text-secondary">
          Você está offline. Conecte-se para enviar a avaliação.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SubmitButton
          loading={upsert.isPending}
          loadingLabel="Enviando…"
          aria-disabled={!online || busy || undefined}
          className="sm:order-2"
        >
          {existing ? 'Salvar alterações' : 'Enviar avaliação'}
        </SubmitButton>

        {existing &&
          (confirmingDelete ? (
            <div className="flex flex-wrap items-center gap-2 sm:order-1">
              <Button
                variant="destructive"
                onClick={onDelete}
                disabled={busy || !online}
                aria-busy={remove.isPending || undefined}
              >
                Sim, remover
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="sm:order-1"
              onClick={() => setConfirmingDelete(true)}
              disabled={busy}
            >
              Remover minha avaliação
            </Button>
          ))}
      </div>
    </form>
  );
}
