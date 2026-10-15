import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { imageSitemap, publicGalleryRows } from '../lib/gallery-server.js';
import pageHandler from '../api/gallery-page.js';
import sitemapHandler from '../api/image-sitemap.js';

const seed = JSON.parse(await readFile(new URL('../src/gallery-seed.json', import.meta.url), 'utf8'));
const origin = 'https://example.invalid';

function responseRecorder() {
  return {
    statusCode: 200, headers: {}, body: '',
    status(value) { this.statusCode = value; return this; },
    setHeader(name, value) { this.headers[name] = value; return this; },
    end(value = '') { this.body = value; return this; },
  };
}

test('image sitemap maps photographs to the matching localized gallery page', () => {
  const rows = Array.from({ length: 61 }, (_, index) => ({ ...seed[0], image_url: `${origin}/photo-${index}.webp?a=1&b=2` }));
  const xml = imageSitemap(rows, origin);
  assert.equal((xml.match(/<url>/g) || []).length, 10);
  assert.equal((xml.match(/<image:image>/g) || []).length, 305);
  for (const slug of ['bg/galeriya', 'en/gallery', 'it/galleria', 'fr/galerie', 'de/galerie']) {
    assert.ok(xml.includes(`<loc>${origin}/${slug}?page=2</loc>`));
  }
  assert.ok(xml.includes('?a=1&amp;b=2'));
});

test('large image sitemaps split without losing the final photographs', () => {
  const rows = Array.from({ length: 6001 }, () => seed[0]);
  assert.equal((imageSitemap(rows, origin).match(/<sitemap>/g) || []).length, 2);
  assert.equal((imageSitemap(rows, origin, 1).match(/<image:image>/g) || []).length, 30000);
  const last = imageSitemap(rows, origin, 2);
  assert.equal((last.match(/<image:image>/g) || []).length, 5);
  assert.ok(last.includes('?page=101'));
});

test('public rows load beyond the first database page and filter published records', async (context) => {
  const requests = [];
  context.mock.method(globalThis, 'fetch', async (url) => {
    requests.push(new URL(url));
    return { ok: true, json: async () => requests.length === 1 ? Array(250).fill(seed[0]) : seed.slice(0, 1) };
  });
  assert.equal((await publicGalleryRows()).length, 251);
  assert.equal(requests[1].searchParams.get('offset'), '250');
  assert.ok(requests.every((url) => url.searchParams.get('published') === 'eq.true'));
});

test('database failures produce a retryable response instead of an outdated sitemap', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  for (const handler of [pageHandler, sitemapHandler]) {
    const response = responseRecorder();
    await handler({ method: 'GET', url: '/?locale=bg&kind=home' }, response);
    assert.equal(response.statusCode, 503);
    assert.equal(response.headers['Cache-Control'], 'no-store');
    assert.equal(response.headers['Retry-After'], '60');
  }
});

test('gallery SSR includes fresh metadata, ten home photos and complete paginated galleries', async (context) => {
  const rows = Array.from({ length: 121 }, (_, index) => ({
    ...seed[index % seed.length], id: `fixture-${index}`, image_url: `${origin}/photo-${index}.webp`,
    home_position: index < 10 ? index + 1 : null,
    alt_by_locale: { bg: `Снимка ${index} <script>`, de: `Foto ${index}` },
  }));
  context.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => rows }));
  const home = responseRecorder();
  await pageHandler({ method: 'GET', url: '/?locale=bg&kind=home' }, home);
  assert.equal(home.statusCode, 200);
  assert.equal((home.body.match(/class="home-harvest-ribbon__tile"/g) || []).length, 10);
  const gallery = responseRecorder();
  await pageHandler({ method: 'GET', url: '/?locale=de&kind=gallery&page=2' }, gallery);
  assert.equal(gallery.statusCode, 200);
  assert.equal((gallery.body.match(/class="home-harvest-ribbon__tile"/g) || []).length, 60);
  assert.match(gallery.body, /rel="canonical" href="[^"]+\/de\/galerie\?page=2"/);
  assert.ok(gallery.body.includes('alt="Foto 60"'));
  const bootstrap = gallery.body.match(/<script id="gallery-bootstrap" type="application\/json">(.*?)<\/script>/s)[1];
  assert.ok(!bootstrap.includes('<script>'));
  assert.equal(JSON.parse(bootstrap).length, 121);
  const missing = responseRecorder();
  await pageHandler({ method: 'GET', url: '/?locale=de&kind=gallery&page=4' }, missing);
  assert.equal(missing.statusCode, 404);
});
