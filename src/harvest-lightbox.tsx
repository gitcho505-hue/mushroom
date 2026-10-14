import { useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import { galleryViewerCopy, harvestGalleryCopy, homeGalleryPhotos } from './harvest-photos';
import { localeUi, type Locale } from './i18n';

export function HarvestLightbox({ locale }: { locale: Locale }) {
  const gallery = harvestGalleryCopy[locale];
  const labels = galleryViewerCopy[locale];
  const ui = localeUi[locale];
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loadedSource, setLoadedSource] = useState('');
  const [failedSource, setFailedSource] = useState('');
  const viewerId = useId();
  const hintId = useId();
  const isOpen = activeIndex !== null;
  const activeSource = activeIndex === null ? '' : homeGalleryPhotos[activeIndex];

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
    if (activeIndex === null) return;
    for (const direction of [-1, 1]) {
      const preload = new Image();
      preload.src = homeGalleryPhotos[(activeIndex + direction + homeGalleryPhotos.length) % homeGalleryPhotos.length];
    }
  }, [activeIndex]);

  function move(direction: number) {
    swipeStart.current = null;
    setActiveIndex((current) => current === null ? null : (current + direction + homeGalleryPhotos.length) % homeGalleryPhotos.length);
  }

  return <>
    <p className="harvest-gallery-hint" id={hintId}>{labels.hint}</p>
    <div className="home-harvest-ribbon__grid">{homeGalleryPhotos.map((src, index) => <button
      type="button"
      className="home-harvest-ribbon__tile"
      key={src}
      aria-label={`${labels.open}: ${gallery.imageLabel} ${index + 1}`}
      aria-haspopup="dialog"
      aria-controls={viewerId}
      onClick={(event) => { opener.current = event.currentTarget; setFailedSource(''); setActiveIndex(index); }}
    ><img src={src} alt={`${gallery.imageLabel} ${index + 1}`} loading="lazy" width="828" height="1100" /><span className="harvest-photo-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span className="harvest-photo-zoom" aria-hidden="true"><Maximize2 size={18} /></span></button>)}</div>
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
      <header className="harvest-lightbox-header"><span>{gallery.title}</span><span className="harvest-lightbox-count" aria-live="polite">{String(activeIndex + 1).padStart(2, '0')} / {homeGalleryPhotos.length}</span><button ref={closeButton} type="button" className="harvest-lightbox-control" aria-label={labels.close} onClick={() => setActiveIndex(null)}><X size={24} /></button></header>
      <div className="harvest-lightbox-stage">
        <button type="button" className="harvest-lightbox-control harvest-lightbox-prev" aria-label={ui.previousPhoto} onClick={() => move(-1)}><ChevronLeft size={28} /></button>
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
          <img src={activeSource} alt={`${gallery.imageLabel} ${activeIndex + 1}`} draggable={false} onLoad={(event) => setLoadedSource(event.currentTarget.getAttribute('src') ?? '')} onError={(event) => setFailedSource(event.currentTarget.getAttribute('src') ?? '')} />
          {(loadedSource !== activeSource || failedSource === activeSource) && <span className="harvest-lightbox-status" role="status">{failedSource === activeSource ? labels.error : labels.loading}</span>}
        </div>
        <button type="button" className="harvest-lightbox-control harvest-lightbox-next" aria-label={ui.nextPhoto} onClick={() => move(1)}><ChevronRight size={28} /></button>
      </div>
      <p className="harvest-lightbox-hint">{labels.viewerHint}</p>
    </div>}</dialog>
  </>;
}
