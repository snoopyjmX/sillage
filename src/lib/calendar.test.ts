import { describe, expect, it } from 'vitest';
import {
  dayNumber,
  daysInMonth,
  isMonth,
  monthBounds,
  monthGrid,
  monthOf,
  resolveMonth,
  shiftMonth,
} from './calendar';

describe('isMonth', () => {
  it.each(['2026-10', '2000-01', '2026-12'])('aceita %s', (value) => {
    expect(isMonth(value)).toBe(true);
  });

  it.each(['1999-12', '2026-13', '2026-00', '2026-1', '26-10', '2026-10-01', '', 'abc'])(
    'rejeita %j',
    (value) => {
      expect(isMonth(value)).toBe(false);
    }
  );
});

describe('shiftMonth', () => {
  it('anda para trás e para a frente, atravessando o ano', () => {
    expect(shiftMonth('2026-10', -1)).toBe('2026-09');
    expect(shiftMonth('2026-10', 1)).toBe('2026-11');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-10', 0)).toBe('2026-10');
  });
});

describe('daysInMonth / monthBounds', () => {
  it.each([
    ['2026-10', 31],
    ['2026-09', 30],
    ['2026-02', 28],
    ['2028-02', 29],
    ['2100-02', 28],
    ['2000-02', 29],
  ])('%s tem %i dias', (month, days) => {
    expect(daysInMonth(month)).toBe(days);
  });

  it('primeiro e último dia', () => {
    expect(monthBounds('2026-10')).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    expect(monthBounds('2028-02')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
  });
});

describe('monthGrid', () => {
  it('semanas de domingo a sábado, sempre com 7 células', () => {
    // 1º de outubro de 2026 é quinta-feira: 4 células vazias antes
    const weeks = monthGrid('2026-10');
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0]).toEqual([null, null, null, null, '2026-10-01', '2026-10-02', '2026-10-03']);
    // 4 vazias + 31 dias = 35: cinco semanas exatas, terminando no sábado 31
    expect(weeks).toHaveLength(5);
    expect(weeks.at(-1)?.at(-1)).toBe('2026-10-31');
    expect(weeks.flat().filter((date) => date !== null)).toHaveLength(31);
  });

  it('completa a última semana com células vazias', () => {
    // 1º de setembro de 2026 é terça-feira, com 30 dias: 2 + 30 = 32, completa até 35
    const weeks = monthGrid('2026-09');
    expect(weeks).toHaveLength(5);
    expect(weeks.at(-1)?.slice(-3)).toEqual([null, null, null]);
    expect(weeks.at(-1)?.[3]).toBe('2026-09-30');
  });

  it('mês que começa no domingo não tem células vazias antes', () => {
    // 1º de fevereiro de 2026 é domingo e o mês tem 28 dias: 4 semanas exatas
    const weeks = monthGrid('2026-02');
    expect(weeks).toHaveLength(4);
    expect(weeks[0]?.[0]).toBe('2026-02-01');
    expect(weeks.flat().every((date) => date !== null)).toBe(true);
  });

  it('mês que começa no sábado ocupa seis semanas', () => {
    // 1º de agosto de 2026 é sábado, com 31 dias
    const weeks = monthGrid('2026-08');
    expect(weeks).toHaveLength(6);
    expect(weeks[0]?.slice(0, 6).every((date) => date === null)).toBe(true);
    expect(weeks[0]?.[6]).toBe('2026-08-01');
  });

  it('as datas saem em ordem crescente, sem repetir', () => {
    const dates = monthGrid('2026-10')
      .flat()
      .filter((date): date is string => date !== null);
    expect([...dates].sort()).toEqual(dates);
    expect(new Set(dates).size).toBe(dates.length);
  });
});

describe('resolveMonth', () => {
  const today = '2026-10-13';

  it('usa o mês pedido quando é válido e não é futuro', () => {
    expect(resolveMonth('2026-09', today)).toBe('2026-09');
    expect(resolveMonth('2026-10', today)).toBe('2026-10');
    expect(resolveMonth('2025-01', today)).toBe('2025-01');
  });

  it.each([null, '', 'abc', '2026-13', '1999-01', '2026-10-13', '../../etc'])(
    'pedido inválido %j volta para o mês de hoje',
    (requested) => {
      expect(resolveMonth(requested, today)).toBe('2026-10');
    }
  );

  it('mês futuro volta para o de hoje', () => {
    expect(resolveMonth('2026-11', today)).toBe('2026-10');
    expect(resolveMonth('2030-01', today)).toBe('2026-10');
  });
});

describe('monthOf / dayNumber', () => {
  it('extrai o mês e o dia sem zero à esquerda', () => {
    expect(monthOf('2026-10-13')).toBe('2026-10');
    expect(dayNumber('2026-10-05')).toBe(5);
    expect(dayNumber('2026-10-13')).toBe(13);
  });
});
