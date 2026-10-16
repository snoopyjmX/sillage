import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PolaroidLineCarousel, type PolaroidItem } from './polaroid-line-carousel';

const items: PolaroidItem[] = [
  {
    id: 'a',
    title: 'Alfa',
    caption: '13 de outubro',
    media: <span>fa</span>,
    href: '/perfumes/alfa',
  },
  { id: 'b', title: 'Beta', caption: '14 de outubro', media: <span>fb</span> },
  {
    id: 'c',
    title: 'Gama',
    caption: '15 de outubro',
    media: <span>fc</span>,
    href: '/perfumes/gama',
  },
];

const Path = () => <output aria-label="rota">{useLocation().pathname}</output>;

const renderCarousel = () =>
  render(
    <MemoryRouter>
      <PolaroidLineCarousel items={items} label="Varal de memórias" />
      <Path />
    </MemoryRouter>
  );

const status = () => screen.getByText(/^Foto \d+ de \d+/);

describe('PolaroidLineCarousel', () => {
  it('é um carrossel com uma lâmina rotulada "N de M" por foto', () => {
    renderCarousel();
    expect(screen.getByRole('region', { name: 'Varal de memórias' })).toHaveAttribute(
      'aria-roledescription',
      'carrossel'
    );
    expect(screen.getAllByRole('group').map((slide) => slide.getAttribute('aria-label'))).toEqual([
      '1 de 3: Alfa',
      '2 de 3: Beta',
      '3 de 3: Gama',
    ]);
    expect(status()).toHaveTextContent('Foto 1 de 3: Alfa');
  });

  it('só a foto ativa entra na ordem de tabulação; as fotos com destino viram link', () => {
    renderCarousel();
    expect(screen.getAllByRole('link', { hidden: true })).toHaveLength(2);
    const [alfa, gama] = screen.getAllByRole('link', { hidden: true });
    expect(alfa).toHaveAttribute('href', '/perfumes/alfa');
    expect(alfa).toHaveAttribute('tabindex', '0');
    expect(gama).toHaveAttribute('tabindex', '-1');
  });

  it('Próximo e Anterior trocam a foto e respeitam as pontas', () => {
    renderCarousel();
    const previous = screen.getByRole('button', { name: 'Anterior' });
    const next = screen.getByRole('button', { name: 'Próximo' });
    expect(previous).toBeDisabled();
    fireEvent.click(next);
    expect(status()).toHaveTextContent('Foto 2 de 3: Beta');
    fireEvent.click(next);
    expect(status()).toHaveTextContent('Foto 3 de 3: Gama');
    expect(next).toBeDisabled();
    fireEvent.click(previous);
    expect(status()).toHaveTextContent('Foto 2 de 3: Beta');
  });

  it('as setas do teclado percorrem as fotos', () => {
    renderCarousel();
    const region = screen.getByRole('region', { name: 'Varal de memórias' });
    expect(region).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(region, { key: 'ArrowRight' });
    fireEvent.keyDown(region, { key: 'ArrowRight' });
    fireEvent.keyDown(region, { key: 'ArrowRight' });
    expect(status()).toHaveTextContent('Foto 3 de 3: Gama');
    fireEvent.keyDown(region, { key: 'ArrowLeft' });
    expect(status()).toHaveTextContent('Foto 2 de 3: Beta');
  });

  it('clicar numa foto fora do centro a traz para o centro; só a ativa navega', () => {
    renderCarousel();
    const [, gama] = screen.getAllByRole('link', { hidden: true });
    fireEvent.click(gama as HTMLElement);
    expect(status()).toHaveTextContent('Foto 3 de 3: Gama');
    expect(screen.getByLabelText('rota')).toHaveTextContent('/');
    fireEvent.click(screen.getAllByRole('link', { hidden: true })[1] as HTMLElement);
    expect(screen.getByLabelText('rota')).toHaveTextContent('/perfumes/gama');
  });
});
