import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/test/renderApp';
import type { PerfumeSummary } from '@/types/catalog';

// Os services são trocados por simulações: o teste não toca no Supabase (nem no cliente dele).
const search = vi.fn();
vi.mock('@/services/perfumeService', () => ({
  perfumeService: { search: (f: unknown) => search(f) },
}));
vi.mock('@/services/collectionService', () => ({
  collectionService: { list: () => Promise.resolve([]) },
}));
vi.mock('@/services/authService', () => ({
  authService: {
    getSession: () => Promise.resolve(null),
    onAuthStateChange: () => () => undefined,
  },
}));
vi.mock('@/services/referenceService', () => ({
  referenceService: {
    listBrands: () => Promise.resolve([{ slug: 'amyi', name: 'Amyi' }]),
    listNotes: () =>
      Promise.resolve([{ slug: 'bergamota', name: 'Bergamota', family: 'citrus' as const }]),
  },
}));

const perfume = (overrides: Partial<PerfumeSummary> = {}): PerfumeSummary => ({
  id: 'p1',
  slug: 'amyi-2-15',
  name: 'Amyi 2.15',
  brandName: 'Amyi',
  brandSlug: 'amyi',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: 2021,
  imagePath: null,
  families: ['citrus', 'woody'],
  ...overrides,
});

describe('rotas', () => {
  beforeEach(() => {
    search.mockReset();
    search.mockResolvedValue({ items: [perfume()], total: 1 });
  });

  it('/ é a Home pública (sem redirecionar), com o convite para visitantes', async () => {
    const { router } = renderApp('/');
    // Primeira carga do chunk lazy no vitest é a mais lenta
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Descubra a fragrância de hoje', level: 1 },
        { timeout: 10_000 }
      )
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/');
    expect(
      await screen.findByRole('heading', { name: 'Entre para ver o seu Perfume do Dia' })
    ).toBeInTheDocument();
  });

  it('rota desconhecida mostra um 404 amigável com caminho de volta', async () => {
    renderApp('/nao-existe');
    expect(
      await screen.findByRole('heading', { name: 'Não encontramos essa página' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para o catálogo' })).toHaveAttribute(
      'href',
      '/catalog'
    );
  });

  it('o React 19 resolve <title> e <meta> sem biblioteca (hoist para o head)', async () => {
    renderApp('/catalog');
    await screen.findByRole('heading', { name: 'Catálogo', level: 1 });
    await waitFor(() => expect(document.title).toBe('Catálogo · Sillage'));
    expect(document.head.querySelector('meta[name="description"]')).not.toBeNull();
  });

  it('Início, Catálogo, Coleção e Perfil são links da navegação principal', async () => {
    renderApp('/catalog');
    await screen.findByRole('heading', { name: 'Catálogo', level: 1 });
    const nav = screen.getAllByRole('navigation', { name: 'Principal' })[0];
    if (!nav) throw new Error('navegação principal não encontrada');
    expect(within(nav).getByRole('link', { name: /Início/ })).toHaveAttribute('href', '/');
    expect(within(nav).getByRole('link', { name: /Catálogo/ })).toHaveAttribute('href', '/catalog');
    expect(within(nav).getByRole('link', { name: /Coleção/ })).toHaveAttribute(
      'href',
      '/collection'
    );
    expect(within(nav).getByRole('link', { name: /Perfil/ })).toHaveAttribute('href', '/profile');
  });
});

describe('catálogo', () => {
  beforeEach(() => {
    search.mockReset();
  });

  it('mostra o card com marca, concentração e famílias vindas do resultado', async () => {
    search.mockResolvedValue({ items: [perfume()], total: 1 });
    renderApp('/catalog');
    const card = await screen.findByRole('link', { name: /Amyi 2\.15/ });
    expect(card).toHaveAttribute('href', '/perfumes/amyi-2-15');
    expect(within(card).getByText('EDP')).toBeInTheDocument();
    expect(within(card).getByText('Cítrico')).toBeInTheDocument();
    expect(within(card).getByText('Amadeirado')).toBeInTheDocument();
    expect(screen.getByText('1 perfume')).toBeInTheDocument();
  });

  it('valores inválidos na URL caem nos padrões e não quebram', async () => {
    search.mockResolvedValue({ items: [perfume()], total: 1 });
    renderApp('/catalog?sort=zzz&page=-3&notes=%2e%2e%2f&families=bogus&ymin=abc');
    expect(await screen.findByRole('link', { name: /Amyi 2\.15/ })).toBeInTheDocument();
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'newest', page: 1, notes: [], families: [], yearMin: null })
    );
  });

  it('sem resultados mostra o estado vazio e permite limpar os filtros', async () => {
    search.mockResolvedValue({ items: [], total: 0 });
    const { router } = renderApp('/catalog?families=citrus');
    expect(
      await screen.findByRole('heading', { name: 'Nenhum perfume encontrado' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Limpar filtros' })[0]!);
    await waitFor(() => expect(router.state.location.search).toBe(''));
  });

  it('página além do fim mostra o estado vazio com "Ir para a página 1"', async () => {
    search.mockResolvedValue({ items: [], total: 0 });
    const { router } = renderApp('/catalog?page=9&q=amyi');
    expect(
      await screen.findByRole('heading', { name: 'Essa página não existe' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ir para a página 1' }));
    await waitFor(() => expect(router.state.location.search).toBe('?q=amyi'));
  });

  it('erro mostra mensagem segura com tentar de novo (nunca o texto técnico)', async () => {
    search.mockRejectedValue(new Error('PGRST301: JWT expired at db-host-123'));
    renderApp('/catalog');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível carregar agora');
    expect(alert).not.toHaveTextContent('PGRST301');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });
});
