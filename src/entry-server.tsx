import type { GalleryPhoto } from './gallery-model';
import type { PublicCatalog } from './catalog';
import { gallerySeeds } from './gallery-data';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { Site } from './site';
import { allPageKeys, keyForPath, locales, pathFor } from './content';
import { renderHead, siteUrl, sitemapXml } from './seo';

export function render(url: string, initialGallery?: GalleryPhoto[], initialCatalog?: PublicCatalog) {
  return renderToString(<StaticRouter location={url}><Site initialGallery={initialGallery} initialCatalog={initialCatalog} /></StaticRouter>);
}

export { createCatalogSeeds, filterPublicCatalog } from './catalog';
export { harvestDetails } from './harvest-options';

export { gallerySeeds, allPageKeys, keyForPath, locales, pathFor, renderHead, siteUrl, sitemapXml };
