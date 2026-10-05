import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App.tsx';

describe('App', () => {
  it('renderiza o título Sillage', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /sillage/i })).toBeInTheDocument();
  });
});
