import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { Site } from './site';
import { allPageKeys, keyForPath, locales, pathFor } from './content';
import { renderHead, siteUrl, sitemapXml } from './seo';

export function render(url: string) {
  return renderToString(<StaticRouter location={url}><Site /></StaticRouter>);
}

export { allPageKeys, keyForPath, locales, pathFor, renderHead, siteUrl, sitemapXml };