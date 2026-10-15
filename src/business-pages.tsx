import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, Copy as CopyIcon } from 'lucide-react';
import { pathFor, type Copy, type Locale } from './content';
import { businessCopy } from './business-copy';

type ProductOption = { id: string; title: string };
type PageProps = { locale: Locale; t: Copy };

const configuredEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim() ?? '';
const contactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail) && !configuredEmail.endsWith('@example.com') ? configuredEmail : '';
const contactPhone = import.meta.env.VITE_CONTACT_PHONE?.trim() ?? '';

function ContactMethods({ locale }: { locale: Locale }) {
  const labels = businessCopy[locale].contact;
  if (!contactEmail && !contactPhone) return null;
  return <dl className="business-contact-methods">
    {contactEmail && <div><dt>{labels.email}</dt><dd><a href={`mailto:${contactEmail}`}>{contactEmail}<ArrowUpRight size={18} /></a></dd></div>}
    {contactPhone && <div><dt>{labels.phone}</dt><dd><a href={`tel:${contactPhone.replace(/[^+\d]/g, '')}`}>{contactPhone}<ArrowUpRight size={18} /></a></dd></div>}
  </dl>;
}

function ProcessSteps({ title, steps }: { title: string; steps: [string, string][] }) {
  return <section className="business-process"><h2>{title}</h2><ol>{steps.map(([heading, text], index) => <li key={heading}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{heading}</h3><p>{text}</p></div></li>)}</ol></section>;
}

function EnquiryForm({ locale, t, wholesale = false, products = [], initialProduct = '' }: PageProps & { wholesale?: boolean; products?: ProductOption[]; initialProduct?: string }) {
  const labels = businessCopy[locale];
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<'idle' | 'opened' | 'draft' | 'copied' | 'copyFailed'>('idle');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const fields: [string, string][] = [ ['name', t.form.name], ['company', t.form.company], ['email', t.form.email], ['phone', t.form.phone], ['product', t.form.product], ['quantity', t.form.quantity], ['country', t.form.country], ['deliveryDate', t.form.delivery], ['message', t.form.message] ];
    const body = fields.flatMap(([key, label]) => {
      let value = String(values.get(key) ?? '').trim();
      if (key === 'product') value = products.find((product) => product.id === value)?.title ?? (value === 'help-me-choose' ? labels.wholesale.choose : value);
      return value ? [`${label}: ${value}`] : [];
    }).join('\n\n');
    setDraft(body);
    if (contactEmail) {
      const subject = wholesale ? `${labels.form.wholesaleSubject} — ${values.get('company')}` : labels.form.subject;
      window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus('opened');
    } else setStatus('draft');
  }
  async function copyDraft() {
    try { await navigator.clipboard.writeText(draft); setStatus('copied'); }
    catch { setStatus('copyFailed'); }
  }
  return <form className="business-form" onSubmit={submit}>
    <header><p className="eyebrow">TRUFFLE BALKANS</p><h2>{wholesale ? labels.wholesale.formTitle : labels.contact.formTitle}</h2><p>{wholesale ? labels.wholesale.formIntro : labels.contact.formIntro}</p></header>
    <fieldset><legend>{labels.wholesale.contactLegend}</legend>
      <div className="form-row"><label>{t.form.name}<input name="name" autoComplete="name" required maxLength={120} /></label><label>{t.form.email}<input name="email" type="email" autoComplete="email" required maxLength={254} /></label></div>
      <div className="form-row"><label>{t.form.company}{!wholesale && <small>{labels.form.optional}</small>}<input name="company" autoComplete="organization" required={wholesale} maxLength={160} /></label><label>{t.form.phone}<small>{labels.form.optional}</small><input name="phone" type="tel" autoComplete="tel" maxLength={40} /></label></div>
    </fieldset>
    {wholesale && <fieldset><legend>{labels.wholesale.orderLegend}</legend>
      <div className="form-row"><label>{t.form.product}<select name="product" defaultValue={initialProduct} required><option value="" disabled>{t.form.selectProduct}</option><option value="help-me-choose">{labels.wholesale.choose}</option>{products.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}</select></label><label>{t.form.quantity}<input name="quantity" placeholder={t.form.quantityHint} required maxLength={100} /></label></div>
      <div className="form-row"><label>{t.form.country}<small>{labels.form.optional}</small><input name="country" autoComplete="country-name" maxLength={100} /></label><label>{t.form.delivery}<small>{labels.form.optional}</small><input name="deliveryDate" type="date" /></label></div>
    </fieldset>}
    <label>{t.form.message}{wholesale && <small>{labels.form.optional}</small>}<textarea name="message" rows={wholesale ? 4 : 5} required={!wholesale} maxLength={4000} /></label>
    <p className="business-form-note">{contactEmail ? labels.form.emailNote : labels.form.draftNote}</p>
    <button className="button business-button" type="submit">{contactEmail ? labels.form.prepareEmail : labels.form.prepareDraft}<ArrowUpRight size={18} /></button>
    {draft && <div className="business-draft"><p role="status">{status === 'opened' ? labels.form.opened : status === 'copied' ? labels.form.copied : status === 'copyFailed' ? labels.form.copyFailed : labels.form.draftReady}</p><label>{wholesale ? labels.wholesale.formTitle : labels.contact.formTitle}<textarea readOnly value={draft} rows={6} onFocus={(event) => event.currentTarget.select()} /></label><button type="button" className="text-link" onClick={copyDraft}>{status === 'copied' ? <Check size={16} /> : <CopyIcon size={16} />}{labels.form.copy}</button></div>}
  </form>;
}

export function ContactPage({ locale, t }: PageProps) {
  const labels = businessCopy[locale].contact;
  return <div className="business-page business-contact">
    <header className="business-heading"><p className="eyebrow">{t.nav.contact}</p><h1>{labels.title}</h1><p>{labels.intro}</p></header>
    <div className="business-contact-layout"><aside className="business-contact-aside"><ContactMethods locale={locale} /><figure className="business-photo contact-photo"><img src="/snimki/IMG_7311.jpeg" alt={businessCopy[locale].about.caption} width="828" height="1100" loading="eager" /></figure><div className="business-restaurant-link"><h2>{labels.restaurantTitle}</h2><p>{labels.restaurantText}</p><Link className="text-link" to={pathFor(locale, 'wholesale')}>{t.nav.wholesale}<ArrowRight size={18} /></Link></div></aside><EnquiryForm locale={locale} t={t} /></div>
  </div>;
}

export function AboutPage({ locale, t }: PageProps) {
  const labels = businessCopy[locale].about;
  return <div className="business-page business-about">
    <section className="business-intro-grid"><header className="business-heading"><p className="eyebrow">{t.nav.about} · TRUFFLE BALKANS</p><h1>{labels.title}</h1><p>{labels.intro}</p><Link className="text-link" to={pathFor(locale, 'products')}>{t.viewAll}<ArrowRight size={18} /></Link></header><figure className="business-photo about-portrait"><img src="/snimki/IMG_7280.jpeg" alt={labels.caption} width="828" height="1100" loading="eager" /><figcaption>{labels.caption}</figcaption></figure></section>
    <section className="business-about-story"><div><p className="eyebrow">{t.origin}</p><h2>{labels.heading}</h2></div><div>{labels.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>
    <ProcessSteps title={labels.process} steps={labels.steps} />
    <section className="business-next"><h2>{labels.next}</h2><div><Link className="button business-button" to={pathFor(locale, 'products')}>{t.nav.products}<ArrowRight size={18} /></Link><Link className="text-link" to={pathFor(locale, 'contact')}>{t.nav.contact}<ArrowUpRight size={18} /></Link></div></section>
  </div>;
}

export function RestaurantPage({ locale, t, products, initialProduct }: PageProps & { products: ProductOption[]; initialProduct: string }) {
  const labels = businessCopy[locale].wholesale;
  return <div className="business-page business-wholesale">
    <section className="business-intro-grid"><header className="business-heading"><p className="eyebrow">{t.nav.wholesale}</p><h1>{labels.title}</h1><p>{labels.intro}</p><a className="button business-button" href="#restaurant-enquiry">{labels.formTitle}<ArrowRight size={18} /></a></header><figure className="business-photo restaurant-photo"><img src="/snimki/IMG_7296.jpeg" alt={labels.caption} width="828" height="1244" loading="eager" /><figcaption>{labels.caption}</figcaption></figure></section>
    <section className="business-order-layout" id="restaurant-enquiry"><aside><p className="eyebrow">{t.availability}</p><h2>{labels.orderLegend}</h2><p>{t.contactNote}</p><Link className="text-link" to={pathFor(locale, 'products')}>{t.viewAll}<ArrowRight size={18} /></Link><ContactMethods locale={locale} /></aside><EnquiryForm locale={locale} t={t} wholesale products={products} initialProduct={initialProduct} /></section>
    <ProcessSteps title={labels.process} steps={labels.steps} />
  </div>;
}
