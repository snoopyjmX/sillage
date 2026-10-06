import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';
import type { PerfumeDetail } from '@/types/catalog';

const getBySlug = vi.fn();
vi.mock('@/services/perfumeService', () => ({
  perfumeService: {
    getBySlug: (slug: string) => getBySlug(slug),
    getSimilar: () => Promise.resolve([]),
  },
}));

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));

const getPerfumeReviews = vi.fn();
const getUserReview = vi.fn();
vi.mock('@/services/reviewService', () => ({
  reviewService: {
    getPerfumeReviews: (id: string) => getPerfumeReviews(id),
    getUserReview: (id: string) => getUserReview(id),
  },
}));

vi.mock('@/services/collectionService', () => ({
  collectionService: { list: () => Promise.resolve([]) },
}));

const detail: PerfumeDetail = {
  id: 'p1',
  slug: 'amyi-2-15',
  name: 'Amyi 2.15',
  description: 'Um perfume de teste.',
  brandName: 'Amyi',
  brandSlug: 'amyi',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: 2022,
  imageUrl: null,
  notes: [
    { slug: 'bergamota', name: 'Bergamota', family: 'citrus', position: 'top' },
    { slug: 'vetiver', name: 'Vetiver', family: 'woody', position: 'base' },
  ],
};

describe('página de detalhes do perfume', () => {
  beforeEach(() => {
    getBySlug.mockReset();
    auth.reset();
    auth.setInitialSession(null);
    getUserReview.mockReset();
    getUserReview.mockResolvedValue(null);
    getPerfumeReviews.mockReset();
    getPerfumeReviews.mockResolvedValue({
      summary: { count: 0, avgLongevity: null, avgProjection: null },
      reviews: [],
    });
  });

  it('mostra marca, nome, concentração, pirâmide e o CTA de coleção ativo', async () => {
    getBySlug.mockResolvedValue(detail);
    renderApp('/perfumes/amyi-2-15');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Amyi 2.15' }, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(getBySlug).toHaveBeenCalledWith('amyi-2-15');
    expect(screen.getByText('Amyi')).toBeInTheDocument();
    expect(screen.getByText('EDP')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Pirâmide olfativa' })).toBeInTheDocument();
    const cta = screen.getByRole('button', { name: /Adicionar à Coleção/ });
    expect(cta).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByText('Em breve')).not.toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Amyi 2.15 · Amyi · Sillage'));
  });

  it('slug inexistente mostra "Perfume não encontrado" com saída para o catálogo', async () => {
    getBySlug.mockImplementation(() => Promise.reject(new AppError('not_found')));
    renderApp('/perfumes/nao-existe');
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Perfume não encontrado', level: 3 },
        { timeout: 3000 }
      )
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Voltar ao catálogo' })[0]).toHaveAttribute(
      'href',
      '/catalog'
    );
    expect(getBySlug).toHaveBeenCalledTimes(1);
  });

  it('erro de rede mostra a mensagem amigável e tenta de novo pelo botão', async () => {
    getBySlug.mockImplementation(() => Promise.reject(new AppError('network')));
    renderApp('/perfumes/amyi-2-15');
    expect(await screen.findByRole('alert', {}, { timeout: 3000 })).toHaveTextContent(
      'Sem conexão com o servidor'
    );
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });

  describe('avaliações', () => {
    const community = {
      summary: { count: 2, avgLongevity: 3, avgProjection: 4 },
      reviews: [
        {
          id: 'r1',
          longevity: 4,
          projection: 5,
          comment: 'Dura o dia todo',
          authorName: 'Ana',
          createdAt: '2026-10-06T12:00:00Z',
        },
        {
          id: 'r2',
          longevity: 2,
          projection: 3,
          comment: null,
          authorName: 'Bruno',
          createdAt: '2026-10-05T12:00:00Z',
        },
      ],
    };

    it('mostra a média e a contagem no topo e a lista da comunidade abaixo da pirâmide', async () => {
      getBySlug.mockResolvedValue(detail);
      getPerfumeReviews.mockResolvedValue(community);
      renderApp('/perfumes/amyi-2-15');
      expect(
        (await screen.findAllByText('2 avaliações', { exact: false }, { timeout: 3000 })).length
      ).toBeGreaterThan(0);
      expect(screen.getByRole('img', { name: 'Nota média: 3,5 de 5' })).toBeInTheDocument();

      const section = await screen.findByRole('region', { name: 'Avaliações da comunidade' });
      const list = within(section).getByRole('list', { name: 'Avaliações' });
      expect(within(list).getByRole('heading', { name: 'Ana' })).toBeInTheDocument();
      expect(within(list).getByText('Dura o dia todo')).toBeInTheDocument();
      expect(within(list).getByRole('heading', { name: 'Bruno' })).toBeInTheDocument();
      expect(getPerfumeReviews).toHaveBeenCalledWith('p1');
    });

    it('sem avaliações: "Ainda sem avaliações" e o estado vazio da seção', async () => {
      getBySlug.mockResolvedValue(detail);
      renderApp('/perfumes/amyi-2-15');
      expect(
        await screen.findByText('Ainda sem avaliações.', {}, { timeout: 3000 })
      ).toBeInTheDocument();
      expect(await screen.findByText('Ainda não há avaliações')).toBeInTheDocument();
    });

    it('visitante que clica em "Avaliar fragrância" vai para o login com ?redirect=', async () => {
      getBySlug.mockResolvedValue(detail);
      const { router } = renderApp('/perfumes/amyi-2-15');
      fireEvent.click(
        await screen.findByRole('button', { name: 'Avaliar fragrância' }, { timeout: 3000 })
      );
      await waitFor(() =>
        expect(router.state.location.pathname + router.state.location.search).toBe(
          '/login?redirect=%2Fperfumes%2Famyi-2-15'
        )
      );
    });

    it('logado abre o formulário; com avaliação própria o botão vira "Editar" e vem preenchido', async () => {
      auth.setInitialSession(fakeSession());
      getBySlug.mockResolvedValue(detail);
      getUserReview.mockResolvedValue({
        id: 'r9',
        perfumeId: 'p1',
        longevity: 2,
        projection: 3,
        comment: 'meu comentário',
        updatedAt: '2026-10-06T12:00:00Z',
      });
      renderApp('/perfumes/amyi-2-15');
      fireEvent.click(
        await screen.findByRole('button', { name: 'Editar minha avaliação' }, { timeout: 3000 })
      );
      const form = await screen.findByRole('button', { name: 'Salvar alterações' });
      expect(form).toBeInTheDocument();
      expect(screen.getByLabelText('Comentário (opcional)')).toHaveValue('meu comentário');
    });
  });
});
