import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnnualRecap } from '@/types/recap';
import { RecapSlides } from './RecapSlides';

// Sem animação nos testes: a troca de lâmina é instantânea
vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => true,
}));

const perfume = (slug: string, name: string, days: number) => ({
  slug,
  name,
  brandName: 'Granado',
  imageUrl: null,
  days,
});

const recap: AnnualRecap = {
  year: 2026,
  daysWorn: 248,
  daysElapsed: 287,
  consistency: 0.8641,
  signature: perfume('bossa', 'Bossa', 80),
  seasons: {
    summer: perfume('bossa', 'Bossa', 40),
    autumn: perfume('boemia', 'Boemia', 20),
    winter: null,
    spring: perfume('gigi', 'Gigi', 10),
  },
  topNote: { slug: 'cedro', name: 'Cedro', family: 'woody', weight: 90 },
  families: {
    firstSemester: [{ family: 'citrus', weight: 9 }],
    secondSemester: [{ family: 'woody', weight: 7 }],
  },
};

const onShare = vi.fn();

const renderSlides = (overrides: Partial<AnnualRecap> = {}, isSharing = false) =>
  render(
    <MemoryRouter>
      <RecapSlides recap={{ ...recap, ...overrides }} onShare={onShare} isSharing={isSharing} />
    </MemoryRouter>
  );

const next = () => fireEvent.click(screen.getByRole('button', { name: /Próxima/ }));

describe('RecapSlides', () => {
  beforeEach(() => onShare.mockReset());

  it('começa pela lâmina de dias, com a consistência', () => {
    renderSlides();
    expect(screen.getByRole('group', { name: 'Lâmina 1 de 5' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Você vestiu perfume em 248 dias' })
    ).toBeInTheDocument();
    expect(screen.getByText('86%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled();
  });

  it('a lâmina 2 é a assinatura, com link para o perfume', () => {
    renderSlides();
    next();
    expect(screen.getByRole('heading', { name: 'Sua fragrância assinatura' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bossa' })).toHaveAttribute('href', '/perfumes/bossa');
    expect(screen.getByText(/80 dias/)).toBeInTheDocument();
  });

  it('a lâmina 3 mostra as quatro estações; a sem registros diz isso', () => {
    renderSlides();
    next();
    next();
    expect(screen.getByRole('heading', { name: 'Suas quatro estações' })).toBeInTheDocument();
    expect(screen.getByText(/Verão · dezembro a fevereiro/)).toBeInTheDocument();
    expect(screen.getByText(/Inverno · junho a agosto/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Boemia' })).toHaveAttribute(
      'href',
      '/perfumes/boemia'
    );
    expect(screen.getByText('Sem registros')).toBeInTheDocument();
  });

  it('a lâmina 4 mostra a nota do ano e a evolução entre os semestres', () => {
    renderSlides();
    next();
    next();
    next();
    expect(
      screen.getByRole('heading', { name: 'A nota que definiu o seu ano' })
    ).toBeInTheDocument();
    expect(screen.getByText('Cedro')).toBeInTheDocument();
    expect(
      screen.getByText(/no 1º semestre predominou o cítrico; no 2º, o amadeirado/)
    ).toBeInTheDocument();
  });

  it('família constante nos dois semestres vira "gosto constante"', () => {
    renderSlides({
      families: {
        firstSemester: [{ family: 'woody', weight: 3 }],
        secondSemester: [{ family: 'woody', weight: 5 }],
      },
    });
    next();
    next();
    next();
    expect(screen.getByText(/Seu gosto foi constante: o amadeirado/)).toBeInTheDocument();
  });

  it('a última lâmina resume o ano e oferece compartilhar e o Memorial', () => {
    renderSlides();
    next();
    next();
    next();
    next();
    expect(screen.getByRole('heading', { name: 'Seu 2026 em perfumes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Próxima/ })).toBeDisabled();
    expect(screen.getByRole('link', { name: /Ver o Memorial/ })).toHaveAttribute(
      'href',
      '/memorial'
    );
    // Sem painel de compartilhar (jsdom), o botão avisa que baixa a imagem
    fireEvent.click(screen.getByRole('button', { name: 'Baixar imagem' }));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('com painel de compartilhar no aparelho, o botão diz Compartilhar', () => {
    vi.stubGlobal('navigator', { ...navigator, canShare: () => true });
    try {
      renderSlides();
      next();
      next();
      next();
      next();
      expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('enquanto gera a imagem, o botão fica ocupado e não repete o clique', () => {
    renderSlides({}, true);
    next();
    next();
    next();
    next();
    const button = screen.getByRole('button', { name: /Gerando a imagem/ });
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(onShare).not.toHaveBeenCalled();
  });

  it('as setas do teclado trocam de lâmina e Anterior volta', () => {
    renderSlides();
    const carousel = screen.getByRole('region', { name: 'Seu ano em perfumes, 2026' });
    fireEvent.keyDown(carousel, { key: 'ArrowRight' });
    expect(screen.getByRole('group', { name: 'Lâmina 2 de 5' })).toBeInTheDocument();
    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    expect(screen.getByRole('group', { name: 'Lâmina 1 de 5' })).toBeInTheDocument();
    fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
    expect(screen.getByRole('group', { name: 'Lâmina 1 de 5' })).toBeInTheDocument();
  });
});
