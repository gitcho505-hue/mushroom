import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import * as server from '../dist/server/entry-server.js';
import { publicCatalogSnapshot } from '../lib/catalog-server.js';
import pageHandler from '../api/site-page.js';
import sitemapHandler from '../api/catalog-sitemap.js';

const photos = JSON.parse(await readFile(new URL('../src/gallery-seed.json', import.meta.url), 'utf8'));
const products = server.createCatalogSeeds().map((product) => ({ ...product, available: product.id !== 'summer-truffle' }));
const record = { id: 'visible-find', product_id: 'black-truffle', found_on: '2026-10-15', weight_grams: 120, quantity: 2, notes: '', image_url: null, image_path: null, is_available: true, grade_code: 'first', size_code: 'large', preparation_code: 'cleaned' };
const records = [record, { ...record, id: 'hidden-parent', product_id: 'summer-truffle' }, { ...record, id: 'draft-find', is_available: false }];
const recorder = () => ({ statusCode: 200, headers: {}, body: '', status(value) { this.statusCode = value; return this; }, setHeader(name, value) { this.headers[name] = value; return this; }, end(value = '') { this.body = value; return this; } });
function mockDatabase(context, catalog = products, harvests = records) {
  context.mock.method(globalThis, 'fetch', async (url) => ({ ok: true, json: async () => String(url).includes('/truffle_products?') ? catalog : String(url).includes('/truffle_harvests?') ? harvests : photos }));
}

test('public filtering rejects all visibility flags and children of hidden parents', () => {
  const catalog = products.map((product) => product.id === 'white-truffle' ? { ...product, is_hidden: true } : product.id === 'burgundy-truffle' ? { ...product, status: 'hidden' } : product);
  const data = server.filterPublicCatalog(catalog, [...records, { ...record, id: 'hidden-flag', is_hidden: true }, { ...record, id: 'hidden-status', status: 'hidden' }]);
  assert.deepEqual(data.products.map((product) => product.id), ['black-truffle']);
  assert.deepEqual(data.harvests.map((harvest) => harvest.id), ['visible-find']);
  assert.equal(server.filterPublicCatalog([], records).harvests.length, 0);
});

test('preset details translate automatically for all supported languages', () => {
  const expected = { bg: 'Първо качество · Едри · Почистени', en: 'First grade · Large · Cleaned', it: 'Prima qualità · Grandi · Puliti', fr: 'Premier choix · Grandes · Nettoyées', de: 'Erste Qualität · Groß · Gereinigt' };
  for (const [locale, text] of Object.entries(expected)) assert.equal(server.harvestDetails(record, locale), text);
  assert.equal(server.harvestDetails({ ...record, grade_code: null, size_code: null, preparation_code: null, notes: 'Първо' }, 'en'), 'First grade');
});

test('SSR shows subproducts only on their own product page before the information section', async (context) => {
  mockDatabase(context, products, [...records, { ...record, id: 'burgundy-find', product_id: 'burgundy-truffle' }]);
  const response = recorder();
  await pageHandler({ method: 'GET', url: '/?locale=en' }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.ok(!response.body.includes('data-harvest-id='));
  assert.ok(!response.body.includes('data-harvest-id="hidden-parent"'));
  assert.ok(!response.body.includes('data-harvest-id="draft-find"'));
  const bootstrap = JSON.parse(response.body.match(/<script id="catalog-bootstrap" type="application\/json">(.*?)<\/script>/s)[1]);
  assert.equal(bootstrap.products.length, 3);
  assert.equal(bootstrap.harvests.length, 2);
  assert.ok(!bootstrap.products.some((product) => product.id === 'summer-truffle'));
  for (const locale of server.locales) {
    for (const [productId, harvestId] of [['black-truffle', 'visible-find'], ['burgundy-truffle', 'burgundy-find']]) {
      const detail = recorder();
      const path = server.pathFor(locale, `product:${productId}`).split('/').slice(2).join('/');
      await pageHandler({ method: 'GET', url: `/?locale=${locale}&path=${path}` }, detail);
      assert.equal(detail.statusCode, 200);
      assert.equal((detail.body.match(/data-harvest-id=/g) || []).length, 1);
      assert.ok(detail.body.includes(`data-harvest-id="${harvestId}"`));
      const stockPosition = detail.body.indexOf('class="section harvest-stock"');
      const informationPosition = detail.body.indexOf('class="product-information"');
      assert.ok(stockPosition > detail.body.indexOf('class="product-detail-hero"') && stockPosition < informationPosition);
      assert.ok(detail.body.includes(server.harvestDetails(record, locale)));
    }
    const guide = recorder();
    const path = server.pathFor(locale, 'truffle:black-truffle').split('/').slice(2).join('/');
    await pageHandler({ method: 'GET', url: `/?locale=${locale}&path=${path}` }, guide);
    assert.ok(!guide.body.includes('data-harvest-id='));
  }
});

test('hidden products cannot be opened directly or indexed in the live sitemap', async (context) => {
  mockDatabase(context);
  for (const path of ['produkti/leten-tryufel', 'tryufeli/leten-tryufel']) {
    const response = recorder();
    await pageHandler({ method: 'GET', url: `/?locale=bg&path=${path}` }, response);
    assert.equal(response.statusCode, 404);
    assert.equal(response.headers['X-Robots-Tag'], 'noindex');
  }
  const response = recorder();
  await sitemapHandler({ method: 'GET', url: '/' }, response);
  assert.equal(response.statusCode, 200);
  for (const locale of server.locales) assert.ok(!response.body.includes(`<loc>${server.siteUrl}${server.pathFor(locale, 'product:summer-truffle')}</loc>`));
});

test('server catalogue requests filter published rows even before rendering', async (context) => {
  const requests = [];
  context.mock.method(globalThis, 'fetch', async (value) => {
    const url = new URL(value); requests.push(url);
    return { ok: true, json: async () => url.pathname.endsWith('truffle_products') ? products : records };
  });
  const result = await publicCatalogSnapshot();
  assert.equal(result.products.length, 3);
  assert.equal(result.harvests.length, 1);
  assert.equal(requests.find((url) => url.pathname.endsWith('truffle_products')).searchParams.get('available'), 'eq.true');
  assert.equal(requests.find((url) => url.pathname.endsWith('truffle_harvests')).searchParams.get('is_available'), 'eq.true');
});
