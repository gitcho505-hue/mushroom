import type { GalleryPhoto } from './gallery-model';
import { gallerySeeds } from './gallery-data';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { Site } from './site';
import { allPageKeys, keyForPath, locales, pathFor } from './content';
import { renderHead, siteUrl, sitemapXml } from './seo';

export function render(url: string, initialGallery?: GalleryPhoto[]) {
  return renderToString(<StaticRouter location={url}><Site initialGallery={initialGallery} /></StaticRouter>);
}

export { gallerySeeds, allPageKeys, keyForPath, locales, pathFor, renderHead, siteUrl, sitemapXml };