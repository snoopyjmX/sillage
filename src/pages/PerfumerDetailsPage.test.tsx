import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/constants/errors';
import { fakeSession } from '@/test/authMock';
import { renderApp } from '@/test/renderApp';
import type { PerfumerDetail } from '@/types/catalog';

const getBySlug = vi.fn();
vi.mock('@/services/perfumerService', () => ({
  perfumerService: { getBySlug: (slug: string) => getBySlug(slug) },
}));

const auth = await vi.hoisted(async () => (await import('@/test/authMock')).createAuthMock());
vi.mock('@/services/authService', () => ({ authService: auth.service }));

vi.mock('@/services/collectionService', () => ({
  collectionService: { list: () => Promise.resolve([]) },
}));

const perfumer: PerfumerDetail = {
  id: 'n1',
  slug: 'olivier-cresp',
  name: 'Olivier Cresp',
  bio: 'Nariz francês.',
  country: 'França',
  perfumes: [
    {
      id: 'p1',
      slug: 'malbec-signature',
      name: 'Malbec Signature',
      brandName: 'O Boticário',
      brandSlug: 'o-boticario',
      concentration: 'edp',
      gender: 'unisex',
      releaseYear: 2022,
      imagePath: null,
      families: ['woody'],
    },
  ],
};

describe('página do perfumista', () => {
  beforeEach(() => {
    getBySlug.mockReset();
    auth.reset();
    auth.setInitialSession(fakeSession());
  });

  it('mostra nome, país, bio e os perfumes dele', async () => {
    getBySlug.mockResolvedValue(perfumer);
    renderApp('/perfumers/olivier-cresp');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Olivier Cresp' }, { timeout: 8000 })
    ).toBeInTheDocument();
    expect(getBySlug).toHaveBeenCalledWith('olivier-cresp');
    expect(screen.getByText('França')).toBeInTheDocument();
    expect(screen.getByText('Nariz francês.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Malbec Signature/ })).toHaveAttribute(
      'href',
      '/perfumes/malbec-signature'
    );
  });

  it('sem país nem bio, mostra só o nome', async () => {
    getBySlug.mockResolvedValue({ ...perfumer, bio: null, country: null });
    renderApp('/perfumers/olivier-cresp');
    await screen.findByRole('heading', { level: 1, name: 'Olivier Cresp' }, { timeout: 8000 });
    expect(screen.queryByText('França')).not.toBeInTheDocument();
    expect(screen.queryByText('Nariz francês.')).not.toBeInTheDocument();
  });

  it('sem perfumes no catálogo, mostra o estado vazio', async () => {
    getBySlug.mockResolvedValue({ ...perfumer, perfumes: [] });
    renderApp('/perfumers/olivier-cresp');
    expect(
      await screen.findByText('Nenhuma fragrância por aqui ainda', {}, { timeout: 8000 })
    ).toBeInTheDocument();
  });

  it('slug inexistente mostra "Perfumista não encontrado"', async () => {
    getBySlug.mockRejectedValue(new AppError('not_found'));
    renderApp('/perfumers/nao-existe');
    expect(
      await screen.findByRole(
        'heading',
        { level: 1, name: 'Perfumista não encontrado' },
        { timeout: 8000 }
      )
    ).toBeInTheDocument();
  });

  it('falha mostra o erro com "Tentar novamente", sem texto técnico', async () => {
    getBySlug.mockRejectedValue(new AppError('unknown'));
    renderApp('/perfumers/olivier-cresp');
    expect(
      await screen.findByText('Não foi possível carregar o perfumista', {}, { timeout: 8000 })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });
});
