import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TypingAnimation } from './typing-animation';

// Só o trecho já digitado (o resto fica num <span> invisível, depois do texto digitado)
const visible = (container: HTMLElement) =>
  container.querySelector('span[aria-hidden]:not([class])')?.firstChild?.textContent ?? '';

describe('TypingAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom não tem matchMedia: sem preferência de movimento reduzido, a digitação anima
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
    }));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('digita até o fim, com quebras de linha', () => {
    const text = 'Primeira frase.\n\nSegunda frase, mais longa.';
    const { container } = render(<TypingAnimation speed={10}>{text}</TypingAnimation>);
    act(() => vi.advanceTimersByTime(10 * (text.length + 5)));
    expect(container.textContent).toContain(text);
    expect(visible(container)).toBe(text);
  });

  it('recomeça do zero quando chega outro texto', () => {
    const { container, rerender } = render(<TypingAnimation speed={10}>Um texto</TypingAnimation>);
    act(() => vi.advanceTimersByTime(200));
    rerender(<TypingAnimation speed={10}>Outro texto bem diferente</TypingAnimation>);
    expect(visible(container)).toBe('');
    act(() => vi.advanceTimersByTime(10 * 40));
    expect(container.textContent).toContain('Outro texto bem diferente');
  });
});
