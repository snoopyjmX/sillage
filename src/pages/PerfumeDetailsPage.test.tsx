import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { renderApp } from '@/test/renderApp';
import type { PerfumeDetail } from '@/types/catalog';

const getBySlug = vi.fn();
vi.mock('@/services/perfumeService', () => ({
  perfumeService: { getBySlug: (slug: string) => getBySlug(slug) },
}));

vi.mock('@/services/collectionService', () => ({
  collectionService: { list: () => Promise.resolve([]) },
}));

const detail: PerfumeDetail = {
  id: 'p1',
  slug: 'amyi-2-15',
  name: 'Amyi 2.15',
  description: 'Um perfume de teste.',
  brandName: 'Amyi',
  brandSlug: 'amyi',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: 2022,
  imageUrl: null,
  notes: [
    { slug: 'bergamota', name: 'Bergamota', family: 'citrus', position: 'top' },
    { slug: 'vetiver', name: 'Vetiver', family: 'woody', position: 'base' },
  ],
};

describe('página de detalhes do perfume', () => {
  beforeEach(() => {
    getBySlug.mockReset();
  });

  it('mostra marca, nome, concentração, pirâmide e o CTA de coleção ativo', async () => {
    getBySlug.mockResolvedValue(detail);
    renderApp('/perfumes/amyi-2-15');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Amyi 2.15' }, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(getBySlug).toHaveBeenCalledWith('amyi-2-15');
    expect(screen.getByText('Amyi')).toBeInTheDocument();
    expect(screen.getByText('EDP')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Pirâmide olfativa' })).toBeInTheDocument();
    const cta = screen.getByRole('button', { name: /Adicionar à Coleção/ });
    expect(cta).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByText('Em breve')).not.toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Amyi 2.15 · Amyi · Sillage'));
  });

  it('slug inexistente mostra "Perfume não encontrado" com saída para o catálogo', async () => {
    getBySlug.mockImplementation(() => Promise.reject(new AppError('not_found')));
    renderApp('/perfumes/nao-existe');
    expect(
      await screen.findByRole(
        'heading',
        { name: 'Perfume não encontrado', level: 3 },
        { timeout: 3000 }
      )
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Voltar ao catálogo' })[0]).toHaveAttribute(
      'href',
      '/catalog'
    );
    expect(getBySlug).toHaveBeenCalledTimes(1);
  });

  it('erro de rede mostra a mensagem amigável e tenta de novo pelo botão', async () => {
    getBySlug.mockImplementation(() => Promise.reject(new AppError('network')));
    renderApp('/perfumes/amyi-2-15');
    expect(await screen.findByRole('alert', {}, { timeout: 3000 })).toHaveTextContent(
      'Sem conexão com o servidor'
    );
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });
});
