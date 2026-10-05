import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { NoteOption } from '@/types/catalog';
import { NoteCombobox } from './NoteCombobox';

const notes: NoteOption[] = [
  { slug: 'bergamota', name: 'Bergamota', family: 'citrus' },
  { slug: 'lirio-do-vale', name: 'Lírio-do-vale', family: 'floral' },
  { slug: 'iris', name: 'Íris', family: 'floral' },
];

const setup = (selected: string[] = []) => {
  const onToggle = vi.fn();
  render(
    <NoteCombobox notes={notes} selected={selected} onToggle={onToggle} label="Buscar nota" />
  );
  return { onToggle, input: screen.getByRole('combobox', { name: 'Buscar nota' }) };
};

describe('NoteCombobox', () => {
  it('filtra sem acento e sem caixa', () => {
    const { input } = setup();
    fireEvent.change(input, { target: { value: 'LIRIO' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: /Lírio-do-vale/ })).toBeInTheDocument();
  });

  it('abre ao focar e expõe o estado aos leitores de tela', () => {
    const { input } = setup();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    fireEvent.focus(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('setas movem a opção ativa e Enter marca', () => {
    const { input, onToggle } = setup();
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const active = screen.getByRole('option', { name: /Lírio-do-vale/ });
    expect(input).toHaveAttribute('aria-activedescendant', active.id);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onToggle).toHaveBeenCalledWith('lirio-do-vale');
    // Ao escolher, a lista fecha (senão cobriria os controles logo abaixo)
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('Esc fecha a lista', () => {
    const { input } = setup();
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('marca as notas já escolhidas', () => {
    const { input } = setup(['bergamota']);
    fireEvent.focus(input);
    expect(screen.getByRole('option', { name: /Bergamota/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('avisa quando nenhuma nota combina', () => {
    const { input } = setup();
    fireEvent.change(input, { target: { value: 'zzzz' } });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('Nenhuma nota encontrada')).toBeInTheDocument();
  });
});
