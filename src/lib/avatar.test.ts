import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AVATAR_MAX_BYTES, processAvatarImage } from './avatar';

const drawImage = vi.fn();
const close = vi.fn();
const toBlob = vi.fn();

const file = (type: string, size = 10): File => {
  const f = new File(['x'], 'foto', { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
};

describe('processAvatarImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue({ width: 800, height: 400, close })
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    toBlob.mockImplementation((cb: BlobCallback, type: string) => cb(new Blob(['y'], { type })));
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(toBlob);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('NEGADO: tipo fora de PNG, JPEG, WebP e AVIF', async () => {
    await expect(processAvatarImage(file('image/gif'))).rejects.toMatchObject({
      code: 'avatar_invalid_type',
    });
    await expect(processAvatarImage(file('application/pdf'))).rejects.toMatchObject({
      code: 'avatar_invalid_type',
    });
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('NEGADO: arquivo acima de 5 MB é recusado antes de ser decodificado', async () => {
    await expect(processAvatarImage(file('image/png', AVATAR_MAX_BYTES + 1))).rejects.toMatchObject(
      { code: 'avatar_too_large' }
    );
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('arquivo corrompido vira avatar_invalid_type', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('decode')));
    await expect(processAvatarImage(file('image/png'))).rejects.toMatchObject({
      code: 'avatar_invalid_type',
    });
  });

  it('recorta o quadrado central e exporta WebP a 0,85', async () => {
    const blob = await processAvatarImage(file('image/jpeg'), 320);
    // 800x400: lado 400, começando em x = 200
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 200, 0, 400, 400, 0, 0, 320, 320);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.85);
    expect(blob.type).toBe('image/webp');
    expect(close).toHaveBeenCalled();
  });

  it('sem WebP no toBlob, refaz em JPEG', async () => {
    toBlob.mockImplementation((cb: BlobCallback, type: string) =>
      cb(new Blob(['y'], { type: type === 'image/webp' ? 'image/png' : type }))
    );
    const blob = await processAvatarImage(file('image/png'));
    expect(blob.type).toBe('image/jpeg');
    expect(toBlob).toHaveBeenCalledTimes(2);
  });

  it('toBlob sem resultado vira avatar_failed', async () => {
    toBlob.mockImplementation((cb: BlobCallback) => cb(null));
    await expect(processAvatarImage(file('image/png'))).rejects.toMatchObject({
      code: 'avatar_failed',
    });
  });
});
