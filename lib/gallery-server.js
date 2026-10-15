import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const galleryLocales = ['bg', 'en', 'it', 'fr', 'de'];
export const gallerySlugs = { bg: 'galeriya', en: 'gallery', it: 'galleria', fr: 'galerie', de: 'galerie' };
export const pageSize = 60;

export function galleryEnvironment() {
  let fileValues = {};
  try {
    fileValues = Object.fromEntries(readFileSync(resolve(process.cwd(), '.env.production'), 'utf8').split(/\r?\n/).filter((line) => /^[A-Z_]+=/.test(line)).map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1).trim().replace(/^["']|["']$/g, '')];
    }));
  } catch { /* Vercel environment variables take precedence. */ }
  const url = process.env.VITE_SUPABASE_URL || fileValues.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || fileValues.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Public gallery connection is not configured');
  return { url: url.replace(/\/$/, ''), key, origin: (process.env.VITE_SITE_URL || fileValues.VITE_SITE_URL || 'https://mushroom-beta-dusky.vercel.app').replace(/\/$/, '') };
}

export async function publicGalleryRows() {
  const { url, key } = galleryEnvironment();
  const all = [];
  for (;;) {
    const response = await fetch(`${url}/rest/v1/gallery_photos?select=*&published=eq.true&order=sort_order.asc,created_at.desc,id.asc&limit=250&offset=${all.length}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Gallery unavailable (${response.status})`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('Invalid gallery response');
    all.push(...rows);
    if (rows.length < 250) return all;
  }
}

export const xmlEscape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]);

export function imageSitemap(rows, origin, part = null) {
  const chunkSize = 6000;
  if (rows.length > chunkSize && part === null) {
    const parts = Array.from({ length: Math.ceil(rows.length / chunkSize) }, (_, index) => `<sitemap><loc>${xmlEscape(`${origin}/image-sitemap.xml?part=${index + 1}`)}</loc></sitemap>`).join('');
    return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${parts}</sitemapindex>`;
  }
  const firstPage = part === null ? 0 : (part - 1) * chunkSize / pageSize;
  const selected = part === null ? rows : rows.slice((part - 1) * chunkSize, part * chunkSize);
  const entries = galleryLocales.flatMap((locale) => {
    const pages = [];
    for (let index = 0; index < selected.length; index += pageSize) {
      const photos = selected.slice(index, index + pageSize);
      const page = firstPage + index / pageSize + 1;
      const url = `${origin}/${locale}/${gallerySlugs[locale]}${page > 1 ? `?page=${page}` : ''}`;
      const modified = photos.map((photo) => photo.updated_at).sort().at(-1);
      pages.push(`<url><loc>${xmlEscape(url)}</loc>${modified ? `<lastmod>${xmlEscape(modified)}</lastmod>` : ''}${photos.map((photo) => `<image:image><image:loc>${xmlEscape(photo.image_url)}</image:loc></image:image>`).join('')}</url>`);
    }
    return pages;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${entries}</urlset>`;
}
