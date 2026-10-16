import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { monthBounds, monthOf, shiftMonth } from '@/lib/calendar';
import { formatMonthYear } from '@/lib/format';
import { todayInTimezone } from '@/lib/timezone';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';
import type { PerfumeSummary } from '@/types/catalog';
import type { DailyEntry } from '@/types/daily';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));
const getRange = vi.fn();
vi.mock('@/services/dailyService', () => ({
  dailyService: {
    getRange: (from: string, to: string) => getRange(from, to),
    getTimezone: () => Promise.resolve('America/Sao_Paulo'),
    getOverview: () => Promise.resolve({ today: null, history: [] }),
  },
}));

const today = todayInTimezone('America/Sao_Paulo');
const current = monthOf(today);
const previous = shiftMonth(current, -1);

const entry = (date: string, name: string, slug: string): DailyEntry => {
  const perfume: PerfumeSummary = {
    id: slug,
    slug,
    name,
    brandName: 'O Boticário',
    brandSlug: 'o-boticario',
    concentration: 'edp',
    gender: 'unisex',
    releaseYear: 2022,
    imagePath: null,
    families: ['woody'],
  };
  return { date, perfume };
};

// O texto do título é minúsculo; a primeira letra vira maiúscula só por CSS
const cap = (month: string) => formatMonthYear(`${month}-01`);

describe('MemorialPage (Fase 19)', () => {
  beforeEach(() => {
    auth.reset();
    auth.setInitialSession(fakeSession());
    getRange.mockReset();
    getRange.mockResolvedValue([
      entry(`${current}-01`, 'Alfa', 'alfa'),
      entry(`${current}-02`, 'Beta', 'beta'),
    ]);
  });

  it('visitante é levado à Landing (rota privada) e nada é consultado', async () => {
    auth.setInitialSession(null);
    const { router } = renderApp('/memorial');
    await screen.findByRole('heading', { name: 'Descubra perfumes pelas suas notas', level: 1 });
    expect(router.state.location.pathname).toBe('/');
    expect(router.state.location.search).toBe('?redirect=%2Fmemorial');
    expect(getRange).not.toHaveBeenCalled();
  });

  it('mostra o mês de hoje com a grade, os dias da semana e o perfume de cada dia', async () => {
    renderApp('/memorial');
    expect(await screen.findByRole('heading', { level: 1, name: 'Memorial' })).toBeVisible();
    expect(await screen.findByRole('heading', { level: 2, name: cap(current) })).toBeVisible();
    const grid = await screen.findByRole('table', {
      name: `Perfumes do mês de ${formatMonthYear(`${current}-01`)}`,
    });
    const headers = within(grid).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual([
      'dom',
      'seg',
      'ter',
      'qua',
      'qui',
      'sex',
      'sáb',
    ]);
    expect(within(grid).getByRole('link', { name: /Alfa, O Boticário/ })).toHaveAttribute(
      'href',
      '/perfumes/alfa'
    );
    expect(within(grid).getByRole('link', { name: /Beta, O Boticário/ })).toHaveAttribute(
      'href',
      '/perfumes/beta'
    );
  });

  it('pede o intervalo do mês inteiro e resume quantos dias foram registrados', async () => {
    renderApp('/memorial');
    await screen.findByRole('table');
    const { from, to } = monthBounds(current);
    expect(getRange).toHaveBeenCalledWith(from, to);
    expect(
      await screen.findByText(`2 dias registrados em ${formatMonthYear(`${current}-01`)}.`)
    ).toBeVisible();
  });

  it('o dia de hoje vem identificado em texto, não só em cor', async () => {
    getRange.mockResolvedValue([]);
    renderApp('/memorial');
    const grid = await screen.findByRole('table');
    expect(within(grid).getByText(/\(hoje\): sem perfume/)).toBeInTheDocument();
  });

  it('?vista=varal mostra os dias como fotos no varal, do mais antigo ao mais recente', async () => {
    renderApp('/memorial?vista=varal');
    const carousel = await screen.findByRole('region', {
      name: `Varal de memórias de ${formatMonthYear(`${current}-01`)}`,
    });
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    const slides = within(carousel).getAllByRole('group');
    expect(slides.map((slide) => slide.getAttribute('aria-label'))).toEqual([
      expect.stringMatching(/^1 de 2: Alfa/),
      expect.stringMatching(/^2 de 2: Beta/),
    ]);
    expect(within(carousel).getByRole('link', { name: /Alfa/ })).toHaveAttribute(
      'href',
      '/perfumes/alfa'
    );
  });

  it('alterna entre Calendário e Varal pela URL, e trocar de mês mantém a visão', async () => {
    const { router } = renderApp('/memorial');
    await screen.findByRole('table');
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Varal de memórias' }));
    await screen.findByRole('region', { name: /Varal de memórias de/ });
    expect(router.state.location.search).toBe('?vista=varal');

    fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }));
    await waitFor(() => expect(router.state.location.search).toBe(`?vista=varal&mes=${previous}`));

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Calendário' }));
    await screen.findByRole('table');
    expect(router.state.location.search).toBe(`?mes=${previous}`);
  });

  it('varal sem registros no mês mostra o estado vazio, sem carrossel', async () => {
    getRange.mockResolvedValue([]);
    renderApp('/memorial?vista=varal');
    expect(await screen.findByText('Nenhum perfume neste mês')).toBeVisible();
    expect(screen.queryByRole('region', { name: /Varal de memórias de/ })).not.toBeInTheDocument();
  });

  it('mês anterior e próximo: navega, guarda na URL e limita ao mês de hoje', async () => {
    const { router } = renderApp('/memorial');
    await screen.findByRole('table');
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Ir para este mês' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }));
    expect(await screen.findByRole('heading', { level: 2, name: cap(previous) })).toBeVisible();
    expect(router.state.location.search).toBe(`?mes=${previous}`);
    const { from, to } = monthBounds(previous);
    await waitFor(() => expect(getRange).toHaveBeenCalledWith(from, to));
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Ir para este mês' }));
    expect(await screen.findByRole('heading', { level: 2, name: cap(current) })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Próximo mês' })).toBeDisabled();
  });

  it('lê o mês da URL', async () => {
    renderApp(`/memorial?mes=${previous}`);
    expect(await screen.findByRole('heading', { level: 2, name: cap(previous) })).toBeVisible();
  });

  it.each(['abc', '2026-13', '1999-01', '../../etc', '9999-12'])(
    'mês inválido ou futuro (%j) volta para o mês de hoje',
    async (bad) => {
      renderApp(`/memorial?mes=${encodeURIComponent(bad)}`);
      expect(await screen.findByRole('heading', { level: 2, name: cap(current) })).toBeVisible();
    }
  );

  it('mês sem perfume mostra a grade e o estado vazio com saída para o catálogo', async () => {
    getRange.mockResolvedValue([]);
    renderApp('/memorial');
    expect(await screen.findByRole('heading', { name: 'Nenhum perfume neste mês' })).toBeVisible();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar o catálogo' })).toHaveAttribute(
      'href',
      '/catalog'
    );
  });

  it('falha mostra a mensagem amigável e tenta de novo', async () => {
    getRange.mockRejectedValueOnce(new AppError('daily_failed'));
    renderApp('/memorial');
    expect(
      await screen.findByText(
        'Não foi possível carregar o Perfume do Dia. Tente novamente em instantes.'
      )
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Não foi possível carregar o calendário' })
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('table')).toBeVisible();
  });

  it('enquanto carrega, mostra o esqueleto da grade', async () => {
    getRange.mockReturnValue(new Promise(() => {}));
    renderApp('/memorial');
    expect(await screen.findByRole('status', { name: 'Carregando o calendário' })).toBeVisible();
  });

  it('voltar leva ao início', async () => {
    renderApp('/memorial');
    expect(await screen.findByRole('link', { name: 'Voltar ao início' })).toHaveAttribute(
      'href',
      '/'
    );
  });
});
