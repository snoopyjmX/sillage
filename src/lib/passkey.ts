// Suporte a passkeys no navegador e rótulo do aparelho (docs/PLANO_PASSKEYS.md). Sem React.

// Só oferece biometria quando há um autenticador de plataforma (Face ID, Touch ID, Windows Hello,
// biometria do Android). Sem suporte, a interface mantém apenas e-mail e senha.
export const checkBiometricsSupport = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || typeof window.PublicKeyCredential !== 'function') {
    return false;
  }
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

// A ordem importa: o Android traz "Linux" no user agent e o iPhone traz "Mac OS X"
const DEVICE_LABELS: readonly (readonly [RegExp, string])[] = [
  [/iphone|ipod/i, 'iPhone'],
  [/ipad/i, 'iPad'],
  [/android/i, 'Android'],
  [/windows/i, 'Windows'],
  [/cros/i, 'Chromebook'],
  [/macintosh|mac os x/i, 'Mac'],
  [/linux/i, 'Linux'],
];

// Nome amigável da passkey. O iPad com iPadOS diz ser Mac, mas tem tela de toque.
export const getDeviceLabel = (userAgent: string, maxTouchPoints = 0): string => {
  if (/macintosh/i.test(userAgent) && maxTouchPoints > 1) return 'iPad';
  const match = DEVICE_LABELS.find(([pattern]) => pattern.test(userAgent));
  return match ? match[1] : 'Este aparelho';
};
