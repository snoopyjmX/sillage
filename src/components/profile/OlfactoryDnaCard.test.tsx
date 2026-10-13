import { render, screen, within } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { OlfactoryDna } from '@/types/dna';
import { OlfactoryDnaCard, OlfactoryDnaEmpty, OlfactoryDnaSkeleton } from './OlfactoryDnaCard';

const dna: OlfactoryDna = {
  families: [
    { family: 'woody', weight: 6 },
    { family: 'citrus', weight: 4 },
  ],
  topNotes: [
    { slug: 'cedro', name: 'Cedro', family: 'woody', weight: 4 },
    { slug: 'limao-siciliano', name: 'Limão Siciliano', family: 'citrus', weight: 3 },
  ],
  wishFamily: 'oriental',
  wantedCount: 4,
  perfumeCount: 5,
  memorialDays: 12,
};

const renderInRouter = (ui: ReactNode) =>
  render(
    <MotionConfig reducedMotion="always">
      <MemoryRouter>{ui}</MemoryRouter>
    </MotionConfig>
  );

describe('OlfactoryDnaCard', () => {
  it('mostra as famílias com porcentagem em texto (a cor nunca é a única informação)', () => {
    renderInRouter(<OlfactoryDnaCard dna={dna} />);
    const legend = screen.getByRole('list', { name: 'Famílias olfativas' });
    expect(within(legend).getByText('Amadeirado 60%')).toBeInTheDocument();
    expect(within(legend).getByText('Cítrico 40%')).toBeInTheDocument();
  });

  it('as notas que mais aparecem são links para o catálogo filtrado', () => {
    renderInRouter(<OlfactoryDnaCard dna={dna} />);
    const notes = screen.getByRole('list', { name: 'Notas que mais aparecem' });
    expect(within(notes).getByRole('link', { name: 'Cedro' })).toHaveAttribute(
      'href',
      '/catalog?notes=cedro'
    );
    expect(within(notes).getByRole('link', { name: 'Limão Siciliano' })).toHaveAttribute(
      'href',
      '/catalog?notes=limao-siciliano'
    );
  });

  it('mostra a leitura de desejo e o rodapé com a base do cálculo', () => {
    renderInRouter(<OlfactoryDnaCard dna={dna} />);
    expect(screen.getByText('Seus desejos apontam para Oriental')).toBeInTheDocument();
    expect(screen.getByText('Baseado em 5 perfumes e 12 dias no memorial.')).toBeInTheDocument();
  });

  it('sem leitura de desejo, a linha não aparece', () => {
    renderInRouter(<OlfactoryDnaCard dna={{ ...dna, wishFamily: null, wantedCount: 0 }} />);
    expect(screen.queryByText(/Seus desejos apontam/)).not.toBeInTheDocument();
  });

  it('sem notas, não mostra o bloco de notas', () => {
    renderInRouter(<OlfactoryDnaCard dna={{ ...dna, topNotes: [] }} />);
    expect(screen.queryByText('Notas que mais aparecem')).not.toBeInTheDocument();
  });
});

describe('OlfactoryDnaEmpty', () => {
  it('mostra o progresso e a saída para o catálogo', () => {
    renderInRouter(<OlfactoryDnaEmpty missing={2} />);
    expect(
      screen.getByRole('heading', { name: 'Faltam 2 perfumes para o seu DNA aparecer' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar o catálogo' })).toHaveAttribute(
      'href',
      '/catalog'
    );
  });
});

describe('OlfactoryDnaSkeleton', () => {
  it('anuncia o carregamento', () => {
    render(<OlfactoryDnaSkeleton />);
    expect(screen.getByRole('status', { name: 'Carregando o seu DNA olfativo' })).toBeVisible();
  });
});
