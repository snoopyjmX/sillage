import { describe, expect, it } from 'vitest';
import { clamp, nearestAt, pad2, springStep, stringY, swingStep } from './polaroidLine';

describe('polaroidLine', () => {
  it('clamp limita nos dois lados', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });

  it('stringY: reto nas pontas e cede por completo no meio', () => {
    expect(stringY(0, 100, 40, 20)).toBe(40);
    expect(stringY(100, 100, 40, 20)).toBe(40);
    expect(stringY(50, 100, 40, 20)).toBe(60);
    expect(stringY(500, 100, 40, 20)).toBe(40);
  });

  it('springStep converge para o alvo sem oscilar para fora', () => {
    let x = 0;
    let v = 0;
    for (let i = 0; i < 300; i++) [x, v] = springStep(x, v, 100, 1 / 60);
    expect(x).toBeCloseTo(100, 0);
    expect(Math.abs(v)).toBeLessThan(0.5);
  });

  it('swingStep: ganho 0 deixa a foto parada; com ganho ela se inclina e volta', () => {
    expect(swingStep(0, 0, 800, 1 / 60, 0)).toEqual([0, 0]);
    const [angle] = swingStep(0, 0, 800, 1 / 60, 1);
    expect(angle).toBeGreaterThan(0);
    let a = 0.3;
    let w = 0;
    for (let i = 0; i < 600; i++) [a, w] = swingStep(a, w, 0, 1 / 60, 1);
    expect(Math.abs(a)).toBeLessThan(0.01);
  });

  it('swingStep limita o ângulo', () => {
    const [angle] = swingStep(0.59, 5, 0, 0.1, 1);
    expect(angle).toBe(0.6);
  });

  it('nearestAt escolhe a foto mais próxima dentro dos limites', () => {
    expect(nearestAt(0, 100, 5)).toBe(0);
    expect(nearestAt(149, 100, 5)).toBe(1);
    expect(nearestAt(151, 100, 5)).toBe(2);
    expect(nearestAt(-300, 100, 5)).toBe(0);
    expect(nearestAt(9000, 100, 5)).toBe(4);
    expect(nearestAt(10, 100, 0)).toBe(0);
  });

  it('pad2 completa com zero', () => {
    expect(pad2(3)).toBe('03');
    expect(pad2(12)).toBe('12');
  });
});
