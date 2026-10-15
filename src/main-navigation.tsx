import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { pathFor, type Copy, type Locale, type PageKey } from './content';
import { localeUi } from './i18n';

export function MainNavigation({ locale, t, pageKey, mobileOpen, onNavigate, children }: {
  locale: Locale; t: Copy; pageKey: PageKey; mobileOpen: boolean; onNavigate: () => void; children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const group = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const submenuId = useId();
  const knowledgeCurrent = pageKey === 'truffles' || pageKey === 'blog' || pageKey.startsWith('truffle:') || pageKey.startsWith('article:');

  useEffect(() => { setExpanded(false); }, [locale, pageKey, mobileOpen]);
  useEffect(() => {
    if (!expanded) return;
    const closeOutside = (event: PointerEvent) => {
      if (!group.current?.contains(event.target as Node)) setExpanded(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [expanded]);

  function navigate() { setExpanded(false); onNavigate(); }

  function topLink(key: 'home' | 'products' | 'wholesale' | 'about' | 'contact') {
    return <Link to={pathFor(locale, key)} onClick={navigate} aria-current={pageKey === key ? 'page' : undefined} data-current={key === 'products' && pageKey.startsWith('product:') || undefined}>{t.nav[key]}</Link>;
  }

  return <nav id="main-navigation" className={`main-nav${mobileOpen ? ' is-open' : ''}`} aria-label={localeUi[locale].navigation}>
    {topLink('home')}{topLink('products')}{topLink('wholesale')}
    <div className="nav-group" ref={group} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setExpanded(false); }} onKeyDown={(event) => {
      if (event.key === 'Escape' && expanded) { event.preventDefault(); event.stopPropagation(); setExpanded(false); trigger.current?.focus(); }
    }}>
      <button ref={trigger} type="button" className="nav-group__trigger" aria-expanded={expanded} aria-controls={submenuId} data-current={knowledgeCurrent || undefined} onClick={() => setExpanded((value) => !value)} onKeyDown={(event) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        setExpanded(true);
        const last = event.key === 'ArrowUp';
        requestAnimationFrame(() => {
          const links = group.current?.querySelectorAll<HTMLAnchorElement>('.nav-group__links a');
          (last ? links?.[links.length - 1] : links?.[0])?.focus();
        });
      }}>{t.nav.knowledge}<ChevronDown size={14} aria-hidden="true" /></button>
      <div className="nav-group__links" id={submenuId} hidden={!expanded} onKeyDown={(event) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const links = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>('a')];
        const current = links.indexOf(document.activeElement as HTMLAnchorElement);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        event.preventDefault(); links[next]?.focus();
      }}>
        <Link to={pathFor(locale, 'truffles')} onClick={navigate} aria-current={pageKey === 'truffles' ? 'page' : undefined}>{t.nav.information}</Link>
        <Link to={pathFor(locale, 'blog')} onClick={navigate} aria-current={pageKey === 'blog' ? 'page' : undefined}>{t.nav.blog}</Link>
      </div>
    </div>
    {topLink('about')}{topLink('contact')}
    {children}
  </nav>;
}
