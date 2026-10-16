import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProfileStats } from './ProfileStats';

describe('ProfileStats', () => {
  it('cada cartão é um atalho para a tela correspondente', () => {
    render(
      <MemoryRouter>
        <ProfileStats owned={2} wanted={1} memorialDays={5} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /Tenho/ })).toHaveAttribute('href', '/collection');
    expect(screen.getByRole('link', { name: /Quero/ })).toHaveAttribute(
      'href',
      '/collection?tab=wanted'
    );
    expect(screen.getByRole('link', { name: /No memorial/ })).toHaveAttribute('href', '/memorial');
  });

  it('mantém os números e o singular/plural', () => {
    render(
      <MemoryRouter>
        <ProfileStats owned={1} wanted={0} memorialDays={1} />
      </MemoryRouter>
    );
    expect(screen.getByText('perfume')).toBeInTheDocument();
    expect(screen.getByText('dia registrado')).toBeInTheDocument();
  });
});
