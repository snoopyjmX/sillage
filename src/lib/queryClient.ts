import { QueryClient } from '@tanstack/react-query';

const ONE_MINUTE = 60_000;

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: ONE_MINUTE,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

export const queryClient = createQueryClient();
