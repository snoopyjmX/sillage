import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_STORAGE_KEY } from '@/lib/theme';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ThemeProvider } from './ThemeProvider';

const mockSystem = (dark: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: dark && query.includes('dark'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
};

const renderToggle = () =>
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );

describe('tema', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = '';
  });
  afterEach(() => vi.unstubAllGlobals());

  it('padrão é sistema: segue o sistema claro', () => {
    mockSystem(false);
    renderToggle();
    expect(document.documentElement).not.toHaveClass('dark');
    expect(screen.getByRole('button', { name: /Tema: Sistema/ })).toBeInTheDocument();
  });

  it('padrão é sistema: segue o sistema escuro', () => {
    mockSystem(true);
    renderToggle();
    expect(document.documentElement).toHaveClass('dark');
  });

  it('alterna claro -> escuro -> sistema e persiste a escolha', () => {
    mockSystem(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    renderToggle();
    expect(document.documentElement).not.toHaveClass('dark');

    fireEvent.click(screen.getByRole('button', { name: /Tema: Claro/ }));
    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    fireEvent.click(screen.getByRole('button', { name: /Tema: Escuro/ }));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('lê a escolha salva ao carregar', () => {
    mockSystem(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    renderToggle();
    expect(document.documentElement).toHaveClass('dark');
  });

  it('funciona mesmo se o localStorage lançar erro', () => {
    mockSystem(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    renderToggle();
    fireEvent.click(screen.getByRole('button', { name: /Tema: Sistema/ }));
    expect(document.documentElement).not.toHaveClass('dark');
    vi.restoreAllMocks();
  });
});
