import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { PerfumeSummary } from '@/types/catalog';
import { PerfumeCard } from './PerfumeCard';

const base: PerfumeSummary = {
  id: 'p1',
  slug: 'caipi-d-argent',
  name: "Caipi d'Argent",
  brandName: 'Condé Parfum',
  brandSlug: 'conde-parfum',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: 2023,
  imagePath: null,
  families: ['citrus', 'woody', 'aromatic', 'musky'],
};

const renderCard = (perfume: Partial<PerfumeSummary> = {}) =>
  render(
    <MemoryRouter>
      <PerfumeCard perfume={{ ...base, ...perfume }} />
    </MemoryRouter>
  );

describe('PerfumeCard', () => {
  it('é um link para o perfume, com marca, nome, concentração, gênero e ano', () => {
    renderCard();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/perfumes/caipi-d-argent');
    expect(screen.getByRole('heading', { name: "Caipi d'Argent" })).toBeInTheDocument();
    expect(screen.getByText('Condé Parfum')).toBeInTheDocument();
    expect(screen.getByText('EDP')).toBeInTheDocument();
    expect(screen.getByText('Unissex · 2023')).toBeInTheDocument();
  });

  it('o placeholder usa a cor da primeira família (sem logo nem imagem)', () => {
    const { container } = renderCard();
    const placeholder = container.querySelector('[data-slot="perfume-placeholder"]');
    expect(placeholder).toHaveClass('bg-family-citrus');
    expect(container.querySelector('img')).toBeNull();
  });

  it('sem famílias usa o fundo neutro e não mostra a lista de chips', () => {
    const { container } = renderCard({ families: [] });
    expect(container.querySelector('[data-slot="perfume-placeholder"]')).toHaveClass('bg-muted');
    expect(screen.queryByRole('list', { name: 'Famílias olfativas' })).not.toBeInTheDocument();
  });

  it('mostra no máximo 3 famílias, em pt-BR', () => {
    renderCard();
    const list = screen.getByRole('list', { name: 'Famílias olfativas' });
    expect(list.querySelectorAll('li')).toHaveLength(3);
    expect(screen.getByText('Cítrico')).toBeInTheDocument();
    expect(screen.queryByText('Almiscarado')).not.toBeInTheDocument();
  });

  it('sem ano, mostra só o gênero', () => {
    renderCard({ releaseYear: null });
    expect(screen.getByText('Unissex')).toBeInTheDocument();
  });

  it('o CTA de coleção fica fora do link e indisponível até a fase da coleção', () => {
    renderCard();
    const cta = screen.getByRole('button', { name: 'Adicionar à Coleção, em breve' });
    expect(cta).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('link')).not.toContainElement(cta);
  });
});
