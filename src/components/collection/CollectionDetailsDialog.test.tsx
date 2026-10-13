import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PerfumeSummary } from '@/types/catalog';
import type { CollectionDetails } from '@/types/collection';
import { CollectionDetailsDialog } from './CollectionDetailsDialog';

const online = vi.hoisted(() => ({ value: true }));
vi.mock('@/hooks/useOnlineStatus', () => ({ useOnlineStatus: () => online.value }));

const perfume: PerfumeSummary = {
  id: 'p1',
  slug: 'malbec',
  name: 'Malbec',
  brandName: 'O Boticário',
  brandSlug: 'o-boticario',
  concentration: 'edp',
  gender: 'unisex',
  releaseYear: 2022,
  imagePath: null,
  families: ['woody'],
};

const none: CollectionDetails = { format: null, volumeMl: null };

const setup = (initial: CollectionDetails = none) => {
  const onSave = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <MotionConfig reducedMotion="always">
      <CollectionDetailsDialog
        open
        onOpenChange={onOpenChange}
        perfume={perfume}
        initial={initial}
        onSave={onSave}
      />
    </MotionConfig>
  );
  return { onSave, onOpenChange };
};

describe('CollectionDetailsDialog (RN11)', () => {
  beforeEach(() => {
    online.value = true;
  });

  it('abre com o perfume, os três formatos e sem volume até escolher o formato', async () => {
    setup();
    const dialog = await screen.findByRole('dialog', { name: 'Detalhar formato' });
    expect(within(dialog).getByText(/Malbec, O Boticário/)).toBeInTheDocument();
    for (const name of ['Frasco', 'Decant', 'Amostra']) {
      expect(within(dialog).getByRole('radio', { name })).not.toBeChecked();
    }
    expect(
      within(dialog).queryByRole('group', { name: 'Volume sugerido' })
    ).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });

  it.each([
    ['Frasco', ['30 ml', '50 ml', '75 ml', '100 ml', '200 ml']],
    ['Decant', ['2 ml', '5 ml', '10 ml', '15 ml', '20 ml']],
    ['Amostra', ['1 ml', '2 ml', '3 ml']],
  ])('%s oferece os volumes sugeridos do formato (D9)', async (format, volumes) => {
    setup();
    fireEvent.click(await screen.findByRole('radio', { name: format }));
    const group = screen.getByRole('group', { name: 'Volume sugerido' });
    expect(
      within(group)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual(volumes);
  });

  it('escolhe o formato e um volume sugerido e salva', async () => {
    const { onSave, onOpenChange } = setup();
    fireEvent.click(await screen.findByRole('radio', { name: 'Decant' }));
    fireEvent.click(screen.getByRole('button', { name: '10 ml' }));
    expect(screen.getByRole('button', { name: '10 ml' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSave).toHaveBeenCalledWith({ format: 'decant', volumeMl: 10 });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('aceita outro volume com vírgula decimal', async () => {
    const { onSave } = setup();
    fireEvent.click(await screen.findByRole('radio', { name: 'Amostra' }));
    fireEvent.change(screen.getByLabelText('Outro volume (ml)'), { target: { value: '2,5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSave).toHaveBeenCalledWith({ format: 'sample', volumeMl: 2.5 });
  });

  it('formato sem volume é válido (o volume é opcional)', async () => {
    const { onSave } = setup();
    fireEvent.click(await screen.findByRole('radio', { name: 'Frasco' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSave).toHaveBeenCalledWith({ format: 'bottle', volumeMl: null });
  });

  it.each(['abc', '0', '1001', '2,55'])(
    'volume inválido %j mostra o erro e não salva',
    async (typed) => {
      const { onSave } = setup();
      fireEvent.click(await screen.findByRole('radio', { name: 'Frasco' }));
      fireEvent.change(screen.getByLabelText('Outro volume (ml)'), { target: { value: typed } });
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
      expect(await screen.findByText(/volume de até 1\.000 ml/)).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    }
  );

  it('trocar de formato recomeça o volume', async () => {
    setup({ format: 'bottle', volumeMl: 100 });
    expect(await screen.findByRole('button', { name: '100 ml' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Decant' }));
    expect(screen.getByLabelText('Outro volume (ml)')).toHaveValue('');
  });

  it('vem preenchido com o que já foi detalhado e permite remover os detalhes', async () => {
    const { onSave, onOpenChange } = setup({ format: 'decant', volumeMl: 5 });
    expect(await screen.findByRole('radio', { name: 'Decant' })).toBeChecked();
    expect(screen.getByRole('button', { name: '5 ml' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Remover detalhes' }));
    expect(onSave).toHaveBeenCalledWith({ format: null, volumeMl: null });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('sem nada detalhado não há "Remover detalhes"', async () => {
    setup();
    await screen.findByRole('dialog');
    expect(screen.queryByRole('button', { name: 'Remover detalhes' })).not.toBeInTheDocument();
  });

  it('Cancelar fecha sem salvar', async () => {
    const { onSave, onOpenChange } = setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('offline: salvar e remover ficam desabilitados', async () => {
    online.value = false;
    setup({ format: 'bottle', volumeMl: 50 });
    expect(await screen.findByRole('button', { name: 'Salvar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remover detalhes' })).toBeDisabled();
  });
});
