import { Link } from 'react-router-dom';
import { ArrowRight, Box, FileText, Truck } from 'lucide-react';
import { pathFor, type Locale } from './content';
import { homeIntroCopy } from './home-intro-copy';
import { heroHarvestPhotos } from './harvest-photos';
import { WhatsAppIcon, whatsappLink } from './whatsapp';

export function HomeIntro({ locale }: { locale: Locale }) {
  const text = homeIntroCopy[locale];
  const whatsappUrl = whatsappLink(text.message);
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
