import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { publicGalleryRows, pageSize } from './gallery-server.js';
import { publicCatalogSnapshot } from './catalog-server.js';

export const siteServer = () => import(pathToFileURL(resolve(process.cwd(), 'dist/server/entry-server.js')).href);

export async function renderPublicPage(request, response, locale, pathname) {
  if (!['GET', 'HEAD'].includes(request.method)) { response.setHeader('Allow', 'GET, HEAD'); return response.status(405).end(); }
  response.setHeader('Cache-Control', 'no-store');
  if (!['bg', 'en', 'it', 'fr', 'de'].includes(locale)) return response.status(404).end();
  try {
    const [server, rows, catalog, template] = await Promise.all([
      siteServer(), publicGalleryRows(), publicCatalogSnapshot(), readFile(resolve(process.cwd(), 'dist/client/gallery-shell.html'), 'utf8'),
    ]);
    const route = server.keyForPath(pathname, catalog.products);
    const key = route?.key;
    if (!key || (/^(product|truffle):/.test(key) && !catalog.products.some((product) => product.id === key.split(':')[1]))) {
      response.setHeader('X-Robots-Tag', 'noindex');
      return response.status(404).end('Page not found');
    }
    const url = new URL(request.url, 'https://site.invalid');
    const page = Math.max(1, Math.floor(Number(url.searchParams.get('page')) || 1));
    if (key === 'gallery' && page > Math.max(1, Math.ceil(rows.length / pageSize))) return response.status(404).end('Gallery page not found');
    const query = key === 'gallery' && page > 1 ? `?page=${page}` : '';
    const managed = /^(product|truffle):/.test(key) ? catalog.products.find((product) => product.id === key.split(':')[1]) : undefined;
    const head = server.renderHead(locale, key, page, managed);
    const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
    const bootstrap = `<script id="gallery-bootstrap" type="application/json">${json(rows)}</script><script id="catalog-bootstrap" type="application/json">${json(catalog)}</script>`;
    const html = template.replace('<html lang="bg">', `<html lang="${locale}">`).replace('</head>', `${head}\n</head>`).replace('<!--app-html-->', server.render(pathname + query, rows, catalog)).replace('</body>', `${bootstrap}</body>`);
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Content-Language', locale);
    return response.status(200).end(request.method === 'HEAD' ? '' : html);
  } catch (error) {
    console.error('Public page unavailable:', error instanceof Error ? error.message : 'Unknown error');
    response.setHeader('Retry-After', '60');
    return response.status(503).end('The page is temporarily unavailable. Please try again shortly.');
  }
}
