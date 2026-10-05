import { describe, expect, it } from 'vitest';

// Cores só existem em src/styles/tokens.css. Em components/** valem apenas tokens.
const files = import.meta.glob(['/src/components/**/*.{ts,tsx}', '!/src/components/**/*.test.*'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const LITERAL_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(/g;

describe('sem valor solto em components/**', () => {
  it('encontra arquivos de componentes para verificar', () => {
    expect(Object.keys(files).length).toBeGreaterThan(5);
  });

  it.each(Object.entries(files))('%s não tem cor literal', (path, source) => {
    const matches = source.match(LITERAL_COLOR) ?? [];
    expect(matches, `${path} usa cor literal: ${matches.join(', ')}`).toEqual([]);
  });
});
