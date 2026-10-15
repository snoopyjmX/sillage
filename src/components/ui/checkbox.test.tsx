import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox', () => {
  it('é nomeado pelo label e alterna ao clicar no texto', () => {
    const onChange = vi.fn();
    render(
      <Checkbox
        label="Mostrar a cidade"
        checked={false}
        onChange={(event) => onChange(event.target.checked)}
      />
    );
    expect(screen.getByRole('checkbox', { name: 'Mostrar a cidade' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Mostrar a cidade'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('desabilitado não alterna', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Opção" disabled onChange={onChange} />);
    fireEvent.click(screen.getByText('Opção'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('entrega o ref ao input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox label="Opção" ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('checkbox'));
  });
});
