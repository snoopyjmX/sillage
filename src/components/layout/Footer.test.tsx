import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthContext, type AuthStatus } from '@/contexts/auth-context';
import { Footer } from './Footer';

const renderFooter = (status: AuthStatus) =>
  render(
    <AuthContext.Provider value={{ status, session: null, user: null }}>
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('Footer', () => {
  it('logado: links privados nas colunas Topo e Coração', () => {
    renderFooter('authenticated');
    const footer = within(screen.getByRole('contentinfo'));
    expect(footer.getByRole('link', { name: 'Catálogo' })).toHaveAttribute('href', '/catalog');
    expect(footer.getByRole('link', { name: 'Coleção' })).toHaveAttribute('href', '/collection');
    expect(footer.getByRole('link', { name: 'Perfil' })).toHaveAttribute('href', '/profile');
    expect(footer.getByRole('link', { name: 'Perfume do Dia' })).toHaveAttribute('href', '/');
    expect(footer.queryByRole('link', { name: 'Entrar' })).toBeNull();
  });

  it('visitante: Entrar e Criar conta no lugar dos links privados', () => {
    renderFooter('unauthenticated');
    const footer = within(screen.getByRole('contentinfo'));
    expect(footer.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    expect(footer.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/register');
    expect(footer.queryByRole('link', { name: 'Catálogo' })).toBeNull();
    expect(footer.queryByRole('link', { name: 'Perfil' })).toBeNull();
  });

  it('mostra a definição, o crédito e a versão; o rastro é decorativo', () => {
    const { container } = renderFooter('authenticated');
    expect(screen.getByText(/o rastro que o perfume deixa no ar/)).toBeInTheDocument();
    expect(screen.getByText('Feito por João Marcelo')).toBeInTheDocument();
    expect(screen.getByText(/^Versão /)).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('credita o Open-Meteo com o texto exato da licença e link', () => {
    renderFooter('unauthenticated');
    expect(screen.getByRole('link', { name: 'Weather data by Open-Meteo.com' })).toHaveAttribute(
      'href',
      'https://open-meteo.com/'
    );
  });
});
