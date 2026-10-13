import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
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

const noteButton = (name: RegExp) => screen.getByRole('button', { name });
const layerSection = (name: string) => screen.getByRole('region', { name });

describe('OlfactoryPyramid', () => {
  it('mostra as camadas na ordem Topo, Coração, Fundo, com o tempo e a contagem', () => {
    renderPyramid();
    const titles = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual(['Topo', 'Coração', 'Fundo']);
    expect(layerSection('Topo')).toHaveTextContent('0–30 min · 2 notas');
    expect(layerSection('Coração')).toHaveTextContent('30 min–4 h · 1 nota');
    expect(layerSection('Fundo')).toHaveTextContent('4 h ou mais · 1 nota');
  });

  it('as três camadas ficam sempre abertas, sem botão de acordeão', () => {
    renderPyramid();
    expect(document.querySelector('[aria-expanded]')).toBeNull();
    for (const name of [/^Bergamota/, /^Lima/, /^Lavanda/, /^Vetiver/]) {
      expect(noteButton(name)).toBeInTheDocument();
    }
  });

  it('a pirâmide mostra o nome e o tempo de cada camada dentro da faixa', () => {
    renderPyramid();
    const shape = document.querySelector('[data-slot="pyramid-shape"]') as HTMLElement;
    expect(shape).toHaveAttribute('aria-hidden', 'true');
    expect(shape).toHaveTextContent('Topo0–30 minCoração30 min–4 hFundo4 h ou mais');
    expect(shape).not.toHaveTextContent('sem notas');
  });

  it('camada sem notas aparece na pirâmide com a legenda "sem notas"', () => {
    renderPyramid(notes.filter((note) => note.position !== 'heart'));
    const shape = document.querySelector('[data-slot="pyramid-shape"]') as HTMLElement;
    expect(shape).toHaveTextContent('sem notas');
    expect(shape.querySelector('[data-position="heart"]')).toHaveClass('fill-muted');
  });

  it('passar o mouse na camada realça a faixa correspondente', () => {
    renderPyramid();
    const band = document.querySelector('[data-slot="pyramid-shape"] [data-position="base"]');
    expect(layerSection('Fundo')).not.toHaveClass('border-primary');
    fireEvent.mouseEnter(layerSection('Fundo'));
    expect(layerSection('Fundo')).toHaveClass('border-primary');
    expect(band).toBeInTheDocument();
    fireEvent.mouseLeave(layerSection('Fundo'));
    expect(layerSection('Fundo')).not.toHaveClass('border-primary');
  });

  it('resume o acorde dominante e lista as famílias com a porcentagem', () => {
    renderPyramid();
    expect(screen.getByText('Cítrico · Amadeirado')).toBeInTheDocument();
    // geral: 2 de 4 notas são cítricas (as camadas não repetem a barra)
    expect(screen.getByText('Cítrico 50%')).toBeInTheDocument();
    expect(screen.queryByText('Cítrico 100%')).not.toBeInTheDocument();
  });

  it('o painel da camada traz a frase da camada', () => {
    renderPyramid();
    expect(screen.getByText('A abertura: o que você sente ao borrifar')).toBeInTheDocument();
  });

  it('a nota abre o painel com a descrição e o link para o catálogo filtrado', async () => {
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
    renderPyramid();
    fireEvent.click(noteButton(/^Lima/));
    const dialog = await screen.findByRole('dialog', { name: 'Lima' });
    expect(within(dialog).getByText('Descrição em breve.')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('link', { name: 'Ver perfumes com Lima no Topo' })
    ).toHaveAttribute('href', '/catalog?notes=lima&pos=top');
  });

  it('não lista camadas sem nota ao lado da pirâmide', () => {
    renderPyramid(notes.filter((note) => note.position === 'top'));
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
  });

  it('sem nenhuma nota não mostra acorde nem camadas', () => {
    renderPyramid([]);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('heading')).toHaveLength(0);
    expect(screen.queryByText(/Acorde dominante/)).not.toBeInTheDocument();
  });
});
