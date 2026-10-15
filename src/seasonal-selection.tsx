import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { pathFor, type Copy, type Locale } from './content';
import type { ProductDetailData } from './product-detail';

export const selectionCopy = {
  bg: { eyebrow: 'Нашите продукти', title: 'Сезонна селекция трюфели', intro: 'Автентични вкусове от балканските гори, подбрани за професионалната кухня.', offer: 'Сезонно предложение', details: 'Повече информация', less: 'По-малко информация', enquiry: 'Запитване за цена', product: 'Страница на продукта', packWeight: 'Тегло на опаковка', stock: 'Налично количество', kiloPrice: 'Цена за килограм', packPrice: 'Цена за опаковка', onRequest: 'Цена по запитване', origin: 'Балкани' },
  en: { eyebrow: 'Our products', title: 'A seasonal selection of truffles', intro: 'Authentic flavours from the Balkan forests, selected for professional kitchens.', offer: 'Seasonal selection', details: 'More information', less: 'Less information', enquiry: 'Enquire about price', product: 'View product page', packWeight: 'Pack weight', stock: 'Available quantity', kiloPrice: 'Price per kilogram', packPrice: 'Price per pack', onRequest: 'Price on enquiry', origin: 'Balkans' },
  it: { eyebrow: 'I nostri prodotti', title: 'Selezione stagionale di tartufi', intro: 'Sapori autentici dei boschi balcanici, selezionati per la cucina professionale.', offer: 'Proposta stagionale', details: 'Più informazioni', less: 'Meno informazioni', enquiry: 'Richiedi il prezzo', product: 'Pagina del prodotto', packWeight: 'Peso della confezione', stock: 'Quantità disponibile', kiloPrice: 'Prezzo al chilogrammo', packPrice: 'Prezzo per confezione', onRequest: 'Prezzo su richiesta', origin: 'Balcani' },
  fr: { eyebrow: 'Nos produits', title: 'Une sélection de truffes de saison', intro: 'Des saveurs authentiques des forêts balkaniques, sélectionnées pour la cuisine professionnelle.', offer: 'Sélection de saison', details: 'Plus d’informations', less: 'Moins d’informations', enquiry: 'Demander un prix', product: 'Fiche du produit', packWeight: 'Poids du conditionnement', stock: 'Quantité disponible', kiloPrice: 'Prix au kilogramme', packPrice: 'Prix par conditionnement', onRequest: 'Prix sur demande', origin: 'Balkans' },
  de: { eyebrow: 'Unsere Produkte', title: 'Unsere saisonale Trüffelauswahl', intro: 'Authentische Aromen aus den Wäldern des Balkans, ausgewählt für die professionelle Küche.', offer: 'Saisonales Angebot', details: 'Mehr Informationen', less: 'Weniger Informationen', enquiry: 'Preis anfragen', product: 'Zur Produktseite', packWeight: 'Packungsgewicht', stock: 'Verfügbare Menge', kiloPrice: 'Preis pro Kilogramm', packPrice: 'Preis pro Packung', onRequest: 'Preis auf Anfrage', origin: 'Balkan' },
} satisfies Record<Locale, Record<string, string>>;

const species: Record<string, string> = {
  'black-truffle': 'Tuber melanosporum',
  'burgundy-truffle': 'Tuber uncinatum',
  'summer-truffle': 'Tuber aestivum',
  'white-truffle': 'Tuber magnatum',
};

export function SeasonalProductCard({ locale, t, id, product, href, image }: {
  locale: Locale; t: Copy; id: string; product: ProductDetailData; href: string; image: string;
}) {
  const labels = selectionCopy[locale];
  const price = (amount: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: product.currency ?? 'EUR' }).format(amount);
  const weight = (amount: number) => `${new Intl.NumberFormat(locale).format(amount)} g`;
  const origin = product.origin === 'Balkans' ? labels.origin : product.origin;
  const facts = [
    [t.season, product.season],
    [t.originLabel, origin],
    [t.grade, product.note],
    [labels.packWeight, product.weight_grams != null ? weight(product.weight_grams) : null],
    [labels.stock, product.stock_grams != null ? weight(product.stock_grams) : null],
    [labels.kiloPrice, product.price_per_kg != null ? price(product.price_per_kg) : null],
    [labels.packPrice, product.price != null ? price(product.price) : null],
  ].filter(([, value]) => value);

  return <article className="selection-card" data-product-id={id}>
    <Link className="selection-card__photo" to={href} aria-label={product.title}>
      <img src={image} alt={product.title} loading="lazy" width="820" height="1025" />
      <span aria-hidden="true"><ArrowRight size={20} /></span>
    </Link>
    <div className="selection-card__content">
      <h3><Link to={href}>{product.title}</Link></h3>
      {species[id] && <p className="selection-card__species" lang="la">{species[id]}</p>}
      <p className="selection-card__offer">{labels.offer}</p>
      <details className="selection-card__details">
        <summary>
          <span className="selection-card__show">{labels.details}</span>
          <span className="selection-card__hide">{labels.less}</span>
          <span className="sr-only"> — {product.title}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </summary>
        <div className="selection-card__expanded">
          {product.description && <p>{product.description}</p>}
          {product.body && product.body !== product.description && <p>{product.body}</p>}
          {facts.length > 0 && <dl>{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
          {product.price == null && product.price_per_kg == null && <p className="selection-card__price-note">{labels.onRequest}</p>}
          <Link className="selection-card__page" to={href}>{labels.product}<ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      </details>
      <Link className="selection-card__enquiry" to={pathFor(locale, 'wholesale')} state={{ productId: id }}>{labels.enquiry}<ArrowRight size={18} aria-hidden="true" /></Link>
    </div>
  </article>;
}
