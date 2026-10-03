import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const clientDir = resolve(root, 'dist/client');
const template = await readFile(resolve(clientDir, 'index.html'), 'utf8');
const server = await import(pathToFileURL(resolve(root, 'dist/server/entry-server.js')).href);

for (const locale of server.locales) {
  for (const key of server.allPageKeys()) {
    const url = server.pathFor(locale, key);
    const parsed = server.keyForPath(url);
    if (!parsed) throw new Error(`Unable to resolve prerender route: ${url}`);
    const html = template
      .replace('<html lang="bg">', `<html lang="${locale}">`)
      .replace('</head>', `${server.renderHead(locale, key)}\n  </head>`)
      .replace('<!--app-html-->', server.render(url));
    const outputPath = resolve(clientDir, `.${url}`, 'index.html');
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);
  }
}

const rootHtml = template
  .replace('</head>', '<meta name="robots" content="noindex,follow" /><meta http-equiv="refresh" content="0;url=/bg/" />\n  </head>')
  .replace('<!--app-html-->', server.render('/'));
await writeFile(resolve(clientDir, 'index.html'), rootHtml);
await writeFile(resolve(clientDir, 'sitemap.xml'), server.sitemapXml());
await writeFile(resolve(clientDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${server.siteUrl}/sitemap.xml\n`);
console.log(`Prerendered ${server.locales.length * server.allPageKeys().length} localized pages.`);