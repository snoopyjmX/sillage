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
const searchPerfumes = vi.fn();
vi.mock('@/services/perfumeService', () => ({
  perfumeService: {
    getBySlug: (slug: string) => getBySlug(slug),
    search: (...args: unknown[]) => searchPerfumes(...args),
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

const listCollection = vi.fn();
vi.mock('@/services/collectionService', () => ({
  collectionService: { list: () => listCollection() },
}));

const getDna = vi.fn();
vi.mock('@/services/dnaService', () => ({ dnaService: { get: () => getDna() } }));

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
    { slug: 'bergamota', name: 'Bergamota', family: 'citrus', position: 'top', description: null },
    { slug: 'vetiver', name: 'Vetiver', family: 'woody', position: 'base', description: null },
  ],
};

// DNA: 60% amadeirado e 40% cítrico; as notas que mais aparecem são Vetiver e Bergamota
const dna = {
  families: [
    { family: 'woody', weight: 6 },
    { family: 'citrus', weight: 4 },
  ],
  topNotes: [
    { slug: 'vetiver', name: 'Vetiver', family: 'woody', weight: 5 },
    { slug: 'bergamota', name: 'Bergamota', family: 'citrus', weight: 4 },
  ],
  wishFamily: null,
  wantedCount: 0,
  perfumeCount: 5,
  memorialDays: 3,
};

describe('página de detalhes do perfume', () => {
  beforeEach(() => {
    getBySlug.mockReset();
    auth.reset();
    // O gate só libera a rota para quem tem sessão
    auth.setInitialSession(fakeSession());
    listCollection.mockReset();
    listCollection.mockResolvedValue([]);
    getDna.mockReset();
    getDna.mockResolvedValue(dna);
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
      await screen.findByRole('heading', { level: 1, name: 'Malbec Signature' }, { timeout: 8000 })
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
      await screen.findByText('Perfumista: Olivier Cresp', {}, { timeout: 8000 })
    ).toBeInTheDocument();
  });

  it('não mostra a linha de perfumista quando é nulo', async () => {
    getBySlug.mockResolvedValue(detail);
    renderApp('/perfumes/malbec-signature');
    await screen.findByRole('heading', { level: 1 }, { timeout: 8000 });
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
      { timeout: 8000 }
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
    await screen.findByRole('heading', { level: 1, name: 'Malbec Signature' }, { timeout: 8000 });
    expect(screen.queryByText('Melhor preço encontrado')).not.toBeInTheDocument();
  });

  it('cai no placeholder quando a foto ainda não existe no Storage', async () => {
    getBySlug.mockResolvedValue({ ...detail, imageUrl: 'https://cdn.test/ausente.webp' });
    renderApp('/perfumes/malbec-signature');
    const image = await screen.findByRole('img', { name: /Frasco do perfume/ }, { timeout: 8000 });
    // a variante large falha, depois o original: só então vem o placeholder
    fireEvent.error(image);
    fireEvent.error(screen.getByRole('img', { name: /Frasco do perfume/ }));
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
        { timeout: 8000 }
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
    expect(await screen.findByRole('alert', {}, { timeout: 8000 })).toHaveTextContent(
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
        (await screen.findAllByText('2 avaliações', { exact: false }, { timeout: 8000 })).length
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
        await screen.findByText('Ainda sem avaliações.', {}, { timeout: 8000 })
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
        await screen.findByRole('button', { name: 'Editar minha avaliação' }, { timeout: 8000 })
      );
      const form = await screen.findByRole('button', { name: 'Salvar alterações' });
      expect(form).toBeInTheDocument();
      expect(screen.getByLabelText('Comentário (opcional)')).toHaveValue('meu comentário');
    });
  });

  describe('Comparar com… (Fase 18B)', () => {
    const bossa = {
      id: 'p2',
      slug: 'bossa',
      name: 'Bossa',
      brandName: 'Marca X',
      brandSlug: 'marca-x',
      concentration: 'edp',
      gender: 'unisex',
      releaseYear: 2020,
      imagePath: null,
      families: ['woody'],
    };

    it('busca no catálogo, não oferece o próprio perfume e leva ao comparador', async () => {
      searchPerfumes.mockReset();
      searchPerfumes.mockResolvedValue({
        items: [{ ...bossa, id: 'p1', slug: 'malbec-signature', name: 'Malbec Signature' }, bossa],
        total: 2,
      });
      getBySlug.mockResolvedValue(detail);
      const { router } = renderApp('/perfumes/malbec-signature');
      fireEvent.click(await screen.findByRole('button', { name: 'Comparar com…' }));
      const dialog = await screen.findByRole('dialog', { name: 'Escolher perfume' });
      fireEvent.change(within(dialog).getByRole('searchbox'), { target: { value: 'bo' } });
      const results = await within(dialog).findByRole('list', { name: 'Resultados' });
      expect(
        within(results).queryByRole('button', { name: /Malbec Signature/ })
      ).not.toBeInTheDocument();
      fireEvent.click(within(results).getByRole('button', { name: /Bossa/ }));
      await waitFor(() =>
        expect(router.state.location.pathname + router.state.location.search).toBe(
          '/compare?a=malbec-signature&b=bossa'
        )
      );
    });
  });

  describe('Combina com você? (Fase 18A)', () => {
    const open = async () => {
      getBySlug.mockResolvedValue(detail);
      renderApp('/perfumes/malbec-signature');
      await screen.findByRole('heading', { level: 1, name: 'Malbec Signature' });
    };

    it('perfume com as notas do DNA: afinidade alta com os motivos e sem sugerir decant', async () => {
      await open();
      const section = await screen.findByRole('region', { name: 'Combina com você?' });
      expect(await within(section).findByText('Afinidade alta')).toBeInTheDocument();
      expect(
        within(section).getByText('Divide Amadeirado e Cítrico com a sua coleção')
      ).toBeVisible();
      expect(within(section).queryByText('Prove num decant antes')).not.toBeInTheDocument();
      expect(within(section).getByRole('link', { name: 'Ver o meu DNA olfativo' })).toHaveAttribute(
        'href',
        '/profile'
      );
    });

    it('afinidade baixa mostra o território novo e sugere provar num decant', async () => {
      getDna.mockResolvedValue({
        ...dna,
        families: [{ family: 'oriental', weight: 5 }],
        topNotes: [],
      });
      await open();
      const section = await screen.findByRole('region', { name: 'Combina com você?' });
      expect(await within(section).findByText('Afinidade baixa')).toBeInTheDocument();
      expect(within(section).getByText('Você ainda não tem nada Cítrico')).toBeVisible();
      expect(within(section).getByText('Prove num decant antes')).toBeVisible();
    });

    it('DNA ainda se formando (D3): mensagem com o progresso, sem rótulo', async () => {
      getDna.mockResolvedValue({ ...dna, perfumeCount: 1 });
      await open();
      const section = await screen.findByRole('region', { name: 'Combina com você?' });
      expect(await within(section).findByText('Seu DNA ainda está se formando')).toBeVisible();
      expect(within(section).getByText(/Faltam 2 perfumes para o seu DNA aparecer/)).toBeVisible();
      expect(within(section).queryByText(/Afinidade/)).not.toBeInTheDocument();
    });

    it('não aparece para perfume que a pessoa já tem', async () => {
      listCollection.mockResolvedValue([
        { status: 'owned', format: null, volumeMl: null, updatedAt: 'x', perfume: { id: 'p1' } },
      ]);
      await open();
      await waitFor(() => expect(listCollection).toHaveBeenCalled());
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(screen.queryByRole('region', { name: 'Combina com você?' })).not.toBeInTheDocument();
    });

    it('perfume em "Quero" ainda mostra a afinidade (ajuda a decidir a compra)', async () => {
      listCollection.mockResolvedValue([
        { status: 'wanted', format: null, volumeMl: null, updatedAt: 'x', perfume: { id: 'p1' } },
      ]);
      await open();
      expect(await screen.findByRole('region', { name: 'Combina com você?' })).toBeVisible();
    });

    it('perfume sem notas não mostra o bloco', async () => {
      getBySlug.mockResolvedValue({ ...detail, notes: [] });
      renderApp('/perfumes/malbec-signature');
      await screen.findByRole('heading', { level: 1, name: 'Malbec Signature' });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(screen.queryByRole('region', { name: 'Combina com você?' })).not.toBeInTheDocument();
    });

    it('falha do DNA mostra erro com tentar de novo e não esconde o perfume', async () => {
      getDna.mockRejectedValueOnce(new AppError('dna_failed'));
      await open();
      expect(
        await screen.findByText(
          'Não foi possível carregar o seu DNA olfativo. Tente novamente em instantes.'
        )
      ).toBeVisible();
      expect(screen.getByRole('heading', { level: 1, name: 'Malbec Signature' })).toBeVisible();
      fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
      expect(await screen.findByText('Afinidade alta')).toBeVisible();
    });
  });
});
