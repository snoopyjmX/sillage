import { QueryClient } from '@tanstack/react-query';

const ONE_MINUTE = 60_000;
// `gcTime` precisa ser >= ao maxAge da persistência (src/lib/persist.ts), senão o cache restaurado é coletado
const SEVEN_DAYS = 7 * 24 * 60 * ONE_MINUTE;

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: ONE_MINUTE,
        gcTime: SEVEN_DAYS,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

export const queryClient = createQueryClient();
