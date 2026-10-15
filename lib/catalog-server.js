import { galleryEnvironment } from './gallery-server.js';

async function rowsFor(table, filter, order) {
  const { url, key } = galleryEnvironment();
  const rows = [];
  for (;;) {
    const response = await fetch(`${url}/rest/v1/${table}?select=*&${filter}&order=${order}&limit=250&offset=${rows.length}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(8000), cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Public catalogue unavailable (${response.status})`);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error('Invalid catalogue response');
    rows.push(...page);
    if (page.length < 250) return rows;
  }
}

export async function publicCatalogSnapshot() {
  const [products, harvests] = await Promise.all([
    rowsFor('truffle_products', 'available=eq.true', 'id.asc'),
    rowsFor('truffle_harvests', 'is_available=eq.true', 'found_on.desc,created_at.desc,id.asc'),
  ]);
  const visible = products.filter((product) => product.available === true && product.is_hidden !== true && product.status !== 'hidden');
  const ids = new Set(visible.map((product) => product.id));
  return { products: visible, harvests: harvests.filter((record) => record.is_available === true && record.is_hidden !== true && record.status !== 'hidden' && ids.has(record.product_id)) };
}
