import { slugifyProduct } from './catalog';

export async function compressGalleryImage(file: File) {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) throw new Error('Изберете JPG, PNG, WebP или AVIF.');
  if (file.size > 40 * 1024 * 1024) throw new Error('Снимката е над 40 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Браузърът не може да обработи снимката.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Компресирането не успя.')), 'image/webp', .82));
    if (blob.type !== 'image/webp' || blob.size > 8 * 1024 * 1024) throw new Error('Снимката не може да се запази като оптимизиран WebP.');
    return { blob, width: canvas.width, height: canvas.height };
  } finally { bitmap.close(); }
}

export function gallerySlug(value: string) {
  return slugifyProduct(value).slice(0, 120).replace(/-+$/, '') || 'truffle-photograph';
}

export const galleryFilename = (slug: string, id: string) => `${gallerySlug(slug).slice(0, 80).replace(/-+$/, '')}-${id}.webp`;
