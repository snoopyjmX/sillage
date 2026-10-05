import { createContext } from 'react';

export interface OverlayContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OverlayContext = createContext<OverlayContextValue | null>(null);
