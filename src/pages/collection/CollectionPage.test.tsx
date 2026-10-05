import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';
import type { PerfumeSummary } from '@/types/catalog';
import type { CollectionItem } from '@/types/collection';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));
const list = vi.fn();
vi.mock('@/services/collectionService', () => ({
  collectionService: { list: () => list() },
}));

const perfume = (id: string, name: string): PerfumeSummary => ({
  id,
  slug: id,
  name,
  brandName: 'Amyi',
  brandSlug: 'amyi',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: 2022,
  imagePath: null,
  families: ['citrus'],
});

const entry = (status: CollectionItem['status'], id: string, name: string): CollectionItem => ({
  status,
  updatedAt: '2026-10-05T12:00:00Z',
  perfume: perfume(id, name),
});

describe('CollectionPage', () => {
  beforeEach(() => {
    auth.reset();
    list.mockReset();
    auth.setInitialSession(fakeSession());
  });

  it('mostra a contagem real nas abas e só os perfumes da aba ativa', async () => {
    list.mockResolvedValue([
      entry('owned', 'a', 'Alfa'),
      entry('wanted', 'b', 'Beta'),
      entry('wanted', 'c', 'Gama'),
    ]);
    renderApp('/collection');
    expect(await screen.findByRole('tab', { name: 'Tenho (1)' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: 'Quero (2)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Alfa' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Beta' })).not.toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Quero (2)' }));
    const panel = await screen.findByRole('tabpanel');
    expect(within(panel).getAllByRole('article')).toHaveLength(2);
    expect(within(panel).getByRole('heading', { level: 2, name: 'Beta' })).toBeInTheDocument();
  });

  it('coleção vazia mostra o estado vazio com link para o catálogo', async () => {
    list.mockResolvedValue([]);
    renderApp('/collection');
    expect(
      await screen.findByRole('heading', { name: 'Sua coleção está vazia' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar o catálogo' })).toHaveAttribute(
      'href',
      '/catalog'
    );
    expect(screen.getByRole('tab', { name: 'Tenho (0)' })).toBeInTheDocument();
  });

  it('aba sem itens, com a outra preenchida, explica qual está vazia', async () => {
    list.mockResolvedValue([entry('wanted', 'b', 'Beta')]);
    renderApp('/collection');
    expect(
      await screen.findByRole('heading', { name: 'Nenhum perfume em “Tenho”' })
    ).toBeInTheDocument();
  });

  it('erro mostra mensagem amigável e tenta de novo pelo botão', async () => {
    list.mockRejectedValueOnce(new AppError('collection_failed'));
    renderApp('/collection');
    expect(await screen.findByText(/Não foi possível atualizar sua coleção/)).toBeInTheDocument();
    list.mockResolvedValue([]);
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByRole('heading', { name: 'Sua coleção está vazia' })
    ).toBeInTheDocument();
  });

  it('visitante é levado ao login com ?redirect=/collection', async () => {
    auth.setInitialSession(null);
    const { router } = renderApp('/collection');
    await screen.findByRole('heading', { name: 'Entrar', level: 1 });
    expect(router.state.location.search).toBe('?redirect=%2Fcollection');
    expect(list).not.toHaveBeenCalled();
  });
});
