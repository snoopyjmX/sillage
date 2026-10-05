// Helper de testes: renderiza as rotas reais do app (memória), com QueryClient limpo.
import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { createQueryClient } from '@/lib/queryClient';
import { routes } from '@/routes/router';

export const renderApp = (initialPath: string) => {
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { retry: false } });
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  const utils = render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  );
  return { ...utils, router, client };
};
