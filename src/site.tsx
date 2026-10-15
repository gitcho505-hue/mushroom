import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Menu, MoveUpRight, Sparkles, X } from 'lucide-react';
import { articles, catalogProductPath, copy, faqItems, imageUrl, isCatalogProductPath, keyForPath, languageMeta, locales, pathFor, titleFor, truffleFor, truffleIds as defaultTruffleIds, type Copy, type Locale, type PageKey } from './content';
import { localeUi } from './i18n';
import { renderHead, siteUrl } from './seo';
import { HarvestAdminPage as AdminPage } from './harvest-admin-crud';
import { createCatalogSeeds, getSupabaseClient, loadCatalogProducts, loadHarvestRecords, safeCatalogImage, type CatalogProduct, type HarvestRecord } from './catalog';
import { harvestGalleryCopy, harvestPhotos, homeStoryPhoto } from './harvest-photos';
import { HarvestLightbox } from './harvest-lightbox';
import { knowledgeCopy, knowledgeArticleIds } from './knowledge';
import { AboutPage, ContactPage, RestaurantPage } from './business-pages';
import { ProductDetail } from './product-detail';
import { HomeIntro } from './home-intro';
import { homeIntroCopy } from './home-intro-copy';
import { FooterCampaign } from './footer-campaign';
import { newsletterCopy } from './newsletter-copy';
import { whatsappLink } from './whatsapp';
import './harvest-gallery.css';
import './harvest-inventory.css';

const CatalogContext = createContext<Record<string, CatalogProduct>>({});
const CatalogLoadedContext = createContext(false);
const HarvestContext = createContext<HarvestRecord[]>([]);

type ProductView = NonNullable<ReturnType<typeof truffleFor>> & {
  origin?: string;
  weight_grams?: number | null;
  price?: number | null;
  price_per_kg?: number | null;
  currency?: string;
  available?: boolean;
  stock_grams?: number | null;
};

function productFor(id: string, locale: Locale, catalog: Record<string, CatalogProduct>): ProductView | undefined {
  const staticProduct = truffleFor(`product:${id}`, locale);
  const managed = catalog[id];
  if (!staticProduct && !managed) return undefined;
  const product = staticProduct ?? {
    slug: id,
    title: managed!.title_by_locale[locale] || managed!.title_by_locale.en || id,
    description: managed!.description_by_locale[locale] || managed!.description_by_locale.en || '',
    body: managed!.body_by_locale[locale] || managed!.body_by_locale.en || '',
    season: managed!.season_by_locale[locale] || managed!.season_by_locale.en || '',
    image: managed!.image_url,
    note: managed!.note_by_locale[locale] || managed!.note_by_locale.en || '',
  };
  if (!managed) return product;
  return {
    ...product,
    title: managed.title_by_locale[locale] || product.title,
    description: managed.description_by_locale[locale] || product.description,
    body: managed.body_by_locale[locale] || product.body,
    season: managed.season_by_locale[locale] || product.season,
    note: managed.note_by_locale[locale] || product.note,
    image: managed.image_url || product.image,
    origin: managed.origin,
    weight_grams: managed.weight_grams,
    price: managed.price,
    price_per_kg: managed.price_per_kg,
    currency: managed.currency,
    available: managed.available,
    stock_grams: managed.stock_grams,
  };
}

function catalogProductIds(catalog: Record<string, CatalogProduct>, loaded: boolean) {
  const ids = Object.keys(catalog);
  return loaded ? ids : ids.length ? ids : defaultTruffleIds;
}

function productImage(product: { image: string }, width: number) {
  return safeCatalogImage(product.image, product.image, width);
}

function formatProductPrice(price: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price);
}

function updateManagedProductMeta(locale: Locale, product: CatalogProduct) {
  const title = `${product.title_by_locale[locale] || product.title_by_locale.en} | Truffle Balkans`;
  const description = product.description_by_locale[locale] || product.description_by_locale.en;
  const canonical = `${siteUrl}${catalogProductPath(locale, product.id, product.slug_by_locale)}`;
  const image = new URL(safeCatalogImage(product.image_url, product.id, 1200), `${siteUrl}/`).href;
  document.title = title;
  document.head.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
  document.head.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical);
  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) document.head.querySelector(selector)?.setAttribute('content', image);
  document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]').forEach((link) => {
    const option = locales.find((candidate) => languageMeta[candidate].hreflang === link.hreflang) ?? 'bg';
    link.href = `${siteUrl}${catalogProductPath(option, product.id, product.slug_by_locale)}`;
  });
  for (const selector of ['meta[data-truffle-seo][name="description"]', 'meta[data-truffle-seo][property="og:description"]', 'meta[data-truffle-seo][name="twitter:description"]']) {
    document.head.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', description);
  }
  for (const selector of ['meta[data-truffle-seo][property="og:title"]', 'meta[data-truffle-seo][name="twitter:title"]']) {
    document.head.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', title);
  }
  const schema = document.head.querySelector<HTMLScriptElement>('script[data-truffle-seo][type="application/ld+json"]');
  if (!schema) return;
  try {
    const graph = JSON.parse(schema.textContent || '[]') as Array<Record<string, unknown>>;
    let productSchema = graph.find((entry) => entry['@type'] === 'Product');
    if (!productSchema) {
      productSchema = { '@context': 'https://schema.org', '@type': 'Product', brand: { '@type': 'Brand', name: 'Truffle Balkans' } };
      graph.push(productSchema);
    }
    productSchema.name = product.title_by_locale[locale] || product.title_by_locale.en;
    productSchema.description = description;
    productSchema.image = image;
    productSchema.url = canonical;
    if (product.price != null) productSchema.offers = { '@type': 'Offer', url: canonical, price: product.price, priceCurrency: product.currency, availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' };
    else delete productSchema.offers;
    schema.textContent = JSON.stringify(graph);
  } catch {
    return;
  }
}

function localizedMeta(locale: Locale, key: PageKey) {
  const fragment = renderHead(locale, key);
  document.documentElement.lang = locale;
  const parsed = new DOMParser().parseFromString(`<head>${fragment}</head>`, 'text/html').head;
  const owned = document.head.querySelectorAll('title, meta[name="description"], [data-truffle-seo]');
  owned.forEach((element) => element.remove());
  [...parsed.children].forEach((element) => {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.dataset.truffleSeo = 'true';
    document.head.append(clone);
  });
}

export function Site() {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const isAdminPath = pathname === '/admin' || pathname === '/admin/' || pathname.startsWith('/admin/');
  const [catalog, setCatalog] = useState<Record<string, CatalogProduct>>({});
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const current = keyForPath(pathname, Object.values(catalog));
  const locale = current?.locale ?? (pathname.split('/')[1] as Locale) ?? 'bg';
  const key = current?.key ?? 'home';
  const t = copy[locale] ?? copy.bg;
  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  useEffect(() => {
    if (!current || isAdminPath) return;
    const id = current.key.split(':')[1];
    const canonical = current.key.startsWith('product:') ? catalogProductPath(locale, id, catalog[id]?.slug_by_locale) : pathFor(locale, current.key);
    if (pathname.replace(/\/+$/, '') !== canonical.replace(/\/+$/, '')) navigate({ pathname: canonical, search, hash }, { replace: true });
  }, [catalog, current?.key, hash, isAdminPath, locale, navigate, pathname, search]);
  useEffect(() => {
    if (isAdminPath) return;
    const client = getSupabaseClient();
    if (!client) {
      setCatalog(Object.fromEntries(createCatalogSeeds().map((product) => [product.id, product])));
      setCatalogLoaded(true);
      return;
    }
    let active = true;
    void loadCatalogProducts(client).then(({ data, error }) => {
      if (!active) return;
      const products = error ? createCatalogSeeds() : data;
      setCatalog(Object.fromEntries(products.map((product) => [product.id, product])));
      setCatalogLoaded(true);
    });
    void loadHarvestRecords(client)
      .then(({ data }) => { if (active) setHarvests((data ?? []).filter((record) => record.is_available)); });
    return () => { active = false; };
  }, [isAdminPath]);
  useEffect(() => {
    if (isAdminPath) return;
    localizedMeta(locale, key);
    if (key.startsWith('product:')) {
      const managed = catalog[key.split(':')[1]];
      if (managed) updateManagedProductMeta(locale, managed);
    }
  }, [catalog, isAdminPath, locale, key]);

  const publicCatalog = Object.fromEntries(Object.entries(catalog).map(([id, product]) => {
    const harvestStock = harvests.filter((record) => record.product_id === id).reduce((total, record) => total + record.weight_grams, 0);
    return [id, harvestStock > 0 ? { ...product, stock_grams: harvestStock } : product];
  }));

  if (isAdminPath) return <AdminPage />;
  if (!current && !catalogLoaded && isCatalogProductPath(pathname)) return <main className="admin-state"><span className="admin-spinner" /><p>Зареждаме продукта…</p></main>;
  if (!current && pathname !== '/') return <NotFound locale={locale} />;
  if (pathname === '/') return <RedirectHome />;
  if (catalogLoaded && (key.startsWith('product:') || key.startsWith('truffle:')) && !catalog[key.split(':')[1]]) return <NotFound locale={locale} />;
  return <CatalogContext.Provider value={publicCatalog}><CatalogLoadedContext.Provider value={catalogLoaded}><HarvestContext.Provider value={harvests}><Layout locale={locale} pageKey={key} t={t}><Page locale={locale} pageKey={key} t={t} /></Layout></HarvestContext.Provider></CatalogLoadedContext.Provider></CatalogContext.Provider>;
}

function RedirectHome() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/bg/', { replace: true }); }, [navigate]);
  return <main className="root-redirect"><p>TRUFFLE BALKANS</p><h1>Wild by nature. Balkan by origin.</h1><Link to="/bg/">Enter the Bulgarian site <ArrowRight size={16} /></Link></main>;
}

function NotFound({ locale }: { locale: Locale }) {
  const t = copy[locale] ?? copy.en;
  const ui = localeUi[locale] ?? localeUi.en;
  return <main className="not-found"><p>404</p><h1>{ui.notFound}</h1><Link className="button button-dark" to={pathFor(locale, 'home')}>{ui.returnHome}<ArrowRight size={16} /></Link><p>{t.heroTitle}</p></main>;
}

function Layout({ locale, pageKey, t, children }: { locale: Locale; pageKey: PageKey; t: Copy; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuToggle.current?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  return <>
    <a className="skip-link" href="#main">{localeUi[locale].skip}</a>
    <header className={`site-header${pageKey === 'home' ? ' site-header-home' : ''}`}>
      <Link className="brand" to={pathFor(locale, 'home')} aria-label={`Balkan Truffles — ${t.nav.home}`}>
        <img src="/snimki/logo1.png" width="790" height="316" alt="Balkan Truffles" />
      </Link>
      <button ref={menuToggle} type="button" className="icon-button mobile-menu-toggle" aria-label={menuOpen ? localeUi[locale].menuClose : localeUi[locale].menuOpen} aria-controls="main-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      <nav id="main-navigation" className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label={localeUi[locale].navigation}>
        {(pageKey === 'home' ? (['home', 'products', 'wholesale', 'about', 'contact'] as const) : (['home', 'products', 'wholesale', 'truffles', 'about', 'blog', 'contact'] as const)).map((item) => <Link key={item} to={pathFor(locale, item)} onClick={() => setMenuOpen(false)} aria-current={pageKey === item ? 'page' : undefined}>{t.nav[item]}</Link>)}
        <div className="mobile-nav-tools"><LanguagePicker locale={locale} pageKey={pageKey} compact /><Link className="button button-gold" to={pathFor(locale, 'wholesale')}>{pageKey === 'home' ? homeIntroCopy[locale].enquiry : t.cta} <ArrowUpRight size={15} /></Link></div>
      </nav>
      <div className="header-tools"><LanguagePicker locale={locale} pageKey={pageKey} /><Link className="button button-gold header-cta" to={pathFor(locale, 'wholesale')}>{pageKey === 'home' ? homeIntroCopy[locale].enquiry : t.cta} <ArrowUpRight size={15} /></Link></div>
    </header>
    <main id="main">{children}</main>
    <FooterCampaign key={locale} locale={locale} />
    <Footer locale={locale} t={t} />
  </>;
}

function LanguagePicker({ locale, pageKey, compact = false }: { locale: Locale; pageKey: PageKey; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const catalog = useContext(CatalogContext);
  const productId = pageKey.startsWith('product:') || pageKey.startsWith('truffle:') ? pageKey.split(':')[1] : null;
  return <div className={`language-picker ${compact ? 'language-picker-compact' : ''}`}>
    <button className="language-trigger" aria-expanded={open} aria-label={`${languageMeta[locale].label}: ${localeUi[locale].chooseLanguage}`} onClick={() => setOpen(!open)}><span className="language-code">{locale.toUpperCase()}</span><ChevronDown size={13} /></button>
    {open && <div className="language-menu">{locales.map((option) => <Link key={option} to={productId ? catalogProductPath(option, productId, catalog[productId]?.slug_by_locale) : pathFor(option, pageKey)} onClick={() => setOpen(false)} lang={option} hrefLang={languageMeta[option].hreflang} aria-current={option === locale ? 'page' : undefined}>{languageMeta[option].label}</Link>)}</div>}
  </div>;
}

function Footer({ locale, t }: { locale: Locale; t: Copy }) {
  return <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-brand"><Link className="brand brand-light" to={pathFor(locale, 'home')}><img src="/snimki/logo1.png" width="790" height="316" alt="Balkan Truffles" /></Link><p>{t.footerText}</p><a className="social-link" href="https://www.instagram.com/" aria-label="Instagram"><MoveUpRight size={16} /> Instagram</a></div>
      <div className="footer-column"><h2>{t.navMore}</h2>{(['products', 'wholesale', 'truffles', 'about', 'blog'] as const).map((item) => <Link key={item} to={pathFor(locale, item)}>{t.nav[item]}</Link>)}</div>
      <div className="footer-column"><h2>{t.nav.contact}</h2><Link to={pathFor(locale, 'contact')}>{t.nav.contact}</Link><Link to={pathFor(locale, 'faq')}>{t.faqTitle}</Link><p>{t.contactNote}</p></div>
      <div className="footer-column"><h2>{localeUi[locale].legal}</h2><Link to={pathFor(locale, 'privacy')}>{localeUi[locale].privacy}</Link><Link to={pathFor(locale, 'terms')}>{localeUi[locale].terms}</Link><Link to={pathFor(locale, 'cookies')}>{localeUi[locale].cookies}</Link><div className="footer-languages">{locales.map((lang) => <Link key={lang} to={pathFor(lang, 'home')}>{lang.toUpperCase()}</Link>)}</div></div>
    </div>
    <div className="footer-bottom"><span className="footer-copyright"><span>© {new Date().getFullYear()} Truffle Balkans</span><span>Esi Truffle EOOD</span></span><span>Wild by nature. Balkan by origin.</span></div>
  </footer>;
}

function Page({ locale, pageKey, t }: { locale: Locale; pageKey: PageKey; t: Copy }) {
  if (pageKey === 'home') return <Home locale={locale} t={t} />;
  if (pageKey === 'products') return <ProductIndex locale={locale} t={t} />;
  if (pageKey === 'wholesale') return <WholesalePage locale={locale} t={t} />;
  if (pageKey === 'truffles') return <TruffleIndex locale={locale} t={t} />;
  if (pageKey === 'about') return <AboutPage locale={locale} t={t} />;
  if (pageKey === 'contact') return <ContactPage locale={locale} t={t} />;
  if (pageKey === 'faq') return <FaqPage locale={locale} t={t} />;
  if (pageKey === 'blog') return <BlogPage locale={locale} t={t} />;
  if (pageKey.startsWith('product:') || pageKey.startsWith('truffle:')) return <DetailPage locale={locale} pageKey={pageKey} t={t} />;
  if (pageKey.startsWith('article:')) return <ArticlePage locale={locale} pageKey={pageKey} t={t} />;
  return <LegalPage locale={locale} pageKey={pageKey} t={t} />;
}

function Home({ locale, t }: { locale: Locale; t: Copy }) {
  const catalog = useContext(CatalogContext);
  const catalogLoaded = useContext(CatalogLoadedContext);
  const productIds = catalogProductIds(catalog, catalogLoaded);
  return <>
    <HomeIntro locale={locale} />
    <section id="seasonal" className="section featured-section"><SectionHeading eyebrow={t.origin} title={t.featured} intro={t.featuredIntro} /><div className="product-grid">{productIds.map((id, index) => <ProductCard key={id} locale={locale} t={t} id={id} number={`0${index + 1}`} />)}</div><div className="section-link"><Link className="text-link" to={pathFor(locale, 'products')}>{t.viewAll}<ArrowRight size={16} /></Link></div></section>
    <HomeHarvestRibbon locale={locale} t={t} />
    <section className="species-band"><div className="species-copy"><p className="eyebrow">{t.nav.truffles}</p><h2>{t.species}</h2><p>{t.speciesText}</p><Link className="text-link text-link-light" to={pathFor(locale, 'truffles')}>{t.learn}<ArrowRight size={16} /></Link></div><figure className="species-image"><img src="/snimki/IMG_7286.jpeg" alt={t.species} loading="lazy" width="828" height="1097" /></figure></section>
    <HomeStory t={t} />
    <KnowledgePreview locale={locale} t={t} />
    <FaqPreview locale={locale} t={t} />
  </>;
}

function HomeHarvestRibbon({ locale, t }: { locale: Locale; t: Copy }) {
  const gallery = harvestGalleryCopy[locale];
  return <section className="home-harvest-ribbon" aria-labelledby="home-harvest-title">
    <div className="home-harvest-ribbon__intro">
      <p className="eyebrow">{gallery.eyebrow}</p>
      <h2 id="home-harvest-title">{gallery.title}</h2>
      <p>{gallery.description}</p>
    </div>
    <HarvestLightbox locale={locale} />
    <div className="home-harvest-ribbon__footer"><Link className="text-link" to={pathFor(locale, 'products')}>{t.viewAll}<ArrowRight size={16} /></Link></div>
  </section>;
}

function HomeStory({ t }: { t: Copy }) {
  return <section className="field-story">
    <div className="field-story-image"><img src={homeStoryPhoto} alt={t.landscapeTitle} loading="lazy" width="828" height="1102" /><span>{t.landscapeEyebrow}</span></div>
    <div className="field-story-panel">
      <p className="eyebrow">{t.reasonsEyebrow}</p>
      <h2>{t.reasonsTitle}</h2>
      <p className="field-story-intro">{t.processText}</p>
      <div className="field-story-principles">{t.reasons.map(([title, text], index) => <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
      <div className="field-story-note"><Check size={17} /><div><strong>{t.quality}</strong><span>{t.qualityText}</span></div></div>
    </div>
  </section>;
}

function KnowledgePreview({ locale, t }: { locale: Locale; t: Copy }) {
  const labels = knowledgeCopy[locale];
  return <section className="section knowledge-section" aria-labelledby="knowledge-title">
    <div className="knowledge-heading"><div><p className="eyebrow">{labels.eyebrow}</p><h2 id="knowledge-title">{labels.title}</h2><p>{labels.intro}</p></div><Link className="text-link" to={pathFor(locale, 'blog')}>{labels.all}<ArrowRight size={16} /></Link></div>
    <div className="knowledge-grid">{knowledgeArticleIds.map((id, index) => {
      const article = articles[locale][id];
      return <article className="knowledge-card" key={id}><span className="knowledge-number">{String(index + 1).padStart(2, '0')}</span><h3><Link to={pathFor(locale, `article:${id}`)}>{article.title}</Link></h3><p>{article.description}</p><Link className="text-link" to={pathFor(locale, `article:${id}`)} aria-label={`${labels.read}: ${article.title}`}>{labels.read}<ArrowUpRight size={17} /></Link></article>;
    })}</div>
    <div className="knowledge-footer"><Link className="text-link" to={pathFor(locale, 'faq')}>{t.faqTitle}<ArrowRight size={16} /></Link></div>
  </section>;
}

function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return <div className="section-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{intro && <p className="section-intro">{intro}</p>}</div>;
}

function ProductCard({ locale, t, id, number }: { locale: Locale; t: Copy; id: string; number?: string }) {
  const catalog = useContext(CatalogContext);
  const catalogLoaded = useContext(CatalogLoadedContext);
  const harvests = useContext(HarvestContext).filter((record) => record.product_id === id);
  const product = productFor(id, locale, catalog)!;
  const harvestWeight = harvests.reduce((total, record) => total + record.weight_grams, 0);
  const harvestCount = harvests.reduce((total, record) => total + record.quantity, 0);
  const piecesLabel = { bg: 'бр.', en: 'pcs', it: 'pz', fr: 'pcs', de: 'Stk.' }[locale];
  const offer = product.price_per_kg != null ? `${formatProductPrice(product.price_per_kg, product.currency ?? 'EUR', locale)} / kg` : product.price != null ? formatProductPrice(product.price, product.currency ?? 'EUR', locale) : t.inquire;
  const productHref = catalogProductPath(locale, id, catalog[id]?.slug_by_locale);
  return <article className="product-card">
    <Link to={productHref} className="product-image"><img src={productImage(product, 820)} alt={`${product.title} — ${product.note}`} loading="lazy" width="820" height="940" /><span className="product-number">{number ?? '01'} / {String(catalogProductIds(catalog, catalogLoaded).length).padStart(2, '0')}</span><span className="product-arrow"><ArrowUpRight size={19} /></span></Link>
    <div className="product-meta"><span>{product.season}</span><span>{product.note}</span></div>
    <div className="catalog-offer-meta"><span className={product.available === false ? 'is-unavailable' : ''}>{product.available === false ? t.outOfStock : harvests.length ? `${harvestWeight} g · ${harvestCount} ${piecesLabel}` : product.available === true ? t.inStock : t.availability}</span>{product.weight_grams != null && <span>{product.weight_grams} g</span>}<strong>{offer}</strong></div>
    <h3><Link to={productHref}>{product.title}</Link></h3><p>{product.description}</p><Link className="text-link product-link" to={pathFor(locale, 'wholesale')} state={{ productId: id }}>{t.inquire}<ArrowRight size={15} /></Link>
  </article>;
}

function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <section className="page-intro"><p className="eyebrow"><span />{eyebrow}</p><h1>{title}</h1><p>{text}</p></section>;
}

function WholesalePage({ locale, t }: { locale: Locale; t: Copy }) {
  const location = useLocation();
  const catalog = useContext(CatalogContext);
  const catalogLoaded = useContext(CatalogLoadedContext);
  const initialProduct = (location.state as { productId?: string } | null)?.productId ?? '';
  const products = catalogProductIds(catalog, catalogLoaded).map((id) => ({ id, title: productFor(id, locale, catalog)?.title ?? id }));
  return <RestaurantPage locale={locale} t={t} products={products} initialProduct={initialProduct} />;
}

function ProductIndex({ locale, t }: { locale: Locale; t: Copy }) {
  const catalog = useContext(CatalogContext);
  const catalogLoaded = useContext(CatalogLoadedContext);
  const ids = catalogProductIds(catalog, catalogLoaded);
  const gallery = harvestGalleryCopy[locale];
  return <>
    <PageIntro eyebrow={t.origin} title={t.productsTitle} text={t.productsIntro} />
    <section className="section catalog-section">
      <div className="catalog-toolbar"><span>{t.availability}</span><span>{String(ids.length).padStart(2, '0')} — {t.allProducts}</span></div>
      <div className="product-grid product-grid-four">{ids.map((id, index) => <ProductCard key={id} locale={locale} t={t} id={id} number={String(index + 1).padStart(2, '0')} />)}</div>
      <div className="availability-note"><Sparkles size={19} /><p><strong>{t.freshness}</strong><br />{t.contactNote}</p><Link className="text-link" to={pathFor(locale, 'wholesale')}>{t.cta}<ArrowRight size={15} /></Link></div>
    </section>
    <section className="section harvest-gallery" aria-labelledby="harvest-gallery-title">
      <div className="harvest-gallery-heading"><div><p className="eyebrow">{gallery.eyebrow}</p><h2 id="harvest-gallery-title">{gallery.title}</h2></div><p>{gallery.description}</p></div>
      <HarvestLightbox locale={locale} photos={harvestPhotos} />
    </section>
  </>;
}

function TruffleIndex({ locale, t }: { locale: Locale; t: Copy }) {
  const catalog = useContext(CatalogContext);
  const catalogLoaded = useContext(CatalogLoadedContext);
  const ids = catalogProductIds(catalog, catalogLoaded);
  return <><PageIntro eyebrow={t.origin} title={t.trufflesTitle} text={t.speciesText} /><section className="section catalog-section"><div className="truffle-list">{ids.map((id, index) => { const item = productFor(id, locale, catalog)!; const target = truffleFor(`truffle:${id}`, locale) ? pathFor(locale, `truffle:${id}`) : catalogProductPath(locale, id, catalog[id]?.slug_by_locale); return <Link to={target} className="truffle-list-item" key={id}><span className="list-count">{String(index + 1).padStart(2, '0')}</span><img src={productImage(item, 600)} alt={item.title} loading="lazy" width="600" height="400" /><div><span className="eyebrow">{item.season}</span><h2>{item.title}</h2><p>{item.description}</p></div><ArrowUpRight className="list-arrow" /></Link>; })}</div></section></>;
}

function DetailPage({ locale, pageKey, t }: { locale: Locale; pageKey: PageKey; t: Copy }) {
  const catalog = useContext(CatalogContext);
  const catalogLoaded = useContext(CatalogLoadedContext);
  const ids = catalogProductIds(catalog, catalogLoaded);
  const id = pageKey.split(':')[1];
  const item = productFor(id, locale, catalog)!;
  const records = useContext(HarvestContext).filter((record) => record.product_id === id);
  const photos = [...new Set([productImage(item, 1500), ...records.flatMap((record) => record.image_url ? [safeCatalogImage(record.image_url, id, 1500)] : [])])];
  return <div className="product-detail-layout"><ProductDetail locale={locale} t={t} id={id} item={item} photos={photos} productMode={pageKey.startsWith('product:')} /><FaqPreview locale={locale} t={t} /><section className="section related-section"><SectionHeading eyebrow={t.nav.products} title={t.related} /><div className="product-grid">{ids.filter((candidate) => candidate !== id).slice(0, 3).map((candidate, index) => <ProductCard key={candidate} locale={locale} t={t} id={candidate} number={String(index + 1).padStart(2, '0')} />)}</div></section></div>;
}

function BlogPage({ locale, t }: { locale: Locale; t: Copy }) {
  return <><PageIntro eyebrow={t.nav.blog} title={t.blogTitle} text={t.landscapeText} /><section className="section blog-grid-section"><div className="blog-grid">{Object.entries(articles[locale]).map(([id, article], index) => <article className={`blog-card ${index === 0 ? 'blog-card-featured' : ''}`} key={id}><Link to={pathFor(locale, `article:${id}`)} className="blog-image"><img src={imageUrl(article.image, 1000)} alt={article.title} loading="lazy" width="1000" height="700" /></Link><p className="blog-date">{article.date} <span>·</span> Truffle Balkans</p><h2><Link to={pathFor(locale, `article:${id}`)}>{article.title}</Link></h2><p>{article.description}</p><Link className="text-link" to={pathFor(locale, `article:${id}`)}>{t.learn}<ArrowRight size={15} /></Link></article>)}</div></section></>;
}

function ArticlePage({ locale, pageKey, t }: { locale: Locale; pageKey: PageKey; t: Copy }) {
  const article = articles[locale][pageKey.split(':')[1]];
  return <><article className="article-page"><Link className="back-link" to={pathFor(locale, 'blog')}>← {t.nav.blog}</Link><header className="article-heading"><p className="eyebrow">{article.date} · <Link to={pathFor(locale, 'about')}>Truffle Balkans</Link></p><h1>{article.title}</h1><p>{article.description}</p></header><img className="article-cover" src={imageUrl(article.image, 1800)} alt={article.title} loading="eager" width="1800" height="1000" /><div className="article-body"><p className="article-deck">{article.body}</p>{article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{article.sections?.map((section) => <section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}<div className="article-actions"><Link className="text-link" to={pathFor(locale, 'products')}>{t.viewAll}<ArrowRight size={16} /></Link><Link className="text-link" to={pathFor(locale, 'wholesale')}>{t.cta}<ArrowUpRight size={16} /></Link></div></div></article><section className="section related-section"><SectionHeading eyebrow={t.nav.blog} title={t.related} /><BlogCards locale={locale} t={t} skip={pageKey.split(':')[1]} /></section></>;
}

function BlogCards({ locale, t, skip }: { locale: Locale; t: Copy; skip?: string }) {
  return <div className="blog-grid">{Object.entries(articles[locale]).filter(([id]) => id !== skip).slice(0, 2).map(([id, article]) => <article className="blog-card" key={id}><Link to={pathFor(locale, `article:${id}`)} className="blog-image"><img src={imageUrl(article.image, 800)} alt={article.title} loading="lazy" width="800" height="600" /></Link><p className="blog-date">{article.date} · Truffle Balkans</p><h2><Link to={pathFor(locale, `article:${id}`)}>{article.title}</Link></h2><p>{article.description}</p><Link className="text-link" to={pathFor(locale, `article:${id}`)}>{t.learn}<ArrowRight size={15} /></Link></article>)}</div>;
}

function FaqPreview({ locale, t }: { locale: Locale; t: Copy }) {
  const { pathname } = useLocation();
  const catalog = useContext(CatalogContext);
  const page = keyForPath(pathname, Object.values(catalog))?.key;
  const productId = page?.startsWith('product:') || page?.startsWith('truffle:') ? page.split(':')[1] : null;
  const records = useContext(HarvestContext).filter((record) => record.product_id === productId);
  const product = productId ? productFor(productId, locale, catalog) : undefined;
  const labels = {
    bg: { title: 'Намерени трюфели', total: 'общо', pieces: 'бр.', weight: 'Тегло', quantity: 'Брой' },
    en: { title: 'Recent finds', total: 'total', pieces: 'pcs', weight: 'Weight', quantity: 'Count' },
    it: { title: 'Raccolta recente', total: 'totali', pieces: 'pz', weight: 'Peso', quantity: 'Quantità' },
    fr: { title: 'Dernières récoltes', total: 'au total', pieces: 'pcs', weight: 'Poids', quantity: 'Quantité' },
    de: { title: 'Aktuelle Funde', total: 'insgesamt', pieces: 'Stk.', weight: 'Gewicht', quantity: 'Anzahl' },
  }[locale];
  const totalWeight = records.reduce((sum, record) => sum + record.weight_grams, 0);
  const totalQuantity = records.reduce((sum, record) => sum + record.quantity, 0);
  return <>{records.length > 0 && product && <section className="section harvest-stock" aria-labelledby="harvest-stock-title"><div className="harvest-stock-heading"><div><p className="eyebrow">{t.availability}</p><h2 id="harvest-stock-title">{labels.title}</h2></div><strong>{totalWeight} g {labels.total} · {totalQuantity} {labels.pieces}</strong></div><div className="harvest-stock-grid">{records.map((record) => <article className="harvest-stock-item" key={record.id}>{record.image_url ? <img src={record.image_url} alt={`${product.title} · ${record.weight_grams} g`} loading="lazy" /> : <img src={productImage(product, 700)} alt={product.title} loading="lazy" />}<div className="harvest-stock-copy"><time dateTime={record.found_on}>{new Date(`${record.found_on}T12:00:00`).toLocaleDateString(locale)}</time><div><span>{labels.weight}</span><strong>{record.weight_grams} g</strong></div><div><span>{labels.quantity}</span><strong>{record.quantity} {labels.pieces}</strong></div>{record.notes && <p>{record.notes}</p>}</div></article>)}</div></section>}<section className="section faq-section"><div className="faq-heading"><p className="eyebrow">{t.faqTitle}</p><h2>{t.faqTitle}</h2><Link className="text-link" to={pathFor(locale, 'faq')}>{t.learn}<ArrowRight size={15} /></Link></div><div className="faq-list">{faqItems(locale).map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section></>;
}

function FaqPage({ locale, t }: { locale: Locale; t: Copy }) {
  return <><PageIntro eyebrow={t.faqTitle} title={t.faqPageTitle} text={t.faqTitle} /><section className="section faq-page-section"><div className="faq-list">{faqItems(locale).map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section></>;
}

function LegalPage({ locale, pageKey, t }: { locale: Locale; pageKey: PageKey; t: Copy }) {
  const title = titleFor(pageKey, locale);
  const text = localeUi[locale].legalDisclaimer;
  return <><PageIntro eyebrow="TRUFFLE BALKANS" title={title} text={text} /><section className="section legal-section"><p>{text}</p>{pageKey === 'privacy' && <><h2>{newsletterCopy[locale].heading}</h2><p>{newsletterCopy[locale].privacyInfo}</p><a className="text-link" href={whatsappLink(newsletterCopy[locale].unsubscribeMessage)} target="_blank" rel="noopener noreferrer">{newsletterCopy[locale].unsubscribe}<ArrowUpRight size={16} /></a></>}<p>{t.contactNote}</p><Link className="text-link" to={pathFor(locale, 'contact')}>{t.nav.contact}<ArrowRight size={15} /></Link></section></>;
}
