import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { todayInTimezone } from '@/lib/timezone';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';
import type { AnnualRecap } from '@/types/recap';

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));

vi.mock('@/services/dailyService', () => ({
  dailyService: {
    getTimezone: () => Promise.resolve('America/Sao_Paulo'),
    getOverview: () => Promise.resolve({ today: null, history: [] }),
    getRange: () => Promise.resolve([]),
  },
}));

const getRecap = vi.fn();
vi.mock('@/services/recapService', () => ({
  recapService: { get: (year: number) => getRecap(year) },
}));

const shareMutate = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useShareRecap', () => ({
  useShareRecap: () => ({ mutate: shareMutate, isPending: false }),
}));

const currentYear = Number(todayInTimezone('America/Sao_Paulo').slice(0, 4));

const perfume = (slug: string, name: string, days: number) => ({
  slug,
  name,
  brandName: 'Granado',
  imageUrl: null,
  days,
});

const recap: AnnualRecap = {
  year: currentYear,
  daysWorn: 40,
  daysElapsed: 100,
  consistency: 0.4,
  signature: perfume('bossa', 'Bossa', 20),
  seasons: { summer: perfume('bossa', 'Bossa', 20), autumn: null, winter: null, spring: null },
  topNote: { slug: 'cedro', name: 'Cedro', family: 'woody', weight: 30 },
  families: { firstSemester: [{ family: 'woody', weight: 5 }], secondSemester: [] },
};

describe('RecapPage (Fase 23)', () => {
  beforeEach(() => {
    auth.reset();
    auth.setInitialSession(fakeSession());
    getRecap.mockReset();
    getRecap.mockResolvedValue(recap);
    shareMutate.mockReset();
  });

  it('visitante é levado à Landing (rota privada) e nada é consultado', async () => {
    auth.setInitialSession(null);
    const { router } = renderApp(`/recap/${currentYear}`);
    await screen.findByRole('heading', { name: 'Descubra perfumes pelas suas notas', level: 1 });
    expect(router.state.location.pathname).toBe('/');
    expect(getRecap).not.toHaveBeenCalled();
  });

  it('mostra o título com o ano e a primeira lâmina', async () => {
    renderApp(`/recap/${currentYear}`);
    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: `Seu ano em perfumes · ${currentYear}` },
        { timeout: 8000 }
      )
    ).toBeInTheDocument();
    expect(await screen.findByRole('group', { name: 'Lâmina 1 de 5' })).toBeInTheDocument();
    expect(getRecap).toHaveBeenCalledWith(currentYear);
  });

  it('compartilhar na última lâmina chama a geração com a retrospectiva', async () => {
    renderApp(`/recap/${currentYear}`);
    await screen.findByRole('group', { name: 'Lâmina 1 de 5' }, { timeout: 8000 });
    for (let i = 0; i < 4; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /Próxima/ }));
    }
    // A troca de lâmina espera a saída animada da anterior
    fireEvent.click(await screen.findByRole('button', { name: 'Baixar imagem' }));
    expect(shareMutate).toHaveBeenCalledWith(recap);
  });

  it.each([
    ['antes de 2026', '2025'],
    ['no futuro', String(currentYear + 1)],
    ['que não é número', 'abc'],
  ])('ano %s é "não existe" e nada é consultado', async (_label, year) => {
    renderApp(`/recap/${year}`);
    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'Retrospectiva indisponível' },
        { timeout: 8000 }
      )
    ).toBeInTheDocument();
    expect(getRecap).not.toHaveBeenCalled();
  });

  it('com poucos dias, mostra o estado vazio em vez das lâminas', async () => {
    getRecap.mockResolvedValue({ ...recap, daysWorn: 3 });
    renderApp(`/recap/${currentYear}`);
    expect(
      await screen.findByText('Seu ano ainda está começando', {}, { timeout: 8000 })
    ).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /Lâmina/ })).not.toBeInTheDocument();
  });

  it('falha mostra erro com "Tentar novamente", sem texto técnico, e refaz a consulta', async () => {
    getRecap.mockRejectedValueOnce(new AppError('recap_failed'));
    renderApp(`/recap/${currentYear}`);
    expect(
      await screen.findByText('Não foi possível montar a retrospectiva', {}, { timeout: 8000 })
    ).toBeInTheDocument();
    expect(screen.queryByText(/relation|PGRST|42/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => expect(screen.getByRole('group', { name: 'Lâmina 1 de 5' })).toBeVisible());
    expect(getRecap).toHaveBeenCalledTimes(2);
  });

  it('enquanto carrega, mostra o skeleton', async () => {
    getRecap.mockReturnValue(new Promise(() => undefined));
    renderApp(`/recap/${currentYear}`);
    expect(
      await screen.findByRole('status', { name: 'Carregando a retrospectiva' }, { timeout: 8000 })
    ).toBeInTheDocument();
  });
});
