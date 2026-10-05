import { describe, expect, it } from 'vitest';
import { todayInTimezone } from './timezone';

// Mesmo instante, datas diferentes: espelha o teste pgTAP da RN06 (set_daily_perfume)
const INSTANT = new Date('2026-10-05T12:00:00Z');

describe('todayInTimezone', () => {
  it('respeita o fuso: Kiritimati (UTC+14) já está no dia seguinte, Pago Pago (UTC-11) no anterior', () => {
    expect(todayInTimezone('Pacific/Kiritimati', INSTANT)).toBe('2026-10-06');
    expect(todayInTimezone('Pacific/Pago_Pago', INSTANT)).toBe('2026-10-05');
    expect(todayInTimezone('Pacific/Pago_Pago', new Date('2026-10-05T05:00:00Z'))).toBe(
      '2026-10-04'
    );
  });

  it('22h em São Paulo (UTC-3) ainda é o mesmo dia, não o seguinte em UTC', () => {
    expect(todayInTimezone('America/Sao_Paulo', new Date('2026-10-06T01:00:00Z'))).toBe(
      '2026-10-05'
    );
  });

  it('fuso inválido cai no padrão em vez de lançar', () => {
    expect(todayInTimezone('Marte/Olympus', new Date('2026-10-06T01:00:00Z'))).toBe('2026-10-05');
  });
});
