import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PyramidNote } from '@/types/catalog';
import { OlfactoryPyramid } from './OlfactoryPyramid';

const notes: PyramidNote[] = [
  { slug: 'bergamota', name: 'Bergamota', family: 'citrus', position: 'top' },
  { slug: 'lima', name: 'Lima', family: 'citrus', position: 'top' },
  { slug: 'lavanda', name: 'Lavanda', family: 'aromatic', position: 'heart' },
  { slug: 'vetiver', name: 'Vetiver', family: 'woody', position: 'base' },
];

const renderPyramid = (list = notes) =>
  render(
    <MemoryRouter>
      <OlfactoryPyramid notes={list} />
    </MemoryRouter>
  );

const layerButton = (name: RegExp) => screen.getByRole('button', { name });

const mockDesktop = (matches: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );

describe('OlfactoryPyramid', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('mostra as camadas na ordem Topo, Coração, Fundo', () => {
    renderPyramid();
    const names = screen.getAllByRole('button').map((button) => button.textContent);
    expect(names).toEqual(['Topo2 notas', 'Coração1 nota', 'Fundo1 nota']);
  });

  it('no celular só o Topo começa aberto', () => {
    mockDesktop(false);
    renderPyramid();
    expect(layerButton(/^Topo/)).toHaveAttribute('aria-expanded', 'true');
    expect(layerButton(/^Coração/)).toHaveAttribute('aria-expanded', 'false');
    expect(layerButton(/^Fundo/)).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('link', { name: /^Bergamota/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Vetiver/ })).not.toBeInTheDocument();
  });

  it('no desktop todas começam abertas', () => {
    mockDesktop(true);
    renderPyramid();
    for (const name of [/^Topo/, /^Coração/, /^Fundo/]) {
      expect(layerButton(name)).toHaveAttribute('aria-expanded', 'true');
    }
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('o botão abre e fecha a camada (o teclado é coberto no E2E)', async () => {
    mockDesktop(false);
    renderPyramid();
    const heart = layerButton(/^Coração/);

    fireEvent.click(heart);
    expect(heart).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByRole('link', { name: /^Lavanda/ })).toBeInTheDocument();

    fireEvent.click(heart);
    expect(heart).toHaveAttribute('aria-expanded', 'false');
  });

  it('cada nota leva ao catálogo filtrado por nota e posição', () => {
    renderPyramid();
    expect(screen.getByRole('link', { name: /^Lima/ })).toHaveAttribute(
      'href',
      '/catalog?notes=lima&pos=top'
    );
  });

  it('não mostra camadas sem nota', () => {
    renderPyramid(notes.filter((note) => note.position === 'top'));
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
