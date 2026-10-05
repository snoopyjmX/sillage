import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Rating } from './rating';

const radios = () => screen.getAllByRole('radio');

describe('Rating', () => {
  it('é um radiogroup com 5 rádios e nome acessível', () => {
    render(<Rating label="Fixação" />);
    expect(screen.getByRole('radiogroup', { name: 'Fixação' })).toBeInTheDocument();
    expect(radios()).toHaveLength(5);
  });

  it('cada rádio tem área de toque de 44px (size-11)', () => {
    render(<Rating label="Fixação" />);
    for (const radio of radios()) expect(radio).toHaveClass('size-11');
  });

  it('marca o valor selecionado ao clicar e avisa quem usa', () => {
    const onValueChange = vi.fn();
    render(<Rating label="Fixação" onValueChange={onValueChange} />);
    fireEvent.click(radios()[3]!);
    expect(radios()[3]).toHaveAttribute('aria-checked', 'true');
    expect(radios()[0]).toHaveAttribute('aria-checked', 'false');
    expect(onValueChange).toHaveBeenCalledWith(4);
  });

  it('só o rádio marcado entra na ordem de tabulação (roving tabindex)', () => {
    render(<Rating label="Fixação" defaultValue={3} />);
    expect(radios().map((r) => r.tabIndex)).toEqual([-1, -1, 0, -1, -1]);
  });

  it('sem valor, o primeiro rádio é o alvo do Tab', () => {
    render(<Rating label="Fixação" />);
    expect(radios().map((r) => r.tabIndex)).toEqual([0, -1, -1, -1, -1]);
  });

  it('setas movem o foco e selecionam, com volta nas pontas', () => {
    render(<Rating label="Fixação" defaultValue={2} />);
    radios()[1]!.focus();
    fireEvent.keyDown(radios()[1]!, { key: 'ArrowRight' });
    expect(radios()[2]).toHaveAttribute('aria-checked', 'true');
    expect(radios()[2]).toHaveFocus();
    fireEvent.keyDown(radios()[2]!, { key: 'ArrowLeft' });
    expect(radios()[1]).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(radios()[1]!, { key: 'ArrowUp' });
    fireEvent.keyDown(radios()[0]!, { key: 'ArrowLeft' });
    expect(radios()[4]).toHaveAttribute('aria-checked', 'true');
    fireEvent.keyDown(radios()[4]!, { key: 'ArrowDown' });
    expect(radios()[0]).toHaveAttribute('aria-checked', 'true');
  });

  it('Home vai ao primeiro e End ao último', () => {
    render(<Rating label="Fixação" defaultValue={3} />);
    radios()[2]!.focus();
    fireEvent.keyDown(radios()[2]!, { key: 'End' });
    expect(radios()[4]).toHaveAttribute('aria-checked', 'true');
    expect(radios()[4]).toHaveFocus();
    fireEvent.keyDown(radios()[4]!, { key: 'Home' });
    expect(radios()[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios()[0]).toHaveFocus();
  });

  it('desabilitado não muda de valor', () => {
    const onValueChange = vi.fn();
    render(<Rating label="Fixação" defaultValue={2} disabled onValueChange={onValueChange} />);
    fireEvent.click(radios()[4]!);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(radios()[1]).toHaveAttribute('aria-checked', 'true');
  });

  it('mostra o valor com vírgula decimal (pt-BR)', () => {
    render(<Rating label="Fixação" readOnly value={4.2} showValue />);
    expect(screen.getByRole('img', { name: 'Fixação: 4,2 de 5' })).toBeInTheDocument();
    expect(screen.getByText('4,2')).toBeInTheDocument();
  });
});
