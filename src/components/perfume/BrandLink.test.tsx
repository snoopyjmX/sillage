import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { BrandLink } from './BrandLink';

describe('BrandLink', () => {
  it('leva ao catálogo filtrado pela marca', () => {
    render(
      <MemoryRouter>
        <BrandLink brandName="O Boticário" brandSlug="o-boticario" />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'O Boticário' })).toHaveAttribute(
      'href',
      '/catalog?brands=o-boticario'
    );
  });
});
