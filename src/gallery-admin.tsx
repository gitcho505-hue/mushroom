import { useEffect, useRef, useState, type DragEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Pencil, Save, Star, Trash2, X } from 'lucide-react';
import { languageMeta, locales, type Locale } from './i18n';
import { loadGallery } from './gallery-data';
import { photoAlt, type GalleryPhoto } from './gallery-model';
import { compressGalleryImage, galleryFilename, gallerySlug } from './gallery-upload';

type Staged = { id: string; file: File; preview: string; alt: string; slug: string; error: string };
const emptyTranslations = () => Object.fromEntries(locales.map((locale) => [locale, ''])) as Record<Locale, string>;

export function GalleryAdmin({ client }: { client: SupabaseClient }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [staged, setStaged] = useState<Staged[]>([]);
  const [uploadAlt, setUploadAlt] = useState(emptyTranslations);
  const [uploadTitle, setUploadTitle] = useState(emptyTranslations);
  const [uploadLocale, setUploadLocale] = useState<Locale>('bg');
  const [publishUploads, setPublishUploads] = useState(true);
  const [editing, setEditing] = useState<GalleryPhoto | null>(null);
  const [editLocale, setEditLocale] = useState<Locale>('bg');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [dropActive, setDropActive] = useState(false);
  const cancelled = useRef(false);
  const previewUrls = useRef(new Set<string>());
  const editor = useRef<HTMLDialogElement>(null);
  const featured = photos.filter((photo) => photo.home_position !== null);
  const visiblePhotos = photos.slice((page - 1) * 60, page * 60);
  const pageCount = Math.max(1, Math.ceil(photos.length / 60));

  async function refresh() {
    const rows = await loadGallery(client, true);
    setPhotos(rows); setPage((current) => Math.min(current, Math.max(1, Math.ceil(rows.length / 60))));
    setSelected((current) => new Set([...current].filter((id) => rows.some((row) => row.id === id))));
    return rows;
  }
  useEffect(() => {
    let active = true;
    void loadGallery(client, true).then((rows) => { if (active) setPhotos(rows); }).catch(() => { if (active) setError('Галерията не се зареди. Опитайте отново.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [client]);
  useEffect(() => () => { cancelled.current = true; for (const url of previewUrls.current) URL.revokeObjectURL(url); }, []);
  useEffect(() => {
    if (!editing || !editor.current) return;
    const dialog = editor.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = previous; };
  }, [editing?.id]);

  function stageFiles(files: FileList | File[]) {
    const next: Staged[] = [];
    for (const file of Array.from(files)) {
      if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) { setError('Поддържат се JPG, PNG, WebP и AVIF.'); continue; }
      const preview = URL.createObjectURL(file); previewUrls.current.add(preview);
      next.push({ id: crypto.randomUUID(), file, preview, alt: '', slug: '', error: '' });
    }
    setStaged((current) => [...current, ...next]);
  }
  function removeStaged(id: string) {
    setStaged((current) => current.filter((item) => { if (item.id !== id) return true; URL.revokeObjectURL(item.preview); previewUrls.current.delete(item.preview); return false; }));
  }
  async function upload() {
    if (!uploadAlt.bg.trim() && staged.some((item) => !item.alt.trim())) { setError('Попълнете общ alt текст на български или описание за всяка снимка.'); return; }
    setBusy(true); setError(''); setMessage(''); cancelled.current = false;
    let complete = 0;
    for (const [index, item] of staged.entries()) {
      if (cancelled.current) break;
      setMessage(`Обработка и качване ${index + 1} / ${staged.length}…`);
      let uploadedPath: string | null = null;
      try {
        const result = await compressGalleryImage(item.file);
        const alt = item.alt.trim() || uploadAlt.bg.trim();
        const slug = gallerySlug(item.slug || alt);
        const id = crypto.randomUUID();
        const path = galleryFilename(slug, id);
        const { error: uploadError } = await client.storage.from('gallery-photos').upload(path, result.blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
        if (uploadError) throw uploadError;
        uploadedPath = path;
        const localizedAlt = { ...uploadAlt, bg: alt };
        const { error: insertError } = await client.from('gallery_photos').insert({ id, slug: path.slice(0, -5), image_path: path, image_url: client.storage.from('gallery-photos').getPublicUrl(path).data.publicUrl, width: result.width, height: result.height, bytes: result.blob.size, alt_by_locale: localizedAlt, title_by_locale: Object.fromEntries(locales.map((locale) => [locale, uploadTitle[locale].trim() || localizedAlt[locale]])), published: publishUploads });
        if (insertError) throw insertError;
        complete++; removeStaged(item.id);
      } catch (problem) {
        if (uploadedPath) await client.storage.from('gallery-photos').remove([uploadedPath]);
        const description = problem instanceof Error ? problem.message : 'Качването не успя. Опитайте отново.';
        setStaged((current) => current.map((photo) => photo.id === item.id ? { ...photo, error: description } : photo));
      }
    }
    try { await refresh(); } catch { setError('Снимките са обработени, но списъкът не се обнови. Презаредете галерията.'); }
    setMessage(`Качени снимки: ${complete}. ${cancelled.current ? 'Останалите снимки са оставени за следващо качване.' : ''}`);
    setBusy(false);
  }

  async function save() {
    if (!editing) return;
    if (!editing.alt_by_locale.bg?.trim()) { setError('Alt текстът на български е задължителен.'); return; }
    setBusy(true); setError(''); setMessage('');
    const original = photos.find((photo) => photo.id === editing.id)!;
    let movedPath: string | null = null;
    try {
      const slug = gallerySlug(editing.slug);
      let path = original.image_path;
      if (slug !== original.slug) {
        path = `${slug}.${original.image_path.endsWith('.avif') ? 'avif' : 'webp'}`;
        const { error: moveError } = await client.storage.from('gallery-photos').move(original.image_path, path);
        if (moveError) throw moveError;
        movedPath = path;
      }
      const { error: saveError } = await client.from('gallery_photos').update({ slug, image_path: path, image_url: client.storage.from('gallery-photos').getPublicUrl(path).data.publicUrl, alt_by_locale: editing.alt_by_locale, title_by_locale: editing.title_by_locale, published: editing.published, home_position: editing.published ? original.home_position : null }).eq('id', editing.id);
      if (saveError) throw saveError;
      setEditing(null); await refresh(); setMessage('Снимката и SEO описанията са запазени.');
    } catch {
      if (movedPath) await client.storage.from('gallery-photos').move(movedPath, original.image_path);
      setError('Промените не са запазени. Проверете името на файла и опитайте отново.');
    } finally { setBusy(false); }
  }

  async function toggleFeatured(photo: GalleryPhoto) {
    if (!photo.published) { setError('Първо публикувайте снимката, за да я изберете за началната страница.'); return; }
    const ids = photo.home_position === null ? photos.filter((item) => item.home_position !== null || item.id === photo.id).map((item) => item.id) : featured.filter((item) => item.id !== photo.id).map((item) => item.id);
    if (ids.length > 10) { setError('Избрани са 10 снимки. Премахнете една от избора, за да добавите друга.'); return; }
    setBusy(true); setError('');
    try { const { error: updateError } = await client.rpc('set_gallery_homepage', { photo_ids: ids }); if (updateError) throw updateError; await refresh(); }
    catch { setError('Изборът за началната страница не е запазен.'); }
    finally { setBusy(false); }
  }

  async function reorder(fromId: string, targetId: string) {
    setDraggedId(null);
    const from = photos.findIndex((photo) => photo.id === fromId), target = photos.findIndex((photo) => photo.id === targetId);
    if (from < 0 || target < 0 || from === target || busy) return;
    const next = [...photos]; const [moved] = next.splice(from, 1); next.splice(target, 0, moved);
    setBusy(true); setError(''); setPhotos(next);
    try { const { error: updateError } = await client.rpc('reorder_gallery', { photo_ids: next.map((photo) => photo.id) }); if (updateError) throw updateError; await refresh(); }
    catch { setPhotos(photos); setError('Подредбата не е запазена. Обновете списъка и опитайте отново.'); }
    finally { setBusy(false); }
  }

  async function remove(ids: string[]) {
    if (!ids.length || !window.confirm(`Да изтрием ли окончателно ${ids.length} снимки?`)) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const targets = photos.filter((photo) => ids.includes(photo.id));
      for (let offset = 0; offset < targets.length; offset += 50) {
        const batch = targets.slice(offset, offset + 50), batchIds = batch.map((photo) => photo.id);
        const { error: hideError } = await client.from('gallery_photos').update({ published: false, home_position: null }).in('id', batchIds);
        if (hideError) throw hideError;
        const { error: storageError } = await client.storage.from('gallery-photos').remove(batch.map((photo) => photo.image_path));
        if (storageError) throw storageError;
        const { error: deleteError } = await client.from('gallery_photos').delete().in('id', batchIds);
        if (deleteError) throw deleteError;
      }
      setSelected(new Set()); setMessage('Избраните снимки са изтрити от галерията и хранилището.');
    } catch { setError('Част от снимките не се изтриха. Те са скрити от сайта. Обновете списъка и повторете изтриването.'); }
    finally { try { await refresh(); } catch { /* Keep the deletion error visible. */ } setBusy(false); }
  }

  function dropFiles(event: DragEvent) { event.preventDefault(); setDropActive(false); if (!busy && event.dataTransfer.files.length) stageFiles(event.dataTransfer.files); }
  const languageSelect = (value: Locale, onChange: (locale: Locale) => void) => <label>Език<select value={value} onChange={(event) => onChange(event.target.value as Locale)} disabled={busy}>{locales.map((locale) => <option key={locale} value={locale}>{languageMeta[locale].label}</option>)}</select></label>;

  return <section className="gallery-admin" aria-labelledby="gallery-admin-title">
    <header className="admin-editor-heading"><div><p className="admin-eyebrow">ГАЛЕРИЯ</p><h2 id="gallery-admin-title">Снимки и SEO описания</h2><p>{photos.length} снимки · {featured.length} / 10 приоритетни за началната страница</p></div><button className="admin-secondary" type="button" disabled={busy} onClick={() => { setLoading(true); void refresh().catch(() => setError('Списъкът не се обнови.')).finally(() => setLoading(false)); }}>Обнови</button></header>
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-success" role="status">{message}</p>}
    <section className="admin-card gallery-upload-card"><h3>Добавяне на снимки</h3><div className={`gallery-dropzone ${dropActive ? 'is-active' : ''}`} onDragOver={(event) => { event.preventDefault(); if (!busy) setDropActive(true); }} onDragLeave={() => setDropActive(false)} onDrop={dropFiles}><ImagePlus size={30} /><p>Пуснете снимки тук или изберете няколко файла наведнъж.</p><label className="admin-upload-button">Избери снимки<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={busy} onChange={(event) => { if (event.target.files) stageFiles(event.target.files); event.target.value = ''; }} /></label><small>JPG, PNG, WebP, AVIF · до 40 MB за оригинал · автоматичен WebP до 2000 px</small></div>
      {!!staged.length && <><div className="gallery-upload-metadata">{languageSelect(uploadLocale, setUploadLocale)}<label>Общ alt текст {uploadLocale === 'bg' && '(задължителен, ако няма индивидуално описание)'}<input value={uploadAlt[uploadLocale]} disabled={busy} onChange={(event) => setUploadAlt({ ...uploadAlt, [uploadLocale]: event.target.value })} maxLength={500} /></label><label>Общо title заглавие<input value={uploadTitle[uploadLocale]} disabled={busy} onChange={(event) => setUploadTitle({ ...uploadTitle, [uploadLocale]: event.target.value })} maxLength={500} /></label><p>Описанията важат за избраните файлове. Можете да дадете индивидуален alt текст на всяка снимка и да редактирате преводите след качването. При празен title се използва alt текстът.</p><label className="gallery-checkbox"><input type="checkbox" checked={publishUploads} disabled={busy} onChange={(event) => setPublishUploads(event.target.checked)} />Публикувай след качването</label></div>
        <div className="gallery-staged-grid">{staged.map((item) => <article key={item.id}><img src={item.preview} alt="" /><strong>{item.file.name}</strong><label>Индивидуален alt текст (BG)<input value={item.alt} disabled={busy} maxLength={500} onChange={(event) => setStaged((current) => current.map((photo) => photo.id === item.id ? { ...photo, alt: event.target.value } : photo))} /></label><label>Име на файла (автоматично от alt текста)<input value={item.slug} disabled={busy} placeholder={gallerySlug(item.alt || uploadAlt.bg)} onChange={(event) => setStaged((current) => current.map((photo) => photo.id === item.id ? { ...photo, slug: event.target.value } : photo))} /></label>{item.error && <p className="admin-error">{item.error}</p>}<button className="admin-secondary" type="button" onClick={() => removeStaged(item.id)} disabled={busy}><X size={16} />Премахни от опашката</button></article>)}</div>
        <div className="gallery-toolbar"><button className="admin-primary" type="button" disabled={busy} onClick={() => void upload()}>Качи {staged.length} снимки</button>{busy && <button className="admin-secondary" type="button" onClick={() => { cancelled.current = true; }}>Спри след текущата снимка</button>}</div>
      </>}
    </section>
    <section className="admin-card"><div className="gallery-toolbar"><label className="gallery-checkbox"><input type="checkbox" disabled={busy || !photos.length} checked={!!photos.length && selected.size === photos.length} onChange={(event) => setSelected(event.target.checked ? new Set(photos.map((photo) => photo.id)) : new Set())} />Избери всички ({photos.length})</label><button className="admin-danger" type="button" disabled={busy || !selected.size} onClick={() => void remove([...selected])}><Trash2 size={16} />Изтрий избраните ({selected.size})</button></div><p className="admin-help">Подреждайте с дръжката или стрелките. Звездата избира до 10 приоритетни снимки за началната страница; свободните места се допълват с последно добавените.</p>
      {loading ? <p role="status">Зареждане…</p> : !photos.length ? <p>Все още няма снимки в галерията.</p> : <div className="gallery-admin-grid">{visiblePhotos.map((photo) => { const index = photos.findIndex((item) => item.id === photo.id); return <article className={draggedId === photo.id ? 'is-dragged' : ''} key={photo.id} onDragOver={(event) => { if (draggedId) event.preventDefault(); }} onDrop={(event) => { if (draggedId) { event.preventDefault(); void reorder(draggedId, photo.id); } }}>
        <div className="gallery-admin-image"><img src={photo.image_url} alt={photoAlt(photo, 'bg')} loading="lazy" /><label className="gallery-select"><input type="checkbox" aria-label={`Избери ${photoAlt(photo, 'bg')}`} disabled={busy} checked={selected.has(photo.id)} onChange={(event) => setSelected((current) => { const next = new Set(current); if (event.target.checked) next.add(photo.id); else next.delete(photo.id); return next; })} /></label><span className="gallery-state">{photo.published ? 'Публикувана' : 'Чернова'}</span></div><p>{photoAlt(photo, 'bg')}</p><small>{photo.width} × {photo.height} · {Math.ceil(photo.bytes / 1024)} KB · WebP/AVIF</small>
        <div className="gallery-card-actions"><button className="admin-icon-button" type="button" draggable={!busy} disabled={busy} aria-label="Премести чрез влачене" onDragStart={() => setDraggedId(photo.id)} onDragEnd={() => setDraggedId(null)}><GripVertical size={17} /></button><button className="admin-icon-button" type="button" disabled={busy || index === 0} aria-label="Премести нагоре" onClick={() => void reorder(photo.id, photos[index - 1].id)}><ArrowUp size={17} /></button><button className="admin-icon-button" type="button" disabled={busy || index === photos.length - 1} aria-label="Премести надолу" onClick={() => void reorder(photo.id, photos[index + 1].id)}><ArrowDown size={17} /></button><button className="admin-icon-button gallery-feature" type="button" disabled={busy} aria-label="На началната страница" aria-pressed={photo.home_position !== null} onClick={() => void toggleFeatured(photo)}><Star size={17} fill={photo.home_position !== null ? 'currentColor' : 'none'} /></button><button className="admin-icon-button" type="button" disabled={busy} aria-label="Редактирай SEO описанията" onClick={() => { setEditing({ ...photo, alt_by_locale: { ...photo.alt_by_locale }, title_by_locale: { ...photo.title_by_locale } }); setEditLocale('bg'); setError(''); }}><Pencil size={17} /></button><button className="admin-icon-button" type="button" disabled={busy} aria-label="Изтрий снимката" onClick={() => void remove([photo.id])}><Trash2 size={17} /></button></div>
      </article>; })}</div>}
      {pageCount > 1 && <nav className="gallery-toolbar" aria-label="Страници на галерията"><button className="admin-secondary" type="button" disabled={busy || page === 1} onClick={() => setPage(page - 1)}>Предишна</button><span>{page} / {pageCount}</span><button className="admin-secondary" type="button" disabled={busy || page === pageCount} onClick={() => setPage(page + 1)}>Следваща</button></nav>}
    </section>
    {editing && <dialog ref={editor} className="gallery-edit-backdrop" aria-labelledby="gallery-edit-title" onCancel={(event) => { event.preventDefault(); if (!busy) setEditing(null); }}><section className="admin-card gallery-edit-panel" aria-labelledby="gallery-edit-title"><h3 id="gallery-edit-title">SEO описания на снимката</h3><img className="gallery-edit-preview" src={editing.image_url} alt={photoAlt(editing, editLocale)} />{languageSelect(editLocale, setEditLocale)}<label>Alt текст {editLocale === 'bg' && '(задължителен)'}<textarea rows={2} maxLength={500} value={editing.alt_by_locale[editLocale] || ''} disabled={busy} onChange={(event) => setEditing({ ...editing, alt_by_locale: { ...editing.alt_by_locale, [editLocale]: event.target.value } })} /></label><label>Title заглавие<input maxLength={500} value={editing.title_by_locale[editLocale] || ''} disabled={busy} onChange={(event) => setEditing({ ...editing, title_by_locale: { ...editing.title_by_locale, [editLocale]: event.target.value } })} /></label><label>Slug / име на файла<input value={editing.slug} disabled={busy} onChange={(event) => setEditing({ ...editing, slug: event.target.value })} /></label><label className="gallery-checkbox"><input type="checkbox" checked={editing.published} disabled={busy} onChange={(event) => setEditing({ ...editing, published: event.target.checked })} />Публикувана снимка</label><p className="admin-help">При липсващ превод се използва българският alt текст. Промяната на slug преименува и файла в хранилището.</p>{error && <p className="admin-error" role="alert">{error}</p>}<div className="gallery-toolbar"><button className="admin-primary" type="button" disabled={busy} onClick={() => void save()}><Save size={16} />Запази</button><button className="admin-secondary" type="button" disabled={busy} onClick={() => setEditing(null)}>Затвори</button></div></section></dialog>}
  </section>;
}
