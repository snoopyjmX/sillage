import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FAMILIES } from '@/constants/labels';
import { Chip } from './chip';

describe('Chip', () => {
  it('neutro por padrão', () => {
    render(<Chip>Nota</Chip>);
    expect(screen.getByText('Nota')).toHaveAttribute('data-variant', 'neutral');
  });

  it.each(FAMILIES)('variante de família %s usa o token da família', (family) => {
    render(<Chip family={family}>Rótulo</Chip>);
    const chip = screen.getByText('Rótulo');
    expect(chip).toHaveAttribute('data-variant', 'family');
    expect(chip).toHaveAttribute('data-family', family);
    expect(chip).toHaveClass(`bg-family-${family}`, `text-family-${family}-foreground`);
  });

  it('selo de concentração', () => {
    render(<Chip variant="concentration">EDP</Chip>);
    const chip = screen.getByText('EDP');
    expect(chip).toHaveAttribute('data-variant', 'concentration');
    expect(chip).toHaveClass('bg-badge-concentration');
  });

  it('com onClick vira botão e expõe aria-pressed', () => {
    const onClick = vi.fn();
    render(
      <Chip family="citrus" selected onClick={onClick}>
        Cítrico
      </Chip>
    );
    const button = screen.getByRole('button', { name: 'Cítrico' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('sem interação não é botão', () => {
    render(<Chip>Estático</Chip>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
