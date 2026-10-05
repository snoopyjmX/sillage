import { describe, expect, it } from 'vitest';
import { formatDecimal } from './format';

describe('formatDecimal', () => {
  it('usa vírgula como separador decimal', () => {
    expect(formatDecimal(4.2)).toBe('4,2');
    expect(formatDecimal(3)).toBe('3,0');
    expect(formatDecimal(3.756, 2)).toBe('3,76');
  });
});
