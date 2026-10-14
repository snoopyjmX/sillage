import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { DailyEntry } from '@/types/daily';
import { DailyHistory } from './DailyHistory';

const entry = (slug: string, imageUrl: string | null): DailyEntry => ({
  date: '2026-10-13',
  perfume: {
    id: slug,
    slug,
    name: 'Bossa',
    brandName: 'Granado',
    brandSlug: 'granado',
    concentration: 'edp',
    gender: 'unisex',
    releaseYear: 2023,
    imagePath: null,
    imageUrl,
    families: ['citrus'],
  },
});

const renderHistory = (entries: DailyEntry[]) =>
  render(
    <MemoryRouter>
      <DailyHistory entries={entries} />
    </MemoryRouter>
  );

describe('DailyHistory', () => {
  it('com imagem, mostra o frasco no palco neutro e não o placeholder', () => {
    const { container } = renderHistory([
      entry('bossa', 'https://example.test/storage/perfume-images/bossa.webp'),
    ]);
    expect(container.querySelector('[data-slot="perfume-stage"] img')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="perfume-placeholder"]')).not.toBeInTheDocument();
  });

  it('sem imagem, cai no placeholder da família', () => {
    const { container } = renderHistory([entry('bossa', null)]);
    expect(container.querySelector('[data-slot="perfume-stage"] img')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="perfume-placeholder"]')).toBeInTheDocument();
  });

  it('cada item é um link para o perfume', () => {
    renderHistory([entry('bossa', null)]);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/perfumes/bossa');
  });
});
