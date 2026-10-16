import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

const renderCarousel = () =>
  render(
    <MemoryRouter>
      <PolaroidLineCarousel items={items} label="Varal de memórias" />
    </MemoryRouter>
  );

const scrollBy = vi.fn();

describe('PolaroidLineCarousel', () => {
  beforeEach(() => {
    scrollBy.mockReset();
    Element.prototype.scrollBy = scrollBy as unknown as typeof Element.prototype.scrollBy;
  });
  afterEach(() => {
    Reflect.deleteProperty(Element.prototype, 'scrollBy');
  });

  it('é um carrossel com uma lâmina rotulada "N de M" por foto', () => {
    renderCarousel();
    expect(screen.getByRole('region', { name: 'Varal de memórias' })).toHaveAttribute(
      'aria-roledescription',
      'carrossel'
    );
    const slides = screen.getAllByRole('group');
    expect(slides.map((slide) => slide.getAttribute('aria-label'))).toEqual([
      '1 de 3: Alfa',
      '2 de 3: Beta',
      '3 de 3: Gama',
    ]);
  });

  it('só as fotos com destino viram link', () => {
    renderCarousel();
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(within(screen.getByRole('group', { name: /Beta/ })).queryByRole('link')).toBeNull();
    expect(screen.getByRole('link', { name: /Alfa/ })).toHaveAttribute('href', '/perfumes/alfa');
  });

  it('Próximo e Anterior rolam a trilha', () => {
    renderCarousel();
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(scrollBy).toHaveBeenLastCalledWith(
      expect.objectContaining({ left: expect.any(Number) })
    );
    expect(scrollBy.mock.calls[0]?.[0].left).toBeGreaterThanOrEqual(0);
  });

  it('Anterior começa desabilitado (já está no início)', () => {
    renderCarousel();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
  });

  it('as setas do teclado percorrem a trilha', () => {
    renderCarousel();
    const track = screen.getByLabelText(/use as setas/);
    fireEvent.keyDown(track, { key: 'ArrowRight' });
    fireEvent.keyDown(track, { key: 'ArrowLeft' });
    expect(scrollBy).toHaveBeenCalledTimes(2);
    expect(scrollBy.mock.calls[0]?.[0].left).toBeGreaterThanOrEqual(0);
    expect(scrollBy.mock.calls[1]?.[0].left).toBeLessThanOrEqual(0);
  });

  it('a trilha é focável pelo teclado', () => {
    renderCarousel();
    expect(screen.getByLabelText(/use as setas/)).toHaveAttribute('tabindex', '0');
  });
});
