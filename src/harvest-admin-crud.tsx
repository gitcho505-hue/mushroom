import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, Check, ImagePlus, LogOut, Save, ShieldCheck, X } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { imageUrl, languageMeta, locales, truffleIds, type Locale } from './content';
import { createCatalogSeeds, getSupabaseClient, safeCatalogImage, type CatalogProduct } from './catalog';
import './admin.css';
import './admin-crud.css';

type AdminAccess = 'loading' | 'allowed' | 'denied';
type LocalizedField = 'title_by_locale' | 'description_by_locale' | 'body_by_locale' | 'season_by_locale' | 'note_by_locale';

export function HarvestAdminPage() {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [adminAccess, setAdminAccess] = useState<AdminAccess>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [selectedId, setSelectedId] = useState('black-truffle');
  const [editLocale, setEditLocale] = useState<Locale>('bg');
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      setAdminAccess('denied');
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError('');
      setMessage('');
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !session) {
      setAdminAccess(supabase ? 'loading' : 'denied');
      return;
    }
    let active = true;
    setAdminAccess('loading');
    void supabase.from('admin_users').select('user_id').eq('user_id', session.user.id).maybeSingle()
      .then(({ data, error: accessError }) => {
        if (!active) return;
        if (accessError) {
          setError(accessError.message);
          setAdminAccess('denied');
          return;
        }
        setAdminAccess(data ? 'allowed' : 'denied');
      });
    return () => { active = false; };
  }, [session, supabase]);

  useEffect(() => {
    if (!supabase || adminAccess !== 'allowed') return;
    let active = true;
    async function loadProducts() {
      setLoadingCatalog(true);
      setError('');
      const { data, error: queryError } = await supabase!.from('truffle_products').select('*').order('id');
      if (!active) return;
      if (queryError) {
        setError(queryError.message);
        setLoadingCatalog(false);
        return;
      }
      let rows = (data ?? []) as CatalogProduct[];
      const present = new Set(rows.map((row) => row.id));
      const missing = createCatalogSeeds().filter((row) => !present.has(row.id));
      if (missing.length) {
        const { data: seeded, error: seedError } = await supabase!.from('truffle_products').upsert(missing).select('*');
        if (!active) return;
        if (seedError) setError(`Липсващи разновидности не се добавиха: ${seedError.message}`);
        rows = [...rows, ...((seeded ?? []) as CatalogProduct[])];
      }
      rows = rows.filter((row) => truffleIds.includes(row.id as (typeof truffleIds)[number]));
      rows.sort((first, second) => first.id.localeCompare(second.id));
      setCatalog(rows);
      if (!rows.some((row) => row.id === selectedId)) setSelectedId('black-truffle');
      setLoadingCatalog(false);
    }
    void loadProducts();
    return () => { active = false; };
  }, [adminAccess, supabase]);

  const selected = catalog.find((product) => product.id === selectedId);

  function updateField<K extends keyof CatalogProduct>(field: K, value: CatalogProduct[K]) {
    setCatalog((rows) => rows.map((row) => row.id === selectedId ? { ...row, [field]: value } : row));
    setMessage('');
  }

  function updateLocalized(field: LocalizedField, value: string) {
    if (!selected) return;
    updateField(field, { ...selected[field], [editLocale]: value });
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) setError('Неуспешен вход. Провери имейла и паролата.');
    setSaving(false);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCatalog([]);
    setPassword('');
    setAdminAccess('denied');
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selected) return;
    setSaving(true);
    setError('');
    setMessage('');
    const payload = { ...selected, updated_at: new Date().toISOString() };
    const { data, error: saveError } = await supabase.from('truffle_products').upsert(payload).select('*').single();
    if (saveError) setError(saveError.message);
    else {
      setCatalog((rows) => rows.map((row) => row.id === selected.id ? data as CatalogProduct : row));
      setMessage('Продуктът е запазен.');
    }
    setSaving(false);
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selected || !supabase) return;
    if (!selected.updated_at) {
      setError('Първо запази продукта, след което качи снимката.');
      return;
    }
    if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) {
      setError('Избери снимка до 8 MB.');
      return;
    }
    setSaving(true);
    setError('');
    const extension = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const path = `${selected.id}/${Date.now()}.${extension}`;
    const bucket = supabase.storage.from('truffle-photos');
    const { data: uploaded, error: uploadError } = await bucket.upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (uploadError) {
      setError(uploadError.message);
      setSaving(false);
      return;
    }
    const imageUrl = bucket.getPublicUrl(uploaded.path).data.publicUrl;
    const oldPath = selected.image_path;
    const { data, error: updateError } = await supabase.from('truffle_products')
      .update({ image_path: uploaded.path, image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq('id', selected.id).select('*').single();
    if (updateError) {
      await bucket.remove([uploaded.path]);
      setError(updateError.message);
    } else {
      setCatalog((rows) => rows.map((row) => row.id === selected.id ? data as CatalogProduct : row));
      if (oldPath) {
        const { error: cleanupError } = await bucket.remove([oldPath]);
        setMessage(cleanupError ? 'Снимката е сменена; старата снимка остана в Storage.' : 'Снимката е сменена и старата е изтрита.');
      } else setMessage('Снимката е качена.');
    }
    setSaving(false);
  }

  async function removePhoto() {
    if (!supabase || !selected || !window.confirm('Да изтрия ли основната снимка на този продукт?')) return;
    setSaving(true);
    setError('');
    const oldPath = selected.image_path;
    const fallbackImage = imageUrl('summer-truffle', 1280);
    const { data, error: updateError } = await supabase.from('truffle_products')
      .update({ image_path: null, image_url: fallbackImage, updated_at: new Date().toISOString() })
      .eq('id', selected.id).select('*').single();
    if (updateError) setError(updateError.message);
    else {
      setCatalog((rows) => rows.map((row) => row.id === selected.id ? data as CatalogProduct : row));
      if (oldPath) {
        const { error: removeError } = await supabase.storage.from('truffle-photos').remove([oldPath]);
        setMessage(removeError ? 'Снимката е премахната от продукта, но файлът остана в Storage.' : 'Снимката е премахната.');
      } else setMessage('Снимката е премахната от продукта.');
    }
    setSaving(false);
  }

  if (!authReady || (session && adminAccess === 'loading')) return <main className="admin-state"><span className="admin-spinner" /><p>Проверяваме достъпа…</p></main>;
  if (!supabase) return <AdminSetup />;
  if (!session) return <main className="admin-login-page"><section className="admin-login"><Link className="admin-mark" to="/bg/"><img src="/images/brand-logo.png" alt="" /><span><strong>TRUFFLE BALKANS</strong><small>ADMIN WORKSPACE</small></span></Link><p className="admin-eyebrow">SECURE SIGN IN</p><h1>Вход в администрацията</h1><p className="admin-intro">Гъби, снимки, описания, наличности и цени.</p><form onSubmit={signIn}><label>Имейл<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Парола<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="admin-error" role="alert">{error}</p>}<button className="admin-primary" type="submit" disabled={saving}>{saving ? 'Влизане…' : 'Влез в администрацията'}</button></form><Link className="admin-back" to="/bg/">← Към сайта</Link></section><div className="admin-login-aside"><img src={imageUrl('black-truffle', 1400)} alt="Трюфел" /></div></main>;
  if (adminAccess === 'denied') return <main className="admin-state"><ShieldCheck size={34} /><h1>Нямаш администраторски достъп</h1><p>{error || 'Профилът няма достъп до продуктовия каталог.'}</p><button className="admin-secondary" onClick={signOut}>Излез от профила</button></main>;
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-mark" to="/bg/"><img src="/images/brand-logo.png" alt="" /><span><strong>TRUFFLE BALKANS</strong><small>ADMIN WORKSPACE</small></span></Link>
        <div className="admin-sidebar-label">4 ВИДА · НАЛИЧНОСТ</div>
        <div className="admin-product-list">
          {catalog.map((item) => <button type="button" key={item.id} className={`admin-product-nav ${item.id === selectedId ? 'is-active' : ''}`} onClick={() => { setSelectedId(item.id); setMessage(''); setError(''); }}>
            <span className="admin-product-thumb"><img src={safeCatalogImage(item.image_url, item.id, 320)} alt="" /></span>
            <span><strong>{item.title_by_locale.bg || item.title_by_locale.en || item.id}</strong><small>{item.available ? `${item.stock_grams ?? 0} g налични` : 'Скрит продукт'}</small></span>
            <span className={`availability-dot ${item.available ? 'is-available' : ''}`} />
          </button>)}
        </div>
        <div className="admin-sidebar-bottom"><Link to="/bg/" className="admin-back"><ArrowLeft size={15} />Към сайта</Link><button className="admin-signout" onClick={signOut}><LogOut size={15} />Изход</button></div>
      </aside>
      <section className="admin-workspace">
        <header className="admin-topbar"><div><p className="admin-eyebrow">УПРАВЛЕНИЕ НА РЕКОЛТАТА</p><h1>Гъби и цени</h1></div><span className="admin-user">{session.user.email}</span></header>
        {loadingCatalog ? <div className="admin-state"><span className="admin-spinner" /><p>Зареждаме продуктите…</p></div> : selected ? (
          <form className="admin-editor" onSubmit={saveProduct}>
            <div className="admin-editor-heading">
              <div><span className="admin-status-line"><i className={selected.available ? 'is-available' : ''} />{selected.available ? 'Публикуван продукт' : 'Скрит от сайта'}</span><h2>{selected.title_by_locale[editLocale] || selected.title_by_locale.bg || 'Нов продукт'}</h2><p>Редактирай описанието, снимката, количеството и цената на килограм.</p></div>
              <div className="admin-editor-actions"><button className="admin-primary admin-save" type="submit" disabled={saving}>{saving ? <span className="admin-spinner" /> : <Save size={16} />}{saving ? 'Запазване…' : 'Запази'}</button></div>
            </div>
            <div className="admin-editor-grid">
              <div className="admin-editor-main">
                <section className="admin-card admin-photo-card">
                  <div className="admin-card-heading"><div><span className="admin-eyebrow">СНИМКА</span><h3>Основна снимка</h3></div><div className="admin-photo-actions">
                    <label className="admin-upload-button"><ImagePlus size={15} />{selected.image_path ? 'Смени снимка' : 'Качи снимка'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={uploadPhoto} disabled={saving || !selected.updated_at} /></label>
                    {selected.image_path && <button className="admin-icon-button" type="button" title="Изтрий снимката" aria-label="Изтрий снимката" onClick={removePhoto} disabled={saving}><X size={16} /></button>}
                  </div></div>
                  <img className="admin-product-photo" src={safeCatalogImage(selected.image_url, selected.id, 1280)} alt={selected.title_by_locale[editLocale]} />
                  <p className="admin-help">JPG, PNG, WebP или AVIF · до 8 MB</p>
                </section>
                <section className="admin-card">
                  <div className="admin-card-heading"><div><span className="admin-eyebrow">ОПИСАНИЕ</span><h3>Информация за гъбата</h3></div><label className="admin-locale-select"><span>Език</span><select value={editLocale} onChange={(event) => setEditLocale(event.target.value as Locale)}>{locales.map((locale) => <option key={locale} value={locale}>{languageMeta[locale].flag} {languageMeta[locale].label}</option>)}</select></label></div>
                  <label>Име на гъбата<input value={selected.title_by_locale[editLocale] ?? ''} onChange={(event) => updateLocalized('title_by_locale', event.target.value)} required /></label>
                  <label>Кратко описание<textarea rows={3} value={selected.description_by_locale[editLocale] ?? ''} onChange={(event) => updateLocalized('description_by_locale', event.target.value)} /></label>
                  <label>Подробно описание<textarea rows={6} value={selected.body_by_locale[editLocale] ?? ''} onChange={(event) => updateLocalized('body_by_locale', event.target.value)} /></label>
                  <div className="admin-form-row"><label>Сезон<input value={selected.season_by_locale[editLocale] ?? ''} onChange={(event) => updateLocalized('season_by_locale', event.target.value)} /></label><label>Сорт / качество<input value={selected.note_by_locale[editLocale] ?? ''} onChange={(event) => updateLocalized('note_by_locale', event.target.value)} /></label></div>
                </section>
              </div>
              <aside className="admin-editor-aside">
                <section className="admin-card">
                  <span className="admin-eyebrow">КОЛИЧЕСТВА И ЦЕНИ</span>
                  <label>Тегло на опаковка<div className="admin-input-suffix"><input type="number" min="1" step="1" value={selected.weight_grams ?? ''} onChange={(event) => updateField('weight_grams', event.target.value ? Number(event.target.value) : null)} placeholder="напр. 50" /><span>g</span></div></label>
                  <label>Налична реколта<div className="admin-input-suffix"><input type="number" min="0" step="1" value={selected.stock_grams ?? ''} onChange={(event) => updateField('stock_grams', event.target.value ? Number(event.target.value) : 0)} placeholder="0" /><span>g</span></div></label>
                  <label>Цена за килограм<div className="admin-input-suffix"><input type="number" min="0" step="0.01" value={selected.price_per_kg ?? ''} onChange={(event) => updateField('price_per_kg', event.target.value ? Number(event.target.value) : null)} placeholder="напр. 1200" /><select value={selected.currency} onChange={(event) => updateField('currency', event.target.value)}><option>BGN</option><option>EUR</option><option>USD</option></select></div></label>
                  <label>Цена за опаковка (по избор)<div className="admin-input-suffix"><input type="number" min="0" step="0.01" value={selected.price ?? ''} onChange={(event) => updateField('price', event.target.value ? Number(event.target.value) : null)} placeholder="По договаряне" /><select value={selected.currency} onChange={(event) => updateField('currency', event.target.value)}><option>BGN</option><option>EUR</option><option>USD</option></select></div></label>
                  <label className="admin-toggle"><span><strong>Публикуван в сайта</strong><small>{selected.available ? 'Вижда се в каталога' : 'Скрит от каталога'}</small></span><input type="checkbox" checked={selected.available} onChange={(event) => updateField('available', event.target.checked)} /></label>
                  <label>Произход<input value={selected.origin} onChange={(event) => updateField('origin', event.target.value)} /></label>
                </section>
                <section className="admin-card admin-preview-card"><span className="admin-eyebrow">ИДЕНТИФИКАТОР</span><code>{selected.id}</code></section>
              </aside>
            </div>
            {error && <p className="admin-error" role="alert">{error}</p>}
            {message && <p className="admin-success" role="status"><Check size={15} />{message}</p>}
            <p className="admin-save-note">Последна редакция: {selected.updated_at ? new Date(selected.updated_at).toLocaleString('bg-BG') : 'нов продукт'}</p>
          </form>
        ) : <div className="admin-state"><span className="admin-spinner" /><p>Няма продукти. Добави първата гъба.</p></div>}
      </section>
    </main>
  );
}

function AdminSetup() {
  return <main className="admin-state"><ShieldCheck size={34} /><p className="admin-eyebrow">ADMIN SETUP REQUIRED</p><h1>Настрой Supabase достъп</h1><p>Добави `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` към `.env.local` и Vercel Environment Variables.</p><p>Изпълни `supabase/schema.sql`, създай потребител в Supabase Auth и добави UUID-то му в `public.admin_users`.</p><a className="admin-primary" href="https://github.com/gitcho505-hue/mushroom/blob/main/docs/ADMIN_SETUP.md" target="_blank" rel="noreferrer">Отвори setup инструкциите <ArrowUpRight size={15} /></a><Link className="admin-back" to="/bg/">Към сайта</Link></main>;
}