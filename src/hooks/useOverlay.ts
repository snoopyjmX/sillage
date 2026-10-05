import { useContext } from 'react';
import { OverlayContext, type OverlayContextValue } from '@/lib/overlay-context';

export const useOverlay = (): OverlayContextValue => {
  const context = useContext(OverlayContext);
  if (!context) throw new Error('Conteúdo de Dialog/Drawer precisa estar dentro do seu Root');
  return context;
};
