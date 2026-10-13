import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';

const maybeSingle = vi.fn();
const limit = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const lt = vi.fn(() => ({ order: () => ({ limit }) }));
const rangeOrder = vi.fn();
const lte = vi.fn(() => ({ order: rangeOrder }));
const gte = vi.fn(() => ({ lte }));
const select = vi.fn((columns: string) => ({ eq, lt, gte, maybeSingle, columns }));
const from = vi.fn((table: string) => ({ select, table }));
const rpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: { from: (table: string) => from(table), rpc: (...args: unknown[]) => rpc(...args) },
}));

const { dailyService } = await import('./dailyService');

const row = (date: string, name: string) => ({
  date,
  perfume: {
    id: name,
    slug: name,
    name,
    concentration: 'edp',
    gender: 'unisex',
    release_year: 2022,
    image_path: null,
    brand: { name: 'O Boticário', slug: 'o-boticario' },
    perfume_notes: [{ note: { family: 'woody' } }, { note: { family: 'citrus' } }],
  },
});

describe('dailyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('getTodayDate usa profiles.timezone (hoje no fuso do usuário)', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-05T12:00:00Z') });
    maybeSingle.mockResolvedValue({ data: { timezone: 'Pacific/Kiritimati' }, error: null });
    await expect(dailyService.getTodayDate()).resolves.toBe('2026-10-06');
    expect(from).toHaveBeenCalledWith('profiles');
  });

  it('getTodayDate sem perfil cai no fuso padrão', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-06T01:00:00Z') });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(dailyService.getTodayDate()).resolves.toBe('2026-10-05');
  });

  it('getToday busca a linha da data e mapeia o perfume (famílias na ordem do enum)', async () => {
    maybeSingle.mockResolvedValue({ data: row('2026-10-05', 'Alfa'), error: null });
    const entry = await dailyService.getToday('2026-10-05');
    expect(from).toHaveBeenCalledWith('daily_perfumes');
    expect(eq).toHaveBeenCalledWith('date', '2026-10-05');
    expect(entry?.date).toBe('2026-10-05');
    expect(entry?.perfume.brandName).toBe('O Boticário');
    expect(entry?.perfume.families).toEqual(['citrus', 'woody']);
  });

  it('getToday devolve null quando não há Perfume do Dia hoje', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(dailyService.getToday('2026-10-05')).resolves.toBeNull();
  });

  it('getHistory pega só dias anteriores, com limite', async () => {
    limit.mockResolvedValue({
      data: [row('2026-10-04', 'Beta'), row('2026-10-03', 'Gama')],
      error: null,
    });
    const history = await dailyService.getHistory('2026-10-05', 5);
    expect(lt).toHaveBeenCalledWith('date', '2026-10-05');
    expect(limit).toHaveBeenCalledWith(5);
    expect(history.map((entry) => entry.date)).toEqual(['2026-10-04', '2026-10-03']);
  });

  it('erro cru do Supabase vira AppError sem expor a mensagem', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { code: '42501', message: 'rls secreta' } });
    const failure = await dailyService.getToday('2026-10-05').catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(AppError);
    expect((failure as AppError).code).toBe('daily_failed');
    expect((failure as AppError).message).not.toContain('rls');
  });

  it('getOverview calcula a data uma vez e junta hoje e histórico', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-05T15:00:00Z') });
    maybeSingle
      .mockResolvedValueOnce({ data: { timezone: 'America/Sao_Paulo' }, error: null })
      .mockResolvedValueOnce({ data: row('2026-10-05', 'Alfa'), error: null });
    limit.mockResolvedValue({ data: [row('2026-10-04', 'Beta')], error: null });
    const overview = await dailyService.getOverview();
    expect(overview.today?.perfume.name).toBe('Alfa');
    expect(overview.history).toHaveLength(1);
    expect(lt).toHaveBeenCalledWith('date', '2026-10-05');
  });

  it('countDays conta as linhas do dono sem baixar os dados (head + count exact)', async () => {
    select.mockReturnValueOnce(Promise.resolve({ count: 4, error: null }) as never);
    await expect(dailyService.countDays()).resolves.toBe(4);
    expect(from).toHaveBeenCalledWith('daily_perfumes');
    expect(select).toHaveBeenCalledWith('date', { count: 'exact', head: true });
  });

  it('countDays sem linhas devolve 0 real e erro vira mensagem amigável', async () => {
    select.mockReturnValueOnce(Promise.resolve({ count: null, error: null }) as never);
    await expect(dailyService.countDays()).resolves.toBe(0);
    select.mockReturnValueOnce(
      Promise.resolve({ count: null, error: { code: 'XX000', message: 'interno' } }) as never
    );
    await expect(dailyService.countDays()).rejects.toMatchObject({ code: 'daily_failed' });
  });

  describe('setToday', () => {
    it('chama set_daily_perfume com o id do perfume', async () => {
      rpc.mockResolvedValue({ error: null });
      await expect(dailyService.setToday('p1')).resolves.toBeUndefined();
      expect(rpc).toHaveBeenCalledWith('set_daily_perfume', { p_perfume_id: 'p1' });
    });

    it.each([
      ['pelo código 42501', { code: '42501', message: 'x' }],
      ['pela mensagem', { code: 'P0001', message: 'perfume not owned' }],
    ])('perfume fora do "Tenho" (%s) vira daily_not_owned', async (_label, error) => {
      rpc.mockResolvedValue({ error });
      const failure = await dailyService.setToday('p1').catch((e: unknown) => e);
      expect(failure).toBeInstanceOf(AppError);
      expect((failure as AppError).code).toBe('daily_not_owned');
      expect((failure as AppError).message).not.toContain('perfume not owned');
    });

    it('outro erro vira daily_failed sem expor a mensagem crua', async () => {
      rpc.mockResolvedValue({ error: { code: 'XX000', message: 'interno' } });
      await expect(dailyService.setToday('p1')).rejects.toMatchObject({ code: 'daily_failed' });
    });
  });

  it('getRange: pede as duas pontas incluídas, do mais antigo ao mais novo, e monta o domínio', async () => {
    rangeOrder.mockResolvedValue({
      data: [row('2026-10-01', 'Alfa'), row('2026-10-02', 'Beta')],
      error: null,
    });
    const entries = await dailyService.getRange('2026-10-01', '2026-10-31');
    expect(from).toHaveBeenCalledWith('daily_perfumes');
    expect(gte).toHaveBeenCalledWith('date', '2026-10-01');
    expect(lte).toHaveBeenCalledWith('date', '2026-10-31');
    expect(rangeOrder).toHaveBeenCalledWith('date', { ascending: true });
    expect(entries.map((entry) => [entry.date, entry.perfume.name])).toEqual([
      ['2026-10-01', 'Alfa'],
      ['2026-10-02', 'Beta'],
    ]);
  });

  it('getRange: erro do banco vira a mensagem amigável, nunca o texto cru', async () => {
    rangeOrder.mockResolvedValue({ data: null, error: { code: 'XX000', message: 'boom interno' } });
    const error = await dailyService.getRange('2026-10-01', '2026-10-31').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('daily_failed');
    expect((error as AppError).message).not.toContain('boom');
  });
});
