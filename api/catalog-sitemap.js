import { publicCatalogSnapshot } from '../lib/catalog-server.js';
import { siteServer } from '../lib/site-render.js';

export default async function handler(request, response) {
  if (!['GET', 'HEAD'].includes(request.method)) { response.setHeader('Allow', 'GET, HEAD'); return response.status(405).end(); }
  response.setHeader('Cache-Control', 'no-store');
  try {
    const [catalog, server] = await Promise.all([publicCatalogSnapshot(), siteServer()]);
    response.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return response.status(200).end(request.method === 'HEAD' ? '' : server.sitemapXml(catalog.products));
  } catch {
    response.setHeader('Retry-After', '60');
    return response.status(503).end('Sitemap temporarily unavailable');
  }
}
