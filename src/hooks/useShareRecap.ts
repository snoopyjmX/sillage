// Gera o card da retrospectiva no aparelho e o entrega: compartilhar (se o sistema permite) ou baixar.
// Mutation: cada clique gera de novo, e a imagem (Blob) nunca é persistida.
import { useMutation } from '@tanstack/react-query';
import { AppError, getErrorMessage } from '@/constants/errors';
import { SHARE_CARD_EXTENSION, SHARE_CARD_MIME } from '@/constants/share';
import { renderRecapCard } from '@/lib/recapCanvas';
import { buildRecapCardContent } from '@/lib/recapCard';
import { canShareFile, downloadFile, shareFile } from '@/lib/shareFile';
import { toast } from '@/lib/toast';
import type { AnnualRecap } from '@/types/recap';

export interface ShareRecapInput {
  recap: AnnualRecap;
  city: string | null;
}

export const useShareRecap = () =>
  useMutation({
    mutationFn: async ({ recap, city }: ShareRecapInput): Promise<void> => {
      let blob: Blob;
      try {
        blob = await renderRecapCard(buildRecapCardContent(recap, city));
      } catch (error) {
        throw error instanceof AppError
          ? error
          : new AppError('share_card_failed', { cause: error });
      }
      const file = new File([blob], `sillage-seu-ano-${recap.year}.${SHARE_CARD_EXTENSION}`, {
        type: SHARE_CARD_MIME,
      });
      if (!canShareFile(file)) {
        downloadFile(file);
        return;
      }
      try {
        await shareFile(file, `Seu ano em perfumes ${recap.year}`);
      } catch (error) {
        throw new AppError('share_failed', { cause: error });
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
