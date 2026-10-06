import confetti from 'canvas-confetti';
import { describe, expect, it, vi } from 'vitest';
import { fireConfetti } from './confetti';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('fireConfetti', () => {
  it('dispara dois jatos que respeitam reduced motion', () => {
    fireConfetti();
    expect(confetti).toHaveBeenCalledTimes(2);
    for (const [options] of vi.mocked(confetti).mock.calls) {
      expect(options).toMatchObject({ disableForReducedMotion: true });
    }
  });
});
