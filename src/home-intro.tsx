import { Link } from 'react-router-dom';
import { ArrowRight, Box, FileText, Truck } from 'lucide-react';
import { pathFor, type Locale } from './content';
import { homeIntroCopy } from './home-intro-copy';
import { heroHarvestPhotos } from './harvest-photos';

function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.7 7.5L3 20.5l1.4-4.7a8.5 8.5 0 1 1 16.1-4.2Z" /><path d="M8.2 7.5c-.6.2-1 .8-1 1.4 0 2.8 3.6 6.4 6.4 6.4.7 0 1.4-.5 1.6-1.2l.2-.7-2.2-1.1-.8.9c-1.4-.7-2.5-1.8-3.1-3.1l.8-.8-1.1-2Z" /></svg>;
}

export function HomeIntro({ locale }: { locale: Locale }) {
  const text = homeIntroCopy[locale];
  const whatsappUrl = `https://wa.me/359896343109?text=${encodeURIComponent(text.message)}`;
  return <section className="home-intro" aria-labelledby="home-intro-title">
    <div className="home-intro-inner">
      <div className="home-intro-copy">
        <p className="eyebrow"><span aria-hidden="true" />{text.eyebrow}</p>
        <h1 id="home-intro-title">{text.title}</h1>
        <p className="home-intro-description">{text.text}</p>
        <div className="home-intro-actions">
          <Link className="button home-intro-primary" to={pathFor(locale, 'wholesale')}>{text.prices}<ArrowRight size={19} aria-hidden="true" /></Link>
          <a className="button home-intro-whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><WhatsAppIcon />{text.whatsapp}</a>
        </div>
        <ul className="home-intro-benefits" aria-label={text.eyebrow}>
          <li><Box size={22} aria-hidden="true" /><span>{text.availability}</span></li>
          <li><FileText size={22} aria-hidden="true" /><span>{text.invoice}</span></li>
          <li><Truck size={24} aria-hidden="true" /><span>{text.delivery}</span></li>
        </ul>
        <Link className="text-link home-intro-discover" to={pathFor(locale, 'products')}>{text.discover}<ArrowRight size={17} aria-hidden="true" /></Link>
      </div>
      <figure className="home-intro-photo"><img src={heroHarvestPhotos[0].src} alt={text.imageAlt} width="1024" height="1536" loading="eager" /></figure>
    </div>
  </section>;
}
