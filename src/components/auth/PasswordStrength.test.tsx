import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PasswordStrength } from '@/components/auth/PasswordStrength';

describe('PasswordStrength', () => {
  it('vazio: sem medidor', () => {
    render(<PasswordStrength value="" />);
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });

  it('mostra nível e texto', () => {
    render(<PasswordStrength value="abcdefg1" />);
    const meter = screen.getByRole('meter', { name: 'Força da senha' });
    expect(meter).toHaveAttribute('aria-valuenow', '2');
    expect(meter).toHaveAttribute('aria-valuetext', 'Razoável');
  });

  it('avisa de padrão fraco', () => {
    render(<PasswordStrength value="qwerty12" />);
    expect(screen.getByText(/Evite sequências/)).toBeInTheDocument();
  });
});
