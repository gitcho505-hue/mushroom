import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { pathFor, type Locale } from './content';
import { useGallery } from './gallery-data';
import { galleryCopy } from './gallery-copy';
import { homepagePhotos, photoAlt, photoTitle, type GalleryPhoto } from './gallery-model';
import { HarvestLightbox } from './harvest-lightbox';

export const galleryPageSize = 60;
export function galleryLightboxItems(rows: readonly GalleryPhoto[], locale: Locale) {
  return rows.map((row) => ({ src: row.image_url, alt: photoAlt(row, locale), title: photoTitle(row, locale), width: row.width, height: row.height }));
}

export function GalleryPreview({ locale }: { locale: Locale }) {
  const { photos } = useGallery();
  return <HarvestLightbox locale={locale} items={galleryLightboxItems(homepagePhotos(photos), locale)} />;
}

export function GalleryPage({ locale }: { locale: Locale }) {
  const { photos, error } = useGallery();
  const text = galleryCopy[locale];
  const [params] = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(photos.length / galleryPageSize));
  const page = Math.min(Math.max(1, Math.floor(Number(params.get('page'))) || 1), totalPages);
  const link = (value: number) => `${pathFor(locale, 'gallery')}${value > 1 ? `?page=${value}` : ''}`;
  return <>
    <header className="page-intro"><p className="eyebrow">{text.nav}</p><h1>{text.title}</h1><p>{text.intro}</p></header>
    <section className="section gallery-page">
      {error && <p role="status">{text.error}</p>}
      {!photos.length ? <p>{text.empty}</p> : <>
        <HarvestLightbox key={page} locale={locale} items={galleryLightboxItems(photos, locale)} visibleRange={{ start: (page - 1) * galleryPageSize, end: page * galleryPageSize }} />
        {totalPages > 1 && <nav className="gallery-pagination" aria-label={text.nav}>
          {page > 1 && <Link className="text-link" to={link(page - 1)} rel="prev"><ArrowLeft size={18} />{page - 1}</Link>}
          <span>{page} / {totalPages}</span>
          {page < totalPages && <Link className="text-link" to={link(page + 1)} rel="next">{page + 1}<ArrowRight size={18} /></Link>}
        </nav>}
      </>}
    </section>
  </>;
}
