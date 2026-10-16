import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { FamilyShare } from '@/lib/pyramid';
import { FamilyBar } from './FamilyBar';

const shares: FamilyShare[] = [
  { family: 'woody', count: 3, share: 0.6 },
  { family: 'citrus', count: 2, share: 0.4 },
];

const renderBar = (linkFamilies?: boolean) =>
  render(
    <MemoryRouter>
      <FamilyBar shares={shares} linkFamilies={linkFamilies} />
    </MemoryRouter>
  );

describe('FamilyBar', () => {
  it('mostra a legenda com os percentuais, sem links por padrão', () => {
    renderBar();
    const list = screen.getByRole('list', { name: 'Famílias olfativas' });
    expect(list).toHaveTextContent('Amadeirado 60%');
    expect(list).toHaveTextContent('Cítrico 40%');
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('com linkFamilies, cada família leva ao catálogo filtrado', () => {
    renderBar(true);
    expect(screen.getByRole('link', { name: 'Amadeirado 60%' })).toHaveAttribute(
      'href',
      '/catalog?families=woody'
    );
    expect(screen.getByRole('link', { name: 'Cítrico 40%' })).toHaveAttribute(
      'href',
      '/catalog?families=citrus'
    );
  });
});
