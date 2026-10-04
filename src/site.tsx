import { createContext, useContext, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, Compass, Leaf, Menu, MoveUpRight, ShieldCheck, Sparkles, X } from 'lucide-react';
import { articles, copy, imageUrl, keyForPath, languageMeta, locales, pathFor, titleFor, truffleFor, truffleIds, type Copy, type Locale, type PageKey } from './content';
import { localeUi } from './i18n';
import { renderHead } from './seo';
import { AdminPage } from './admin';
import { getSupabaseClient, type CatalogProduct } from './catalog';

const CatalogContext = createContext<Record<string, CatalogProduct>>({});

type ProductView = NonNullable<ReturnType<typeof truffleFor>> & {
  origin?: string;
  weight_grams?: number | null;
  price?: number | null;
  currency?: string;
  available?: boolean;
  stock_grams?: number | null;
};

function productFor(id: string, locale: Locale, catalog: Record<string, CatalogProduct>): ProductView | undefined {
  const product = truffleFor(`product:${id}`, locale);
  if (!product) return undefined;
  const managed = catalog[id];
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
    currency: managed.currency,
    available: managed.available,
    stock_grams: managed.stock_grams,
  };
}

function productImage(product: { image: string }, width: number) {
  return product.image.startsWith('http') ? product.image : imageUrl(product.image, width);
}

function formatProductPrice(price: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price);
}

function updateManagedProductMeta(locale: Locale, product: CatalogProduct) {
  const title = `${product.title_by_locale[locale] || product.title_by_locale.en} | Truffle Balkans`;
  const description = product.description_by_locale[locale] || product.description_by_locale.en;
  document.title = title;
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
    const productSchema = graph.find((entry) => entry['@type'] === 'Product');
    if (!productSchema) return;
    productSchema.name = product.title_by_locale[locale] || product.title_by_locale.en;
    productSchema.description = description;
    productSchema.image = product.image_url;
    if (product.price != null) productSchema.offers = { '@type': 'Offer', price: product.price, priceCurrency: product.currency, availability: product.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' };
    else delete productSchema.offers;
    schema.textContent = JSON.stringify(graph);
  } catch {
    return;
  }
}

function localizedMeta(locale: Locale, key: PageKey) {
  const fragment = renderHead(locale, key);
  document.title = fragment.match(/<title>(.*?)<\/title>/)?.[1] ?? 'Truffle Balkans';
  document.documentElement.lang = locale;
  const parsed = new DOMParser().parseFromString(`<head>${fragment}</head>`, 'text/html').head;
  const owned = document.head.querySelectorAll('[data-truffle-seo]');
  owned.forEach((element) => element.remove());
  [...parsed.children].forEach((element) => {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.dataset.truffleSeo = 'true';
    document.head.append(clone);
  });
}

export function Site() {
  const { pathname } = useLocation();
  const isAdminPath = pathname === '/admin' || pathname === '/admin/' || pathname.startsWith('/admin/');
  const current = keyForPath(pathname);
  const locale = current?.locale ?? (pathname.split('/')[1] as Locale) ?? 'bg';
  const key = current?.key ?? 'home';
  const t = copy[locale] ?? copy.bg;
  const [catalog, setCatalog] = useState<Record<string, CatalogProduct>>({});
  useEffect(() => {
    if (isAdminPath) return;
    const client = getSupabaseClient();
    if (!client) return;
    let active = true;
    void client.from('truffle_products').select('*').then(({ data }) => {
      if (active && data) setCatalog(Object.fromEntries((data as CatalogProduct[]).map((product) => [product.id, product])));
    });
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

  if (isAdminPath) return <AdminPage />;
  if (!current && pathname !== '/') return <NotFound locale={locale} />;
  if (pathname === '/') return <RedirectHome />;
  return <CatalogContext.Provider value={catalog}><Layout locale={locale} pageKey={key} t={t}><Page locale={locale} pageKey={key} t={t} /></Layout></CatalogContext.Provider>;
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
  const location = useLocation();
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  return <>
    <a className="skip-link" href="#main">{localeUi[locale].skip}</a>
    <header className="site-header">
      <Link className="brand" to={pathFor(locale, 'home')} aria-label="Truffle Balkans home">
        <img src="/images/brand-logo.png" width="55" height="55" alt="" />
        <span><strong>TRUFFLE</strong><small>B A L K A N S</small></span>
      </Link>
      <button className="icon-button mobile-menu-toggle" aria-label={menuOpen ? localeUi[locale].menuClose : localeUi[locale].menuOpen} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label={localeUi[locale].navigation}>
        {(['home', 'products', 'wholesale', 'truffles', 'about', 'blog', 'contact'] as const).map((item) => <Link key={item} to={pathFor(locale, item)} aria-current={pageKey === item ? 'page' : undefined}>{t.nav[item]}</Link>)}
        <div className="mobile-nav-tools"><LanguagePicker locale={locale} pageKey={pageKey} compact /><Link className="button button-gold" to={pathFor(locale, 'wholesale')}>{t.cta} <ArrowUpRight size={15} /></Link></div>
      </nav>
      <div className="header-tools"><LanguagePicker locale={locale} pageKey={pageKey} /><Link className="button button-gold header-cta" to={pathFor(locale, 'wholesale')}>{t.cta} <ArrowUpRight size={15} /></Link></div>
    </header>
    <main id="main">{children}</main>
    <Footer locale={locale} t={t} />
  </>;
}

function LanguagePicker({ locale, pageKey, compact = false }: { locale: Locale; pageKey: PageKey; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return <div className={`language-picker ${compact ? 'language-picker-compact' : ''}`}>
    <button className="language-trigger" aria-expanded={open} aria-label={`${languageMeta[locale].label}: ${localeUi[locale].chooseLanguage}`} onClick={() => setOpen(!open)}><span className="language-code">{locale.toUpperCase()}</span><ChevronDown size={13} /></button>
    {open && <div className="language-menu">{locales.map((option) => <Link key={option} to={pathFor(option, pageKey)} lang={option} hrefLang={languageMeta[option].hreflang} aria-current={option === locale ? 'page' : undefined}>{languageMeta[option].label}</Link>)}</div>}
  </div>;
}

function Footer({ locale, t }: { locale: Locale; t: Copy }) {
  return <footer className="site-footer">
    <div className="footer-main">
      <div className="footer-brand"><Link className="brand brand-light" to={pathFor(locale, 'home')}><img src="/images/brand-logo.png" width="50" height="50" alt="" /><span><strong>TRUFFLE</strong><small>B A L K A N S</small></span></Link><p>{t.footerText}</p><a className="social-link" href="https://www.instagram.com/" aria-label="Instagram"><MoveUpRight size={16} /> Instagram</a></div>
      <div className="footer-column"><h2>{t.navMore}</h2>{(['products', 'wholesale', 'truffles', 'about', 'blog'] as const).map((item) => <Link key={item} to={pathFor(locale, item)}>{t.nav[item]}</Link>)}</div>
      <div className="footer-column"><h2>{t.nav.contact}</h2><Link to={pathFor(locale, 'contact')}>{t.nav.contact}</Link><Link to={pathFor(locale, 'faq')}>{t.faqTitle}</Link><p>{t.contactNote}</p></div>
      <div className="footer-column"><h2>{localeUi[locale].legal}</h2><Link to={pathFor(locale, 'privacy')}>{localeUi[locale].privacy}</Link><Link to={pathFor(locale, 'terms')}>{localeUi[locale].terms}</Link><Link to={pathFor(locale, 'cookies')}>{localeUi[locale].cookies}</Link><div className="footer-languages">{locales.map((lang) => <Link key={lang} to={pathFor(lang, 'home')}>{lang.toUpperCase()}</Link>)}</div></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Truffle Balkans</span><span>Wild by nature. Balkan by origin.</span></div>
  </footer>;
}

function Page({ locale, pageKey, t }: { locale: Locale; pageKey: PageKey; t: Copy }) {
  if (pageKey === 'home') return <Home locale={locale} t={t} />;
  if (pageKey === 'products') return <ProductIndex locale={locale} t={t} />;
  if (pageKey === 'wholesale') return <WholesalePage locale={locale} t={t} />;
  if (pageKey === 'truffles') return <TruffleIndex locale={locale} t={t} />;
  if (pageKey === 'about') return <AboutPage locale={locale} t={t} />;
  if (pageKey === 'contact') return <ContactPage t={t} />;
  if (pageKey === 'faq') return <FaqPage locale={locale} t={t} />;
  if (pageKey === 'blog') return <BlogPage locale={locale} t={t} />;
  if (pageKey.startsWith('product:') || pageKey.startsWith('truffle:')) return <DetailPage locale={locale} pageKey={pageKey} t={t} />;
  if (pageKey.startsWith('article:')) return <ArticlePage locale={locale} pageKey={pageKey} t={t} />;
  return <LegalPage locale={locale} pageKey={pageKey} t={t} />;
}

function Home({ locale, t }: { locale: Locale; t: Copy }) {
  const catalog = useContext(CatalogContext);
  const heroSlides = truffleIds.map((id) => productFor(id, locale, catalog)!);
  const [activeSlide, setActiveSlide] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % heroSlides.length), 6500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);
  return <>
    <section className="hero" style={{ '--hero-image': `url("${productImage(heroSlides[0], 2000)}")` } as React.CSSProperties}>
      {heroSlides.map((slide, index) => <img key={slide.slug} className={`hero-photo ${activeSlide === index ? 'is-active' : ''}`} src={productImage(slide, 1280)} alt="" aria-hidden="true" loading={index === 0 ? 'eager' : 'lazy'} />)}
      <div className="hero-shade" />
      <div className="hero-copy"><p className="eyebrow"><span />{t.heroEyebrow}</p><h1>{t.heroTitle}</h1><p className="hero-description">{t.heroText}</p><Link className="button button-gold" to={pathFor(locale, 'products')}>{t.discover}<ArrowRight size={17} /></Link></div>
      <div className="hero-caption"><span>42° 41′ N</span><span>{t.origin}</span><span>23° 19′ E</span></div>
      <a className="scroll-cue" href="#seasonal"><ArrowDown size={15} /> <span>{localeUi[locale].scroll}</span></a>
      <div className="hero-pagination" role="group" aria-label={t.origin}>{heroSlides.map((slide, index) => <button key={slide.slug} type="button" className={activeSlide === index ? 'is-active' : ''} aria-label={`${localeUi[locale].photo} ${index + 1}: ${slide.title}`} aria-pressed={activeSlide === index} onClick={() => setActiveSlide(index)} />)}</div>
      <div className="hero-stamp"><Compass size={21} /><span>WILD<br />BY NATURE</span></div>
    </section>
    <section id="seasonal" className="section featured-section"><SectionHeading eyebrow={t.origin} title={t.featured} intro={t.featuredIntro} /><div className="product-grid">{truffleIds.slice(0, 3).map((id, index) => <ProductCard key={id} locale={locale} t={t} id={id} number={`0${index + 1}`} />)}</div><div className="section-link"><Link className="text-link" to={pathFor(locale, 'products')}>{t.viewAll}<ArrowRight size={16} /></Link></div></section>
    <section className="species-band"><div className="species-copy"><p className="eyebrow">{t.reasonsEyebrow}</p><h2>{t.species}</h2><p>{t.speciesText}</p><Link className="text-link text-link-light" to={pathFor(locale, 'truffles')}>{t.learn}<ArrowRight size={16} /></Link></div><div className="species-image" role="img" aria-label={t.origin} style={{ backgroundImage: `url(${imageUrl('photo-1448375240586-882707db888b', 1000)})` }} /><div className="species-index">01 <span>/</span> 04</div></section>
    <section className="section philosophy-section"><SectionHeading eyebrow={t.reasonsEyebrow} title={t.reasonsTitle} intro={t.reasonsText} /><div className="reason-grid">{t.reasons.map(([title, text], index) => { const icons = [<Leaf />, <ShieldCheck />, <Sparkles />]; return <article className="reason" key={title}><span className="reason-number">0{index + 1}</span><div className="reason-icon">{icons[index]}</div><h3>{title}</h3><p>{text}</p></article>; })}</div></section>
    <section className="nature-gallery" aria-hidden="true"><figure><img src={imageUrl('photo-1448375240586-882707db888b', 1000)} alt="" loading="lazy" width="1000" height="700" /></figure><figure><img src={imageUrl('photo-1472396961693-142e6e269027', 1200)} alt="" loading="lazy" width="1200" height="900" /></figure><figure><img src={imageUrl('photo-1500530855697-b586d89ba3ee', 1000)} alt="" loading="lazy" width="1000" height="700" /></figure></section>
    <section className="landscape-section"><div className="landscape-photo" style={{ backgroundImage: `url(${imageUrl('photo-1472396961693-142e6e269027', 1800)})` }} /><div className="landscape-content"><p className="eyebrow">{t.landscapeEyebrow}</p><h2>{t.landscapeTitle}</h2><p>{t.landscapeText}</p><Link className="text-link" to={pathFor(locale, 'about')}>{t.nav.about}<ArrowRight size={16} /></Link></div><span className="landscape-mark">BALKAN<br />TERROIR</span></section>
    <section className="process-section"><div className="process-image" style={{ backgroundImage: `url(${imageUrl('photo-1500530855697-b586d89ba3ee', 1100)})` }} /><div className="process-copy"><p className="eyebrow">{t.processEyebrow}</p><h2>{t.processTitle}</h2><p>{t.processText}</p><div className="quality-note"><Check size={17} /><div><strong>{t.quality}</strong><span>{t.qualityText}</span></div></div></div></section>
    <FaqPreview locale={locale} t={t} /><CallToAction locale={locale} t={t} />
  </>;
}

function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return <div className="section-heading"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2>{intro && <p className="section-intro">{intro}</p>}</div>;
}

function ProductCard({ locale, t, id, number }: { locale: Locale; t: Copy; id: typeof truffleIds[number]; number?: string }) {
  const product = productFor(id, locale, useContext(CatalogContext))!;
  const offer = product.price != null ? formatProductPrice(product.price, product.currency ?? 'EUR', locale) : t.inquire;
  return <article className="product-card">
    <Link to={pathFor(locale, `product:${id}`)} className="product-image"><img src={productImage(product, 820)} alt={`${product.title} — ${product.note}`} loading="lazy" width="820" height="940" /><span className="product-number">{number ?? '01'} / 04</span><span className="product-arrow"><ArrowUpRight size={19} /></span></Link>
    <div className="product-meta"><span>{product.season}</span><span>{product.note}</span></div>
    <div className="catalog-offer-meta"><span className={product.available === false ? 'is-unavailable' : ''}>{product.available === false ? t.outOfStock : product.available === true ? t.inStock : t.availability}</span>{product.weight_grams != null && <span>{product.weight_grams} g</span>}<strong>{offer}</strong></div>
    <h3><Link to={pathFor(locale, `product:${id}`)}>{product.title}</Link></h3><p>{product.description}</p><Link className="text-link product-link" to={pathFor(locale, 'wholesale')} state={{ productId: id }}>{t.inquire}<ArrowRight size={15} /></Link>
  </article>;
}

function PageIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <section className="page-intro"><p className="eyebrow"><span />{eyebrow}</p><h1>{title}</h1><p>{text}</p></section>;
}

function WholesalePage({ locale, t }: { locale: Locale; t: Copy }) {
  const location = useLocation();
  const catalog = useContext(CatalogContext);
  const productId = (location.state as { productId?: string } | null)?.productId ?? '';
  const [status, setStatus] = useState<'missingEmail' | 'opened' | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = import.meta.env.VITE_CONTACT_EMAIL?.trim();
    if (!email) {
      setStatus('missingEmail');
      return;
    }
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const body = Object.entries(values).map(([key, value]) => `${key}: ${value}`).join('\n');
    const subject = encodeURIComponent(`Wholesale enquiry — ${values.company}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(body)}`;
    setStatus('opened');
  }

  return <>
    <PageIntro eyebrow={t.wholesaleEyebrow} title={t.wholesaleTitle} text={t.wholesaleIntro} />
    <section className="wholesale-section">
      <div className="wholesale-aside">
        <p className="eyebrow">TRUFFLE BALKANS · B2B</p>
        <h2>{t.wholesaleFormTitle}</h2>
        <p>{t.wholesaleFormText}</p>
        <div className="wholesale-points">{t.wholesalePoints.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
      </div>
      <form className="wholesale-form" onSubmit={submit}>
        <div className="form-row"><label>{t.form.name}<input name="name" autoComplete="name" required /></label><label>{t.form.company}<input name="company" autoComplete="organization" required /></label></div>
        <div className="form-row"><label>{t.form.email}<input name="email" type="email" autoComplete="email" required /></label><label>{t.form.phone}<input name="phone" type="tel" autoComplete="tel" /></label></div>
        <div className="form-row"><label>{t.form.product}<select name="product" defaultValue={productId} required><option value="" disabled>{t.form.selectProduct}</option>{truffleIds.map((id) => <option key={id} value={id}>{productFor(id, locale, catalog)?.title}</option>)}</select></label><label>{t.form.quantity}<input name="quantity" placeholder={t.form.quantityHint} required /></label></div>
        <div className="form-row"><label>{t.form.country}<input name="country" autoComplete="country-name" /></label><label>{t.form.delivery}<input name="deliveryDate" type="date" /></label></div>
        <label>{t.form.message}<textarea name="message" rows={4} /></label>
        <button className="button button-dark" type="submit">{t.form.send}<ArrowUpRight size={16} /></button>
        {status === 'missingEmail' && <p className="form-notice" role="status">{t.quoteMissingEmail}</p>}
        {status === 'opened' && <p className="form-success" role="status">{t.quoteOpened}</p>}
      </form>
    </section>
    <CallToAction locale={locale} t={t} />
  </>;
}

function ProductIndex({ locale, t }: { locale: Locale; t: Copy }) {
  return <><PageIntro eyebrow={t.origin} title={t.productsTitle} text={t.productsIntro} /><section className="section catalog-section"><div className="catalog-toolbar"><span>{t.availability}</span><span>04 — {t.allProducts}</span></div><div className="product-grid product-grid-four">{truffleIds.map((id, index) => <ProductCard key={id} locale={locale} t={t} id={id} number={`0${index + 1}`} />)}</div><div className="availability-note"><Sparkles size={19} /><p><strong>{t.freshness}</strong><br />{t.contactNote}</p><Link className="text-link" to={pathFor(locale, 'wholesale')}>{t.cta}<ArrowRight size={15} /></Link></div></section><CallToAction locale={locale} t={t} /></>;
}

function TruffleIndex({ locale, t }: { locale: Locale; t: Copy }) {
  const catalog = useContext(CatalogContext);
  return <><PageIntro eyebrow={t.origin} title={t.trufflesTitle} text={t.speciesText} /><section className="section catalog-section"><div className="truffle-list">{truffleIds.map((id, index) => { const item = productFor(id, locale, catalog)!; return <Link to={pathFor(locale, `truffle:${id}`)} className="truffle-list-item" key={id}><span className="list-count">0{index + 1}</span><img src={productImage(item, 600)} alt={item.title} loading="lazy" width="600" height="400" /><div><span className="eyebrow">{item.season}</span><h2>{item.title}</h2><p>{item.description}</p></div><ArrowUpRight className="list-arrow" /></Link>; })}</div></section><CallToAction locale={locale} t={t} /></>;
}

function DetailPage({ locale, pageKey, t }: { locale: Locale; pageKey: PageKey; t: Copy }) {
  const catalog = useContext(CatalogContext);
  const productMode = pageKey.startsWith('product:');
  const id = pageKey.split(':')[1];
  const item = productFor(id, locale, catalog)!;
  const offer = item.price != null ? formatProductPrice(item.price, item.currency ?? 'EUR', locale) : t.inquire;
  return <><div className="detail-hero"><div className="detail-visual"><img src={productImage(item, 1500)} alt={`${item.title} from ${item.origin ?? 'the Balkans'}`} loading="eager" /></div><div className="detail-copy"><Link className="back-link" to={pathFor(locale, productMode ? 'products' : 'truffles')}>← {t.back}</Link><p className="eyebrow"><span />{productMode ? item.available === false ? t.outOfStock : t.availability : t.origin}</p><h1>{item.title}</h1><p className="detail-lede">{item.description}</p><div className="detail-facts"><div><span>{t.season}</span><strong>{item.season}</strong></div><div><span>{t.originLabel}</span><strong>{item.origin ?? 'Balkans'}</strong></div><div><span>{t.grade}</span><strong>{item.note}</strong></div>{item.weight_grams != null && <div><span>{t.form.quantity}</span><strong>{item.weight_grams} g</strong></div>}{item.available !== undefined && <div><span>{t.availability}</span><strong>{item.available ? t.inStock : t.outOfStock}{item.stock_grams != null ? ` · ${item.stock_grams} g` : ''}</strong></div>}</div><Link className="button button-dark" to={pathFor(locale, 'wholesale')} state={{ productId: id }}>{offer}<ArrowUpRight size={16} /></Link></div></div><section className="section detail-story"><div><p className="eyebrow">{t.landscapeEyebrow}</p><h2>{item.title}, at its best</h2></div><div className="detail-prose"><p>{item.body}</p><h3>{t.season}</h3><p>{item.season}. Availability, size and grade depend on the current harvest. Contact us for the latest selection and handling guidance.</p></div></section><FaqPreview locale={locale} t={t} /><section className="section related-section"><SectionHeading eyebrow={t.nav.truffles} title={t.related} /><div className="product-grid">{truffleIds.filter((candidate) => candidate !== id).slice(0, 3).map((candidate, index) => <ProductCard key={candidate} locale={locale} t={t} id={candidate} number={`0${index + 1}`} />)}</div></section><CallToAction locale={locale} t={t} /></>;
}

function AboutPage({ locale, t }: { locale: Locale; t: Copy }) {
  return <><PageIntro eyebrow="TRUFFLE BALKANS" title={t.aboutTitle} text={t.aboutText} /><section className="about-visual" style={{ backgroundImage: `url(${imageUrl('photo-1448375240586-882707db888b', 1800)})` }}><span>{t.landscapeEyebrow}</span></section><section className="section about-story"><div><p className="eyebrow">{t.reasonsEyebrow}</p><h2>{t.landscapeTitle}</h2></div><div><p>{t.landscapeText}</p><p>{t.processText}</p><p>{t.qualityText}</p></div></section><section className="section philosophy-section"><SectionHeading eyebrow={t.reasonsEyebrow} title={t.reasonsTitle} intro={t.reasonsText} /><div className="reason-grid">{t.reasons.map(([title, text], index) => <article className="reason" key={title}><span className="reason-number">0{index + 1}</span><div className="reason-icon">{index === 0 ? <Leaf /> : index === 1 ? <ShieldCheck /> : <Sparkles />}</div><h3>{title}</h3><p>{text}</p></article>)}</div></section><CallToAction locale={locale} t={t} /></>;
}

function BlogPage({ locale, t }: { locale: Locale; t: Copy }) {
  return <><PageIntro eyebrow={t.nav.blog} title={t.blogTitle} text={t.landscapeText} /><section className="section blog-grid-section"><div className="blog-grid">{Object.entries(articles[locale]).map(([id, article], index) => <article className={`blog-card ${index === 0 ? 'blog-card-featured' : ''}`} key={id}><Link to={pathFor(locale, `article:${id}`)} className="blog-image"><img src={imageUrl(article.image, 1000)} alt={article.title} loading="lazy" width="1000" height="700" /></Link><p className="blog-date">{article.date} <span>·</span> Truffle Balkans</p><h2><Link to={pathFor(locale, `article:${id}`)}>{article.title}</Link></h2><p>{article.description}</p><Link className="text-link" to={pathFor(locale, `article:${id}`)}>{t.learn}<ArrowRight size={15} /></Link></article>)}</div></section></>;
}

function ArticlePage({ locale, pageKey, t }: { locale: Locale; pageKey: PageKey; t: Copy }) {
  const article = articles[locale][pageKey.split(':')[1]];
  return <><article className="article-page"><Link className="back-link" to={pathFor(locale, 'blog')}>← {t.nav.blog}</Link><header className="article-heading"><p className="eyebrow">{article.date} · Truffle Balkans</p><h1>{article.title}</h1><p>{article.description}</p></header><img className="article-cover" src={imageUrl(article.image, 1800)} alt={article.title} loading="eager" width="1800" height="1000" /><div className="article-body"><p className="article-deck">{article.body}</p>{article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></article><section className="section related-section"><SectionHeading eyebrow={t.nav.blog} title={t.related} /><BlogCards locale={locale} t={t} skip={pageKey.split(':')[1]} /></section></>;
}

function BlogCards({ locale, t, skip }: { locale: Locale; t: Copy; skip?: string }) {
  return <div className="blog-grid">{Object.entries(articles[locale]).filter(([id]) => id !== skip).slice(0, 2).map(([id, article]) => <article className="blog-card" key={id}><Link to={pathFor(locale, `article:${id}`)} className="blog-image"><img src={imageUrl(article.image, 800)} alt={article.title} loading="lazy" width="800" height="600" /></Link><p className="blog-date">{article.date} · Truffle Balkans</p><h2><Link to={pathFor(locale, `article:${id}`)}>{article.title}</Link></h2><p>{article.description}</p><Link className="text-link" to={pathFor(locale, `article:${id}`)}>{t.learn}<ArrowRight size={15} /></Link></article>)}</div>;
}

function ContactPage({ t }: { t: Copy }) {
  const [sent, setSent] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }
  return <><PageIntro eyebrow={t.nav.contact} title={t.contactTitle} text={t.contactText} /><section className="contact-section"><div className="contact-aside"><span className="contact-index">01 / {t.nav.contact}</span><h2>{t.origin}</h2><p>{t.contactNote}</p><div className="contact-fact"><span>{t.availability}</span><strong>{t.freshness}</strong></div><div className="contact-fact"><span>{t.nav.products}</span><strong>{t.productsIntro}</strong></div></div><form className="contact-form" onSubmit={submit}><div className="form-row"><label>{t.form.name}<input name="name" autoComplete="name" required /></label><label>{t.form.email}<input name="email" type="email" autoComplete="email" required /></label></div><div className="form-row"><label>{t.form.phone}<input name="phone" type="tel" autoComplete="tel" /></label><label>{t.form.company}<input name="company" autoComplete="organization" /></label></div><label>{t.form.message}<textarea name="message" rows={5} required /></label><button className="button button-dark" type="submit">{sent ? <>{t.form.sent}<Check size={16} /></> : <>{t.form.send}<ArrowRight size={16} /></>}</button>{sent && <p className="form-success" role="status">{t.contactNote}</p>}</form></section></>;
}

function FaqPreview({ locale, t }: { locale: Locale; t: Copy }) {
  return <section className="section faq-section"><div className="faq-heading"><p className="eyebrow">{t.faqTitle}</p><h2>{t.faqTitle}</h2><Link className="text-link" to={pathFor(locale, 'faq')}>{t.learn}<ArrowRight size={15} /></Link></div><div className="faq-list">{t.faq.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>;
}

function FaqPage({ locale, t }: { locale: Locale; t: Copy }) {
  return <><PageIntro eyebrow={t.faqTitle} title={t.faqPageTitle} text={t.faqTitle} /><section className="section faq-page-section"><div className="faq-list">{t.faq.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section><CallToAction locale={locale} t={t} /></>;
}

function LegalPage({ locale, pageKey, t }: { locale: Locale; pageKey: PageKey; t: Copy }) {
  const title = titleFor(pageKey, locale);
  const text = localeUi[locale].legalDisclaimer;
  return <><PageIntro eyebrow="TRUFFLE BALKANS" title={title} text={text} /><section className="section legal-section"><p>{text}</p><p>{t.contactNote}</p><Link className="text-link" to={pathFor(locale, 'contact')}>{t.nav.contact}<ArrowRight size={15} /></Link></section></>;
}

function CallToAction({ locale, t }: { locale: Locale; t: Copy }) {
  return <section className="final-cta"><div className="final-ornament">✳</div><p className="eyebrow">{t.origin}</p><h2>{t.finalTitle}</h2><p>{t.finalText}</p><Link className="button button-gold" to={pathFor(locale, 'wholesale')}>{t.cta}<ArrowUpRight size={16} /></Link></section>;
}