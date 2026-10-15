import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { galleryLocales, gallerySlugs, pageSize, publicGalleryRows } from '../lib/gallery-server.js';

export default async function handler(request, response) {
  if (!['GET', 'HEAD'].includes(request.method)) { response.setHeader('Allow', 'GET, HEAD'); return response.status(405).end(); }
  const url = new URL(request.url, 'https://gallery.invalid');
  const locale = url.searchParams.get('locale');
  const kind = url.searchParams.get('kind') === 'home' ? 'home' : 'gallery';
  if (!galleryLocales.includes(locale)) return response.status(404).end();
  try {
    const rows = await publicGalleryRows();
    const page = Math.max(1, Math.floor(Number(url.searchParams.get('page')) || 1));
    if (kind === 'gallery' && page > Math.max(1, Math.ceil(rows.length / pageSize))) return response.status(404).end('Gallery page not found');
    const path = kind === 'home' ? `/${locale}/` : `/${locale}/${gallerySlugs[locale]}`;
    const query = kind === 'gallery' && page > 1 ? `?page=${page}` : '';
    const server = await import(pathToFileURL(resolve(process.cwd(), 'dist/server/entry-server.js')).href);
    const template = await readFile(resolve(process.cwd(), 'dist/client/gallery-shell.html'), 'utf8');
    const head = server.renderHead(locale, kind, page);
    const bootstrap = `<script id="gallery-bootstrap" type="application/json">${JSON.stringify(rows).replace(/</g, '\\u003c')}</script>`;
    const html = template.replace('<html lang="bg">', `<html lang="${locale}">`).replace('</head>', `${head}\n</head>`).replace('<!--app-html-->', server.render(path + query, rows)).replace('</body>', `${bootstrap}</body>`);
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30');
    response.setHeader('Content-Language', locale);
    return response.status(200).end(request.method === 'HEAD' ? '' : html);
  } catch {
    response.setHeader('Retry-After', '60'); response.setHeader('Cache-Control', 'no-store');
    return response.status(503).end('Gallery temporarily unavailable. Please try again shortly.');
  }
}
