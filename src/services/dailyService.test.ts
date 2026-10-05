import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';

const maybeSingle = vi.fn();
const limit = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const lt = vi.fn(() => ({ order: () => ({ limit }) }));
const select = vi.fn((columns: string) => ({ eq, lt, maybeSingle, columns }));
const from = vi.fn((table: string) => ({ select, table }));

vi.mock('@/lib/supabase', () => ({ supabase: { from: (table: string) => from(table) } }));

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
    brand: { name: 'Amyi', slug: 'amyi' },
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
    expect(entry?.perfume.brandName).toBe('Amyi');
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
});
