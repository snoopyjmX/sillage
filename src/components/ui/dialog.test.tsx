import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import { describe, expect, it } from 'vitest';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog';

const setup = () =>
  render(
    <MotionConfig reducedMotion="always">
      <Dialog>
        <DialogTrigger>Abrir</DialogTrigger>
        <DialogContent>
          <DialogTitle>Título</DialogTitle>
          <DialogDescription>Descrição</DialogDescription>
          <button type="button">Primeiro</button>
          <button type="button">Segundo</button>
        </DialogContent>
      </Dialog>
    </MotionConfig>
  );

describe('Dialog', () => {
  it('abre com foco dentro do diálogo', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    const dialog = await screen.findByRole('dialog', { name: 'Título' });
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it('prende o foco: Tab no último elemento volta ao primeiro', async () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    const dialog = await screen.findByRole('dialog');
    const close = screen.getByRole('button', { name: 'Fechar' });
    close.focus();
    fireEvent.keyDown(close, { key: 'Tab' });
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(screen.getByRole('button', { name: 'Primeiro' })).toHaveFocus();
  });

  it('Escape fecha e devolve o foco ao gatilho', async () => {
    setup();
    const trigger = screen.getByRole('button', { name: 'Abrir' });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
