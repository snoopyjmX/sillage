import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkBiometricsSupport, getDeviceLabel } from './passkey';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 Version/18.0';

describe('getDeviceLabel', () => {
  it.each([
    [IPHONE, 0, 'iPhone'],
    [ANDROID, 5, 'Android'],
    [WINDOWS, 0, 'Windows'],
    [MAC, 0, 'Mac'],
    // iPadOS se apresenta como Mac, mas tem tela de toque
    [MAC, 5, 'iPad'],
    ['Mozilla/5.0 (X11; Linux x86_64)', 0, 'Linux'],
    ['agente desconhecido', 0, 'Este aparelho'],
  ])('%s -> %s', (userAgent, touchPoints, expected) => {
    expect(getDeviceLabel(userAgent, touchPoints)).toBe(expected);
  });
});

describe('checkBiometricsSupport', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sem PublicKeyCredential no navegador devolve false', async () => {
    vi.stubGlobal('PublicKeyCredential', undefined);
    await expect(checkBiometricsSupport()).resolves.toBe(false);
  });

  it('usa o autenticador de plataforma (Face ID, digital, Windows Hello)', async () => {
    const available = vi.fn().mockResolvedValue(true);
    vi.stubGlobal(
      'PublicKeyCredential',
      Object.assign(() => undefined, { isUserVerifyingPlatformAuthenticatorAvailable: available })
    );
    await expect(checkBiometricsSupport()).resolves.toBe(true);
    expect(available).toHaveBeenCalled();
  });

  it('falha na verificação vira false (sem botão quebrado)', async () => {
    vi.stubGlobal(
      'PublicKeyCredential',
      Object.assign(() => undefined, {
        isUserVerifyingPlatformAuthenticatorAvailable: vi.fn().mockRejectedValue(new Error('x')),
      })
    );
    await expect(checkBiometricsSupport()).resolves.toBe(false);
  });
});
