import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';
import type { PerfumeSummary } from '@/types/catalog';
import type { DailyEntry } from '@/types/daily';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));
const getOverview = vi.fn();
vi.mock('@/services/dailyService', () => ({
  dailyService: { getOverview: () => getOverview() },
}));
vi.mock('@/services/collectionService', () => ({
  collectionService: { list: () => Promise.resolve([]) },
}));

const entry = (date: string, name: string): DailyEntry => {
  const perfume: PerfumeSummary = {
    id: name,
    slug: name.toLowerCase(),
    name,
    brandName: 'O Boticário',
    brandSlug: 'o-boticario',
    concentration: 'edp',
    gender: 'unisex',
    releaseYear: 2022,
    imagePath: null,
    families: ['citrus'],
  };
  return { date, perfume };
};

const TITLE = { name: 'Descubra a fragrância de hoje', level: 1 } as const;

describe('HomePage', () => {
  beforeEach(() => {
    auth.reset();
    getOverview.mockReset();
  });

  it('visitante vê o título e o convite, sem consultar o Perfume do Dia (é privado)', async () => {
    auth.setInitialSession(null);
    renderApp('/');
    expect(await screen.findByRole('heading', TITLE)).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Criar conta' })).toHaveAttribute(
      'href',
      '/register'
    );
    expect(getOverview).not.toHaveBeenCalled();
  });

  it('logado vê o Perfume do Dia em destaque e o histórico', async () => {
    auth.setInitialSession(fakeSession());
    getOverview.mockResolvedValue({
      today: entry('2026-10-05', 'Alfa'),
      history: [entry('2026-10-04', 'Beta'), entry('2026-10-03', 'Gama')],
    });
    renderApp('/');
    const highlight = await screen.findByRole('article', { name: 'Perfume do Dia' });
    expect(within(highlight).getByRole('heading', { name: 'Alfa' })).toBeInTheDocument();
    const history = screen.getByRole('list', { name: 'Perfumes dos dias anteriores' });
    expect(within(history).getAllByRole('listitem')).toHaveLength(2);
    expect(within(history).getByRole('link', { name: /Beta/ })).toHaveAttribute(
      'href',
      '/perfumes/beta'
    );
  });

  it('sem Perfume do Dia hoje, mas com histórico, mostra os dois estados', async () => {
    auth.setInitialSession(fakeSession());
    getOverview.mockResolvedValue({ today: null, history: [entry('2026-10-04', 'Beta')] });
    renderApp('/');
    expect(await screen.findByText('Hoje ainda não tem Perfume do Dia')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Perfumes dos dias anteriores' })).toBeInTheDocument();
  });

  it('conta nova (nada ainda) mostra o estado vazio com saída para o catálogo', async () => {
    auth.setInitialSession(fakeSession());
    getOverview.mockResolvedValue({ today: null, history: [] });
    renderApp('/');
    expect(
      await screen.findByRole('heading', { name: 'Você ainda não escolheu um Perfume do Dia' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar o catálogo' })).toHaveAttribute(
      'href',
      '/catalog'
    );
  });

  it('falha mostra mensagem amigável e permite tentar de novo', async () => {
    auth.setInitialSession(fakeSession());
    getOverview.mockRejectedValue(new AppError('daily_failed'));
    renderApp('/');
    expect(
      await screen.findByText(
        'Não foi possível carregar o Perfume do Dia. Tente novamente em instantes.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });
});
