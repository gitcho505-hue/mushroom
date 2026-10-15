import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type RelatedItem = { href: string; title: string; image: string; caption?: string };

export function RelatedSection({ title, items }: { title: string; items: RelatedItem[] }) {
  if (!items.length) return null;
  return <section className="section related-section related-section-compact" aria-labelledby="related-title">
    <h2 id="related-title">{title}</h2>
    <div className={`related-links${items.length === 2 ? ' related-links--pair' : ''}`}>
      {items.map((item) => <Link className="related-link" to={item.href} key={item.href}>
        <img src={item.image} alt="" loading="lazy" width="120" height="150" />
        <div className="related-link__copy"><h3>{item.title}</h3>{item.caption && <p>{item.caption}</p>}</div>
        <span className="related-link__arrow" aria-hidden="true"><ArrowUpRight size={18} /></span>
      </Link>)}
    </div>
  </section>;
}
