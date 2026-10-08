// TODO: ocasionalmente flaky na suíte completa (passa isolado; já falhou também em árvore limpa).
// Hipótese, não confirmada: o import lazy a frio da rota sob carga. Investigar prefetch da rota ou
// um fallback explícito de Suspense no teste.
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
  slug: 'malbec-signature',
  name: 'Malbec Signature',
  description: 'Um perfume de teste.',
  brandName: 'O Boticário',
  brandSlug: 'o-boticario',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: 2022,
  imageUrl: null,
  lowestPriceCents: null,
  storeName: null,
  storeUrl: null,
  perfumer: null,
  notes: [
    { slug: 'bergamota', name: 'Bergamota', family: 'citrus', position: 'top' },
    { slug: 'vetiver', name: 'Vetiver', family: 'woody', position: 'base' },
  ],
};

describe('página de detalhes do perfume', () => {
  beforeEach(() => {
    getBySlug.mockReset();
    auth.reset();
    // O gate só libera a rota para quem tem sessão
    auth.setInitialSession(fakeSession());
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
    renderApp('/perfumes/malbec-signature');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Malbec Signature' }, { timeout: 5000 })
    ).toBeInTheDocument();
    expect(getBySlug).toHaveBeenCalledWith('malbec-signature');
    expect(screen.getByText('O Boticário')).toBeInTheDocument();
    expect(screen.getByText('EDP')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Pirâmide olfativa' })).toBeInTheDocument();
    const cta = screen.getByRole('button', { name: /Adicionar à Coleção/ });
    expect(cta).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByText('Em breve')).not.toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Malbec Signature · O Boticário — Sillage'));
  });

  it('mostra o perfumista só quando informado', async () => {
    getBySlug.mockResolvedValue({ ...detail, perfumer: 'Olivier Cresp' });
    renderApp('/perfumes/malbec-signature');
    expect(
      await screen.findByText('Perfumista: Olivier Cresp', {}, { timeout: 5000 })
    ).toBeInTheDocument();
  });

  it('não mostra a linha de perfumista quando é nulo', async () => {
    getBySlug.mockResolvedValue(detail);
    renderApp('/perfumes/malbec-signature');
    await screen.findByRole('heading', { level: 1 }, { timeout: 5000 });
    expect(screen.queryByText(/Perfumista:/)).not.toBeInTheDocument();
  });

  it('mostra o melhor preço com link externo seguro quando há oferta', async () => {
    getBySlug.mockResolvedValue({
      ...detail,
      lowestPriceCents: 24900,
      storeName: 'O Boticário',
      storeUrl: 'https://www.boticario.com.br',
    });
    renderApp('/perfumes/malbec-signature');
    const section = await screen.findByRole(
      'region',
      { name: 'Melhor preço encontrado' },
      { timeout: 5000 }
    );
    expect(section).toHaveTextContent(/R\$\s249,00\sna O Boticário/);
    const link = within(section).getByRole('link');
    expect(link).toHaveAttribute('href', 'https://www.boticario.com.br');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('omite a seção de preço quando não há oferta', async () => {
    getBySlug.mockResolvedValue(detail);
    renderApp('/perfumes/malbec-signature');
    await screen.findByRole('heading', { level: 1, name: 'Malbec Signature' }, { timeout: 5000 });
    expect(screen.queryByText('Melhor preço encontrado')).not.toBeInTheDocument();
  });

  it('cai no placeholder quando a foto ainda não existe no Storage', async () => {
    getBySlug.mockResolvedValue({ ...detail, imageUrl: 'https://cdn.test/ausente.webp' });
    renderApp('/perfumes/malbec-signature');
    const image = await screen.findByRole('img', { name: /Frasco do perfume/ }, { timeout: 5000 });
    fireEvent.error(image);
    await waitFor(() =>
      expect(screen.queryByRole('img', { name: /Frasco do perfume/ })).not.toBeInTheDocument()
    );
  });

  it('slug inexistente mostra "Perfume não encontrado" com saída para o catálogo', async () => {
    getBySlug.mockImplementation(() => Promise.reject(new AppError('not_found')));
    renderApp('/perfumes/nao-existe');
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Perfume não encontrado', level: 3 },
        { timeout: 5000 }
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
    renderApp('/perfumes/malbec-signature');
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent(
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
      renderApp('/perfumes/malbec-signature');
      expect(
        (await screen.findAllByText('2 avaliações', { exact: false }, { timeout: 5000 })).length
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
      renderApp('/perfumes/malbec-signature');
      expect(
        await screen.findByText('Ainda sem avaliações.', {}, { timeout: 5000 })
      ).toBeInTheDocument();
      expect(await screen.findByText('Ainda não há avaliações')).toBeInTheDocument();
    });

    it('visitante não chega aos detalhes: cai na Landing com ?redirect= e nada é consultado', async () => {
      auth.setInitialSession(null);
      getBySlug.mockResolvedValue(detail);
      const { router } = renderApp('/perfumes/malbec-signature');
      await screen.findByRole('heading', { name: 'Descubra perfumes pelas suas notas', level: 1 });
      expect(router.state.location.pathname + router.state.location.search).toBe(
        '/?redirect=%2Fperfumes%2Fmalbec-signature'
      );
      expect(screen.queryByText('Malbec Signature')).not.toBeInTheDocument();
      expect(getBySlug).not.toHaveBeenCalled();
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
      renderApp('/perfumes/malbec-signature');
      fireEvent.click(
        await screen.findByRole('button', { name: 'Editar minha avaliação' }, { timeout: 5000 })
      );
      const form = await screen.findByRole('button', { name: 'Salvar alterações' });
      expect(form).toBeInTheDocument();
      expect(screen.getByLabelText('Comentário (opcional)')).toHaveValue('meu comentário');
    });
  });
});
