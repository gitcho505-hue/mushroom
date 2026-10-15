import { allPageKeys, articles, catalogProductPath, copy, faqItems, imageUrl, languageMeta, locales, pathFor, seoFor, truffleFor, type Locale, type PageKey } from './content';
import { safeCatalogImage, type CatalogProduct } from './catalog';
import { heroHarvestPhotos } from './harvest-photos';

const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://mushroom-beta-dusky.vercel.app').replace(/\/$/, '');
const heroImage = heroHarvestPhotos[0].src;
const absoluteImage = (path: string) => new URL(path, `${siteUrl}/`).href;

export function structuredData(locale: Locale, key: PageKey, galleryPage = 1, managed?: CatalogProduct) {
  const canonical = `${siteUrl}${managed && key.startsWith('product:') ? catalogProductPath(locale, managed.id, managed.slug_by_locale) : pathFor(locale, key)}${key === 'gallery' && galleryPage > 1 ? `?page=${galleryPage}` : ''}`;
  const title = seoFor(locale, key).title;
  const product = managed ? { title: managed.title_by_locale[locale] || managed.title_by_locale.en || managed.title_by_locale.bg, description: managed.description_by_locale[locale] || managed.description_by_locale.en || '', season: managed.season_by_locale[locale] || managed.season_by_locale.en || '', image: managed.image_url } : key.startsWith('product:') ? truffleFor(key, locale) : undefined;
  const articleId = key.startsWith('article:') ? key.split(':')[1] : undefined;
  const article = articleId ? articles[locale][articleId] : undefined;
  const image = absoluteImage(managed ? safeCatalogImage(managed.image_url, managed.id) : product ? imageUrl(product.image) : article ? imageUrl(article.image) : heroImage);
  const data: Record<string, unknown>[] = [
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'Truffle Balkans', legalName: 'Esi Truffle EOOD', url: siteUrl, logo: `${siteUrl}/snimki/logo2.png`, description: 'Wild truffles selected in the Balkans.' },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Truffle Balkans', url: siteUrl, inLanguage: languageMeta[locale].hreflang },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Truffle Balkans', item: `${siteUrl}${pathFor(locale, 'home')}` }, ...(key === 'home' ? [] : [{ '@type': 'ListItem', position: 2, name: title.replace(' | Truffle Balkans', ''), item: canonical }]) ] },
  ];
  if (product) data.push({ '@context': 'https://schema.org', '@type': 'Product', name: product.title, description: product.description, image, brand: { '@type': 'Brand', name: 'Truffle Balkans' }, category: 'Fresh truffles', additionalProperty: [{ '@type': 'PropertyValue', name: copy[locale].season, value: product.season }, { '@type': 'PropertyValue', name: copy[locale].originLabel, value: 'Balkans' }] });
  if (article && articleId) data.push({ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: article.title, description: article.description, image, datePublished: article.published ?? ({ storage: '2025-09-12', 'black-and-white': '2025-10-03', 'balkan-truffles': '2025-10-21' } as Record<string, string>)[articleId], author: { '@type': 'Organization', name: 'Truffle Balkans', url: `${siteUrl}${pathFor(locale, 'about')}` }, publisher: { '@type': 'Organization', name: 'Truffle Balkans', logo: { '@type': 'ImageObject', url: `${siteUrl}/snimki/logo2.png` } }, mainEntityOfPage: canonical, inLanguage: languageMeta[locale].hreflang });
  if (key === 'faq' || key.startsWith('product:') || key.startsWith('truffle:')) data.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqItems(locale).map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) });
  return data;
}

export function renderHead(locale: Locale, key: PageKey, galleryPage = 1, managed?: CatalogProduct) {
  const base = seoFor(locale, key);
  const title = managed ? `${managed.title_by_locale[locale] || managed.title_by_locale.en || managed.title_by_locale.bg} | Truffle Balkans` : base.title;
  const description = managed ? managed.description_by_locale[locale] || managed.description_by_locale.en || '' : base.description;
  const query = key === 'gallery' && Number.isSafeInteger(galleryPage) && galleryPage > 1 ? `?page=${galleryPage}` : '';
  const route = (other: Locale) => managed && key.startsWith('product:') ? catalogProductPath(other, managed.id, managed.slug_by_locale) : pathFor(other, key);
  const canonical = `${siteUrl}${route(locale)}${query}`;
  const product = key.startsWith('product:') ? truffleFor(key, locale) : undefined;
  const article = key.startsWith('article:') ? articles[locale][key.split(':')[1]] : undefined;
  const image = absoluteImage(managed ? safeCatalogImage(managed.image_url, managed.id) : product ? imageUrl(product.image) : article ? imageUrl(article.image) : heroImage);
  const preloadImage = managed ? safeCatalogImage(managed.image_url, managed.id, 1500) : product ? imageUrl(product.image, 1500) : article ? imageUrl(article.image, 1800) : key === 'home' ? heroImage : undefined;
  const alternates = locales.map((other) => `<link rel="alternate" hreflang="${languageMeta[other].hreflang}" href="${siteUrl}${route(other)}${query}" />`).join('\n    ');
  const xDefault = `<link rel="alternate" hreflang="x-default" href="${siteUrl}${route('bg')}${query}" />`;
  const jsonLd = JSON.stringify(structuredData(locale, key, query ? galleryPage : 1, managed)).replace(/</g, '\\u003c');
  return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    ${preloadImage ? `<link rel="preload" as="image" href="${preloadImage}" fetchpriority="high" />` : ''}
    <link rel="canonical" href="${canonical}" />
    ${alternates}
    ${xDefault}
    <meta property="og:type" content="${article ? 'article' : 'website'}" />
    <meta property="og:site_name" content="Truffle Balkans" />
    <meta property="og:locale" content="${languageMeta[locale].hreflang.replace('-', '_')}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${image}" />
    <script type="application/ld+json">${jsonLd}</script>`.replace(/<(title|meta|link|script)(?=[\s>])/g, '<$1 data-truffle-seo="true"');
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}

export function sitemapXml(products?: CatalogProduct[]) {
  const keys = allPageKeys().filter((key) => !products || !/^(product|truffle):/.test(key) || products.some((product) => product.id === key.split(':')[1]));
  if (products) for (const product of products) if (!keys.includes(`product:${product.id}`)) keys.push(`product:${product.id}`);
  const entries = keys.flatMap((key) => locales.map((locale) => {
    const managed = products?.find((product) => key === `product:${product.id}`);
    const route = (other: Locale) => managed ? catalogProductPath(other, managed.id, managed.slug_by_locale) : pathFor(other, key);
    const alternates = locales.map((alternate) => `<xhtml:link rel="alternate" hreflang="${languageMeta[alternate].hreflang}" href="${siteUrl}${escapeHtml(route(alternate))}" />`).join('');
    return `<url><loc>${siteUrl}${escapeHtml(route(locale))}</loc>${alternates}<xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${escapeHtml(route('bg'))}" /></url>`;
  })).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries}</urlset>`;
}

export { siteUrl };
