import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PyramidNote } from '@/types/catalog';
import { OlfactoryPyramid } from './OlfactoryPyramid';

const notes: PyramidNote[] = [
  { slug: 'bergamota', name: 'Bergamota', family: 'citrus', position: 'top', description: null },
  { slug: 'lima', name: 'Lima', family: 'citrus', position: 'top', description: null },
  {
    slug: 'lavanda',
    name: 'Lavanda',
    family: 'aromatic',
    position: 'heart',
    description: 'Flor aromática limpa.',
  },
  { slug: 'vetiver', name: 'Vetiver', family: 'woody', position: 'base', description: null },
];

const renderPyramid = (list = notes) =>
  render(
    <MemoryRouter>
      <OlfactoryPyramid notes={list} />
    </MemoryRouter>
  );

const layerButton = (name: RegExp) => screen.getByRole('button', { name });
// Os botões de camada são os que controlam um painel (os chips das notas também são botões)
const layerButtons = () =>
  screen.getAllByRole('button').filter((button) => button.hasAttribute('aria-controls'));
const noteButton = (name: RegExp) => screen.getByRole('button', { name });

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

  it('mostra as camadas na ordem Topo, Coração, Fundo, com o tempo e a contagem', () => {
    renderPyramid();
    expect(layerButtons().map((button) => button.textContent)).toEqual([
      'Topo0–30 min · 2 notas',
      'Coração30 min–4 h · 1 nota',
      'Fundo4 h ou mais · 1 nota',
    ]);
  });

  it('no celular só o Topo começa aberto', () => {
    mockDesktop(false);
    renderPyramid();
    expect(layerButton(/^Topo/)).toHaveAttribute('aria-expanded', 'true');
    expect(layerButton(/^Coração/)).toHaveAttribute('aria-expanded', 'false');
    expect(layerButton(/^Fundo/)).toHaveAttribute('aria-expanded', 'false');
    expect(noteButton(/^Bergamota/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Vetiver/ })).not.toBeInTheDocument();
  });

  it('no desktop todas começam abertas', () => {
    mockDesktop(true);
    renderPyramid();
    for (const name of [/^Topo/, /^Coração/, /^Fundo/]) {
      expect(layerButton(name)).toHaveAttribute('aria-expanded', 'true');
    }
    for (const name of [/^Bergamota/, /^Lima/, /^Lavanda/, /^Vetiver/]) {
      expect(noteButton(name)).toBeInTheDocument();
    }
  });

  it('o botão abre e fecha a camada (o teclado é coberto no E2E)', async () => {
    mockDesktop(false);
    renderPyramid();
    const heart = layerButton(/^Coração/);

    fireEvent.click(heart);
    expect(heart).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByRole('button', { name: /^Lavanda/ })).toBeInTheDocument();

    fireEvent.click(heart);
    expect(heart).toHaveAttribute('aria-expanded', 'false');
  });

  it('resume o acorde dominante e lista as famílias com a porcentagem', () => {
    mockDesktop(false);
    renderPyramid();
    expect(screen.getByText('Cítrico · Amadeirado')).toBeInTheDocument();
    // geral: 2 de 4 notas são cítricas; no painel do Topo (aberto), 100%
    expect(screen.getByText('Cítrico 50%')).toBeInTheDocument();
    expect(screen.getByText('Cítrico 100%')).toBeInTheDocument();
  });

  it('o painel da camada traz a frase da camada', () => {
    mockDesktop(false);
    renderPyramid();
    expect(screen.getByText('A abertura: o que você sente ao borrifar')).toBeInTheDocument();
  });

  it('a nota abre o painel com a descrição e o link para o catálogo filtrado', async () => {
    mockDesktop(true);
    renderPyramid();
    fireEvent.click(noteButton(/^Lavanda/));

    const dialog = await screen.findByRole('dialog', { name: 'Lavanda' });
    expect(within(dialog).getByText('Flor aromática limpa.')).toBeInTheDocument();
    expect(within(dialog).getByText('Coração · 30 min–4 h')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('link', { name: 'Ver perfumes com Lavanda no Coração' })
    ).toHaveAttribute('href', '/catalog?notes=lavanda&pos=heart');
  });

  it('nota sem descrição mostra "Descrição em breve."', async () => {
    mockDesktop(true);
    renderPyramid();
    fireEvent.click(noteButton(/^Lima/));
    const dialog = await screen.findByRole('dialog', { name: 'Lima' });
    expect(within(dialog).getByText('Descrição em breve.')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('link', { name: 'Ver perfumes com Lima no Topo' })
    ).toHaveAttribute('href', '/catalog?notes=lima&pos=top');
  });

  it('não mostra camadas sem nota', () => {
    renderPyramid(notes.filter((note) => note.position === 'top'));
    expect(layerButtons()).toHaveLength(1);
  });

  it('sem nenhuma nota não mostra acorde nem camadas', () => {
    renderPyramid([]);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByText(/Acorde dominante/)).not.toBeInTheDocument();
  });
});
