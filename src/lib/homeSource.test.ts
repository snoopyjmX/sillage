import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HOME_SOURCE_STORAGE_KEY, readStoredHomeSource, storeHomeSource } from './homeSource';

describe('homeSource', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('sem escolha guardada devolve nulo (vale o padrão)', () => {
    expect(readStoredHomeSource()).toBeNull();
  });

  it('guarda e lê a escolha', () => {
    storeHomeSource('closet');
    expect(window.localStorage.getItem(HOME_SOURCE_STORAGE_KEY)).toBe('closet');
    expect(readStoredHomeSource()).toBe('closet');
    storeHomeSource('catalog');
    expect(readStoredHomeSource()).toBe('catalog');
  });

  it('valor inválido guardado é ignorado', () => {
    window.localStorage.setItem(HOME_SOURCE_STORAGE_KEY, 'robot');
    expect(readStoredHomeSource()).toBeNull();
  });

  it('localStorage que lança não quebra', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(readStoredHomeSource()).toBeNull();
    expect(() => storeHomeSource('closet')).not.toThrow();
  });
});
