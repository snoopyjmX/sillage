import { useMemo, useState, type ReactNode } from 'react';
import { NezContext, type NezDraft } from './nez-context';

export function NezProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [perfumeContext, setPerfumeContext] = useState<string | null>(null);
  const [draft, setDraft] = useState<NezDraft | null>(null);
  const value = useMemo(
    () => ({ open, setOpen, perfumeContext, setPerfumeContext, draft, setDraft }),
    [open, perfumeContext, draft]
  );
  return <NezContext.Provider value={value}>{children}</NezContext.Provider>;
}
