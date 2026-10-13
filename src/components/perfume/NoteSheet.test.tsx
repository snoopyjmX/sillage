import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PyramidNote } from '@/types/catalog';
import { NoteSheet } from './NoteSheet';

const note: PyramidNote = {
  slug: 'vetiver',
  name: 'Vetiver',
  family: 'woody',
  position: 'base',
  description: 'Raiz aromática, terrosa e fresca.',
};

const mockDesktop = (matches: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );

const renderSheet = (props: { open: boolean; onOpenChange?: (open: boolean) => void }) =>
  render(
    <MemoryRouter>
      <NoteSheet note={note} onOpenChange={props.onOpenChange ?? vi.fn()} open={props.open} />
    </MemoryRouter>
  );

describe('NoteSheet', () => {
  afterEach(() => vi.unstubAllGlobals());

  for (const [label, desktop] of [
    ['Dialog (desktop)', true],
    ['Drawer (celular)', false],
  ] as const) {
    it(`${label}: mostra nome, camada com tempo, família, descrição e o link`, async () => {
      mockDesktop(desktop);
      renderSheet({ open: true });
      expect(await screen.findByRole('dialog', { name: 'Vetiver' })).toBeInTheDocument();
      expect(screen.getByText('Fundo · 4 h ou mais')).toBeInTheDocument();
      expect(screen.getByText('Amadeirado')).toBeInTheDocument();
      expect(screen.getByText('Raiz aromática, terrosa e fresca.')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Ver perfumes com Vetiver no Fundo' })
      ).toHaveAttribute('href', '/catalog?notes=vetiver&pos=base');
    });
  }

  it('Esc pede para fechar', async () => {
    mockDesktop(true);
    const onOpenChange = vi.fn();
    renderSheet({ open: true, onOpenChange });
    fireEvent.keyDown(await screen.findByRole('dialog'), { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('fechado não renderiza o painel', () => {
    mockDesktop(true);
    renderSheet({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
