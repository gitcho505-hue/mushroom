import { galleryEnvironment, imageSitemap, publicGalleryRows } from '../lib/gallery-server.js';

export default async function handler(request, response) {
  if (!['GET', 'HEAD'].includes(request.method)) return response.status(405).setHeader('Allow', 'GET, HEAD').end();
  try {
    const url = new URL(request.url, 'https://gallery.invalid');
    const partValue = url.searchParams.get('part');
    const part = partValue === null ? null : Number(partValue);
    const rows = await publicGalleryRows();
    if (part !== null && (!Number.isInteger(part) || part < 1 || part > Math.max(1, Math.ceil(rows.length / 6000)))) return response.status(404).end();
    response.setHeader('Content-Type', 'application/xml; charset=utf-8');
    response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30');
    const xml = imageSitemap(rows, galleryEnvironment().origin, part);
    return response.status(200).end(request.method === 'HEAD' ? '' : xml);
  } catch {
    response.setHeader('Retry-After', '60');
    response.setHeader('Cache-Control', 'no-store');
    return response.status(503).end('Image sitemap temporarily unavailable');
  }
}
