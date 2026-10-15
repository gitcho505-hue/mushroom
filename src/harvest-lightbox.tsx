import { useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { galleryViewerCopy, harvestGalleryCopy, homeGalleryPhotos } from './harvest-photos';
import { localeUi, type Locale } from './i18n';

export type LightboxPhoto = { src: string; alt: string; title: string; width: number; height: number };

export function HarvestLightbox({ locale, photos: sourcePhotos = homeGalleryPhotos, items, visibleRange, title, imageLabel, variant = 'harvest' }: { locale: Locale; photos?: readonly string[]; items?: readonly LightboxPhoto[]; visibleRange?: { start: number; end: number }; title?: string; imageLabel?: string; variant?: 'harvest' | 'product' }) {
  const photos = items?.map((photo) => photo.src) ?? sourcePhotos;
  const gallery = { ...harvestGalleryCopy[locale], ...(title ? { title } : {}), ...(imageLabel ? { imageLabel } : {}) };
  const labels = galleryViewerCopy[locale];
  const ui = localeUi[locale];
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loadedSource, setLoadedSource] = useState('');
  const [failedSource, setFailedSource] = useState('');
  const [previewIndex, setPreviewIndex] = useState(0);
  const preview = Math.min(previewIndex, photos.length - 1);
  const viewerId = useId();
  const hintId = useId();
  const isOpen = activeIndex !== null;
  const activeSource = activeIndex === null ? '' : photos[activeIndex];
  const description = (index: number) => items?.[index]?.alt || `${gallery.imageLabel} ${index + 1}`;
  const caption = (index: number) => items?.[index]?.title || description(index);

  useEffect(() => {
    if (!isOpen || !dialog.current) return;
    const viewer = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    viewer.showModal();
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      viewer.close();
      document.body.style.overflow = previousOverflow;
      opener.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (activeIndex === null || activeIndex >= photos.length) return;
    for (const direction of [-1, 1]) {
      const preload = new Image();
      preload.src = photos[(activeIndex + direction + photos.length) % photos.length];
    }
    setPreviewIndex(activeIndex);
  }, [activeIndex, photos]);

  useEffect(() => { if (activeIndex !== null && activeIndex >= photos.length) setActiveIndex(null); }, [activeIndex, photos.length]);

  function move(direction: number) {
    swipeStart.current = null;
    setActiveIndex((current) => current === null ? null : (current + direction + photos.length) % photos.length);
  }

  function openPhoto(index: number, button: HTMLButtonElement) {
    opener.current = button;
    setFailedSource('');
    setActiveIndex(index);
  }

  if (!photos.length) return null;
  const visiblePhotos = photos.map((src, index) => ({ src, index })).slice(visibleRange?.start ?? 0, visibleRange?.end ?? photos.length);
  return <>
    {variant === 'product' && <button type="button" className="product-gallery-main" aria-label={labels.open + ': ' + gallery.imageLabel} aria-haspopup="dialog" aria-controls={viewerId} onClick={(event) => openPhoto(preview, event.currentTarget)}><img src={photos[preview]} alt={gallery.imageLabel} loading="eager" width="828" height="1100" /><span className="harvest-photo-zoom" aria-hidden="true"><Maximize2 size={20} /></span></button>}
    <p className="harvest-gallery-hint" id={hintId}>{photos.length > 1 ? labels.hint : labels.open}</p>
    {(variant !== 'product' || photos.length > 1) && <div className={variant === 'product' ? 'product-gallery-thumbs' : 'home-harvest-ribbon__grid'}>{visiblePhotos.map(({ src, index }) => <button
      type="button"
      className={variant === 'product' ? 'product-gallery-thumb' : 'home-harvest-ribbon__tile'}
      key={src}
      aria-label={`${labels.open}: ${description(index)}`}
      aria-haspopup="dialog"
      aria-controls={viewerId}
      onClick={(event) => openPhoto(index, event.currentTarget)}
    ><img src={src} alt={description(index)} title={caption(index)} loading="lazy" width={items?.[index]?.width ?? 828} height={items?.[index]?.height ?? 1100} /><span className="harvest-photo-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span className="harvest-photo-zoom" aria-hidden="true"><Maximize2 size={18} /></span></button>)}</div>}
    <dialog
      ref={dialog}
      className="harvest-lightbox"
      id={viewerId}
      aria-label={gallery.title}
      aria-describedby={hintId}
      onCancel={(event) => { event.preventDefault(); setActiveIndex(null); }}
      onClose={() => { if (!dialog.current?.open) setActiveIndex(null); }}
      onClick={(event) => { if (event.target === event.currentTarget) setActiveIndex(null); }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
        if (event.key === 'Tab') {
          const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])')];
          const first = buttons[0];
          const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}
    >{activeIndex !== null && <div className="harvest-lightbox-panel">
      <header className="harvest-lightbox-header"><span>{gallery.title}</span><span className="harvest-lightbox-count" aria-live="polite">{String(activeIndex + 1).padStart(2, '0')} / {photos.length}</span><button ref={closeButton} type="button" className="harvest-lightbox-control" aria-label={labels.close} onClick={() => setActiveIndex(null)}><X size={24} /></button></header>
      <div className={`harvest-lightbox-stage ${photos.length === 1 ? 'is-single' : ''}`}>
        {photos.length > 1 && <button type="button" className="harvest-lightbox-control harvest-lightbox-prev" aria-label={ui.previousPhoto} onClick={() => move(-1)}><ChevronLeft size={28} /></button>}
        <div className="harvest-lightbox-image"
          onPointerDown={(event) => { if (event.pointerType === 'touch' && event.isPrimary) swipeStart.current = { x: event.clientX, y: event.clientY }; }}
          onPointerUp={(event) => {
            const start = swipeStart.current;
            swipeStart.current = null;
            if (!start) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.3) move(dx < 0 ? 1 : -1);
          }}
          onPointerCancel={() => { swipeStart.current = null; }}
        >
          <img src={activeSource} alt={description(activeIndex)} title={caption(activeIndex)} draggable={false} onLoad={(event) => { setLoadedSource(event.currentTarget.getAttribute('src') ?? ''); setFailedSource(''); }} onError={(event) => setFailedSource(event.currentTarget.getAttribute('src') ?? '')} />
          {(loadedSource !== activeSource || failedSource === activeSource) && <span className="harvest-lightbox-status" role="status">{failedSource === activeSource ? labels.error : labels.loading}</span>}
        </div>
        {photos.length > 1 && <button type="button" className="harvest-lightbox-control harvest-lightbox-next" aria-label={ui.nextPhoto} onClick={() => move(1)}><ChevronRight size={28} /></button>}
      </div>
      <p className="harvest-lightbox-hint">{photos.length > 1 ? labels.viewerHint : `${labels.close} / Esc`}</p>
    </div>}</dialog>
  </>;
}
