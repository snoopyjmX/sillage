import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BestPrice } from './BestPrice';

const offer = {
  name: 'Malbec Signature',
  lowestPriceCents: 24900,
  storeName: 'O Boticário',
  storeUrl: 'https://www.boticario.com.br',
};

describe('BestPrice', () => {
  it('formata o preço em reais e abre a loja em nova aba sem vazar o opener', () => {
    render(<BestPrice perfume={offer} />);
    expect(screen.getByText(/249,00/)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Melhor preço encontrado' })).toHaveTextContent(
      /na O Boticário/
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://www.boticario.com.br');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('usa o domínio quando a loja não tem nome', () => {
    render(<BestPrice perfume={{ ...offer, storeName: null }} />);
    expect(screen.getByRole('region')).toHaveTextContent(/na boticario\.com\.br/);
  });

  it.each([
    ['sem preço', { ...offer, lowestPriceCents: null }],
    ['sem link', { ...offer, storeUrl: null }],
    ['com link javascript:', { ...offer, storeUrl: 'javascript:alert(1)' }],
    ['com link inválido', { ...offer, storeUrl: 'não é url' }],
  ])('não renderiza nada %s', (_label, perfume) => {
    const { container } = render(<BestPrice perfume={perfume} />);
    expect(container).toBeEmptyDOMElement();
  });
});
