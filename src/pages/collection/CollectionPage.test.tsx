import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { fakeSession } from '@/test/authMock';
import { closeCollectionDetails } from '@/lib/collectionDetailsStore';
import { renderApp } from '@/test/renderApp';
import type { PerfumeSummary } from '@/types/catalog';
import type { CollectionItem } from '@/types/collection';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));
const list = vi.fn();
const setDetails = vi.fn();
vi.mock('@/services/collectionService', () => ({
  collectionService: {
    list: () => list(),
    setDetails: (id: string, details: unknown) => setDetails(id, details),
  },
}));

const perfume = (id: string, name: string): PerfumeSummary => ({
  id,
  slug: id,
  name,
  brandName: 'O Boticário',
  brandSlug: 'o-boticario',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: 2022,
  imagePath: null,
  families: ['citrus'],
});

const entry = (status: CollectionItem['status'], id: string, name: string): CollectionItem => ({
  status,
  format: null,
  volumeMl: null,
  updatedAt: '2026-10-05T12:00:00Z',
  perfume: perfume(id, name),
});

describe('CollectionPage', () => {
  beforeEach(() => {
    auth.reset();
    list.mockReset();
    setDetails.mockReset();
    closeCollectionDetails();
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

  it('?tab=wanted abre a aba Quero e trocar de aba atualiza a URL', async () => {
    list.mockResolvedValue([entry('owned', 'a', 'Alfa'), entry('wanted', 'b', 'Beta')]);
    const { router } = renderApp('/collection?tab=wanted');
    expect(await screen.findByRole('tab', { name: 'Quero (1)' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Beta' })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Tenho (1)' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Quero (1)' }));
    await waitFor(() => expect(router.state.location.search).toBe('?tab=wanted'));
  });

  it('?tab inválido cai na aba Tenho', async () => {
    list.mockResolvedValue([entry('owned', 'a', 'Alfa')]);
    renderApp('/collection?tab=outra');
    expect(await screen.findByRole('tab', { name: 'Tenho (1)' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('busca por nome ou marca, sem acento, e limpa pelo estado sem resultado', async () => {
    list.mockResolvedValue([entry('owned', 'a', 'Lírio Essencial'), entry('owned', 'b', 'Malbec')]);
    renderApp('/collection');
    const search = await screen.findByRole('searchbox', {
      name: 'Buscar na coleção por nome ou marca',
    });
    fireEvent.change(search, { target: { value: 'lirio' } });
    expect(screen.getByRole('heading', { level: 2, name: 'Lírio Essencial' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Malbec' })).not.toBeInTheDocument();
    // A contagem da aba segue sendo a da coleção inteira
    expect(screen.getByRole('tab', { name: 'Tenho (2)' })).toBeInTheDocument();

    fireEvent.change(search, { target: { value: 'zzz' } });
    expect(screen.getByText('Nenhum resultado')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Limpar busca' }));
    expect(search).toHaveValue('');
    expect(screen.getByRole('heading', { level: 2, name: 'Malbec' })).toBeInTheDocument();
  });

  it('coleção vazia não mostra o campo de busca', async () => {
    list.mockResolvedValue([]);
    renderApp('/collection');
    expect(await screen.findByText('Sua coleção está vazia')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
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

  it('visitante é levado à Landing com ?redirect=/collection', async () => {
    auth.setInitialSession(null);
    const { router } = renderApp('/collection');
    await screen.findByRole('heading', { name: 'Descubra perfumes pelas suas notas', level: 1 });
    expect(router.state.location.pathname).toBe('/');
    expect(router.state.location.search).toBe('?redirect=%2Fcollection');
    expect(list).not.toHaveBeenCalled();
  });

  describe('formatos (RN11, Fase 17A)', () => {
    const withFormat = (
      id: string,
      name: string,
      format: CollectionItem['format'],
      volumeMl: number | null
    ): CollectionItem => ({ ...entry('owned', id, name), format, volumeMl });

    it('mostra o selo do formato em "Tenho" e nada quando não foi informado', async () => {
      list.mockResolvedValue([
        withFormat('a', 'Alfa', 'bottle', 100),
        withFormat('b', 'Beta', 'decant', 2.5),
        withFormat('c', 'Gama', null, null),
      ]);
      renderApp('/collection');
      expect(await screen.findByText('Frasco 100 ml')).toBeInTheDocument();
      expect(screen.getByText('Decant 2,5 ml')).toBeInTheDocument();
      expect(document.querySelectorAll('[data-slot="format-badge"]')).toHaveLength(2);
    });

    it('"Quero" não tem selo nem botão Detalhar', async () => {
      list.mockResolvedValue([entry('wanted', 'b', 'Beta')]);
      renderApp('/collection');
      fireEvent.mouseDown(await screen.findByRole('tab', { name: 'Quero (1)' }));
      await screen.findByRole('heading', { level: 2, name: 'Beta' });
      expect(screen.queryByRole('button', { name: /Detalhar/ })).not.toBeInTheDocument();
      expect(document.querySelector('[data-slot="format-badge"]')).toBeNull();
    });

    it('"Detalhar" abre o diálogo do perfume e salva formato e volume', async () => {
      list.mockResolvedValue([withFormat('a', 'Alfa', null, null)]);
      setDetails.mockResolvedValue(undefined);
      renderApp('/collection');
      fireEvent.click(await screen.findByRole('button', { name: 'Detalhar formato de Alfa' }));
      const dialog = await screen.findByRole('dialog', { name: 'Detalhar formato' });
      expect(within(dialog).getByText(/Alfa, O Boticário/)).toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole('radio', { name: 'Decant' }));
      fireEvent.click(within(dialog).getByRole('button', { name: '10 ml' }));
      fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));
      await waitFor(() =>
        expect(setDetails).toHaveBeenCalledWith('a', { format: 'decant', volumeMl: 10 })
      );
      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: 'Detalhar formato' })).not.toBeInTheDocument()
      );
    });
  });
});
