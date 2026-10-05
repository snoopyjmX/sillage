import { describe, expect, it } from 'vitest';
import { cn } from './utils.ts';

describe('cn', () => {
  it('mescla classes simples', () => {
    expect(cn('p-4', 'font-serif')).toBe('p-4 font-serif');
  });

  it('ignora valores condicionais falsy', () => {
    const isError = false;
    expect(cn('p-4', isError && 'text-red-500', null, undefined, 'bg-background')).toBe(
      'p-4 bg-background'
    );
  });

  it('resolve conflitos do Tailwind dando precedência à última classe', () => {
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4');
  });
});
