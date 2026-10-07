// Processamento local da foto de perfil: valida, recorta quadrado no centro e reexporta em WebP.
// Nada sai do navegador antes de a imagem estar pequena e no formato certo.
import { AppError } from '@/constants/errors';

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp,image/avif';
export const AVATAR_QUALITY = 0.85;

const ACCEPTED_TYPES: readonly string[] = AVATAR_ACCEPT.split(',');

const canvasToBlob = (canvas: HTMLCanvasElement, type: string): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, AVATAR_QUALITY));

export const processAvatarImage = async (file: File, targetSize = 320): Promise<Blob> => {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new AppError('avatar_invalid_type');
  if (file.size > AVATAR_MAX_BYTES) throw new AppError('avatar_too_large');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (error) {
    throw new AppError('avatar_invalid_type', { cause: error });
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const context = canvas.getContext('2d');
    if (!context) throw new AppError('avatar_failed');

    // Recorte 1:1 centralizado
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;
    context.drawImage(bitmap, sx, sy, side, side, 0, 0, targetSize, targetSize);

    // Navegador sem WebP no toBlob devolve outro tipo (PNG): refaz em JPEG
    let blob = await canvasToBlob(canvas, 'image/webp');
    if (blob?.type !== 'image/webp') blob = await canvasToBlob(canvas, 'image/jpeg');
    if (!blob) throw new AppError('avatar_failed');
    return blob;
  } finally {
    bitmap.close();
  }
};
