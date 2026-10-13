import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthStatus } from '@/contexts/auth-context';
import { fakeSession } from '@/test/authMock';
import type { PerfumeSummary } from '@/types/catalog';
import type { CollectionItem, CollectionStatus } from '@/types/collection';
import { CollectionToggle } from './CollectionToggle';

const list = vi.fn();
const setStatus = vi.fn();
const remove = vi.fn();
vi.mock('@/services/collectionService', () => ({
  collectionService: {
    list: () => list(),
    setStatus: (id: string, status: string) => setStatus(id, status),
    remove: (id: string) => remove(id),
  },
}));
const toastSuccess = vi.fn();
vi.mock('@/lib/toast', () => ({
  toast: { success: (m: string) => toastSuccess(m), error: vi.fn() },
}));

const perfume: PerfumeSummary = {
  id: 'p1',
  slug: 'malbec-signature',
  name: 'Malbec Signature',
  brandName: 'O Boticário',
  brandSlug: 'o-boticario',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: 2022,
  imagePath: null,
  families: [],
};

const items = (status: CollectionStatus | null): CollectionItem[] =>
  status ? [{ status, format: null, volumeMl: null, updatedAt: '2026-01-01', perfume }] : [];

const Where = () => <p data-testid="where">{useLocation().pathname + useLocation().search}</p>;

const renderToggle = (authStatus: AuthStatus, start = '/perfumes/malbec-signature?x=1') => {
  const session = authStatus === 'authenticated' ? fakeSession() : null;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <AuthContext.Provider value={{ status: authStatus, session, user: session?.user ?? null }}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[start]}>
          <Routes>
            <Route path="*" element={<CollectionToggle perfume={perfume} />} />
          </Routes>
          <Where />
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
};

const openMenu = (name: RegExp) =>
  fireEvent.keyDown(screen.getByRole('button', { name }), { key: 'Enter' });

describe('CollectionToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setStatus.mockResolvedValue(undefined);
    remove.mockResolvedValue(undefined);
  });

  it('visitante: o clique leva ao login com o ?redirect= da página atual, sem abrir menu', () => {
    renderToggle('unauthenticated');
    fireEvent.click(screen.getByRole('button', { name: /Adicionar à Coleção/ }));
    expect(screen.getByTestId('where')).toHaveTextContent(
      '/login?redirect=%2Fperfumes%2Fmalbec-signature%3Fx%3D1'
    );
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(list).not.toHaveBeenCalled();
  });

  it('sessão ainda carregando: botão indisponível', () => {
    renderToggle('loading');
    expect(screen.getByRole('button', { name: /Adicionar à Coleção/ })).toBeDisabled();
  });

  it('logado sem o perfume: o menu oferece Tenho e Quero, sem Remover', async () => {
    list.mockResolvedValue(items(null));
    renderToggle('authenticated');
    openMenu(/Adicionar à Coleção/);
    expect(await screen.findByRole('menuitemradio', { name: 'Tenho' })).toHaveAttribute(
      'aria-checked',
      'false'
    );
    expect(screen.getByRole('menuitemradio', { name: 'Quero' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Remover/ })).not.toBeInTheDocument();
  });

  it('escolher Quero grava o estado e avisa por toast', async () => {
    list.mockResolvedValue(items(null));
    renderToggle('authenticated');
    openMenu(/Adicionar à Coleção/);
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Quero' }));
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith('p1', 'wanted'));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('Malbec Signature foi para “Quero”.')
    );
  });

  it('já em Quero: o botão mostra o estado, o item fica marcado e há Remover', async () => {
    list.mockResolvedValue(items('wanted'));
    renderToggle('authenticated');
    const trigger = await screen.findByRole('button', { name: /Quero/ });
    openMenu(/Quero/);
    expect(await screen.findByRole('menuitemradio', { name: 'Quero' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Tenho' }));
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith('p1', 'owned'));
    expect(trigger).toBeInTheDocument();
  });

  it('Remover da coleção chama o serviço e avisa', async () => {
    list.mockResolvedValue(items('owned'));
    renderToggle('authenticated');
    await screen.findByRole('button', { name: /Tenho/ });
    openMenu(/Tenho/);
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Remover da coleção' }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('p1'));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith('Malbec Signature saiu da sua coleção.')
    );
  });

  it('escolher o estado que já está marcado não faz nada', async () => {
    list.mockResolvedValue(items('owned'));
    renderToggle('authenticated');
    await screen.findByRole('button', { name: /Tenho/ });
    openMenu(/Tenho/);
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Tenho' }));
    expect(setStatus).not.toHaveBeenCalled();
  });
});
