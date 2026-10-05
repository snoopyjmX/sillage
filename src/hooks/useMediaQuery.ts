import { useSyncExternalStore } from 'react';

// Sem matchMedia (ex.: jsdom) a consulta vale falso.
export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
    () => false
  );
