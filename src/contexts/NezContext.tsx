import { useMemo, useState, type ReactNode } from 'react';
import { NezContext } from './nez-context';

export function NezProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [perfumeContext, setPerfumeContext] = useState<string | null>(null);
  const value = useMemo(
    () => ({ open, setOpen, perfumeContext, setPerfumeContext }),
    [open, perfumeContext]
  );
  return <NezContext.Provider value={value}>{children}</NezContext.Provider>;
}
