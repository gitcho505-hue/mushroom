import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { ArrowLeft, ArrowUpRight, Check, ImagePlus, LogOut, Save, ShieldCheck, Upload } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { imageUrl, languageMeta, locales, truffleIds, truffles, type Locale } from './content';
import { createCatalogSeeds, getSupabaseClient, type CatalogProduct, type TruffleId } from './catalog';
import './admin.css';

type AdminAccess = 'loading' | 'allowed' | 'denied';
type LocalizedField = 'title_by_locale' | 'description_by_locale' | 'body_by_locale' | 'season_by_locale' | 'note_by_locale';

export function AdminPage() {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [adminAccess, setAdminAccess] = useState<AdminAccess>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [selectedId, setSelectedId] = useState<TruffleId>('black-truffle');
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
    async function loadCatalog() {
      setLoadingCatalog(true);
      setError('');
      const { data, error: readError } = await supabase!.from('truffle_products').select('*').order('id');
      if (!active) return;
      if (readError) {
        setError(readError.message);
        setLoadingCatalog(false);
        return;
      }
      let rows = (data ?? []) as CatalogProduct[];
      const present = new Set(rows.map((row) => row.id));
      const missing = createCatalogSeeds().filter((row) => !present.has(row.id));
      if (missing.length) {
        const { data: inserted, error: seedError } = await supabase!.from('truffle_products').upsert(missing).select('*');
        if (!active) return;
        if (seedError) setError(`Каталогът се зареди, но началните продукти не се добавиха: ${seedError.message}`);
        rows = [...rows, ...((inserted ?? []) as CatalogProduct[])];
      }
      setCatalog(rows.sort((a, b) => a.id.localeCompare(b.id)));
      setLoadingCatalog(false);
    }
    void loadCatalog();
    return () => { active = false; };
  }, [adminAccess, supabase]);

  const selected = catalog.find((product) => product.id === selectedId);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) setError('Неуспешен вход. Провери имейла, паролата и Supabase настройките.');
    setSaving(false);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCatalog([]);
    setPassword('');
    setAdminAccess('denied');
  }

  function updateField<K extends keyof CatalogProduct>(field: K, value: CatalogProduct[K]) {
    setCatalog((rows) => rows.map((row) => row.id === selectedId ? { ...row, [field]: value } : row));
    setMessage('');
  }

  function updateLocalized(field: LocalizedField, value: string) {
    if (!selected) return;
    updateField(field, { ...selected[field], [editLocale]: value });
  }

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !selected || !supabase) return;
    if (!file.type.startsWith('image/')) {
      setError('Избери файл с изображение.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Снимката трябва да е до 8 MB.');
      return;
    }
    setSaving(true);
    setError('');
    const extension = file.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const path = `${selected.id}/${Date.now()}.${extension}`;
    const { data, error: uploadError } = await supabase.storage.from('truffle-photos').upload(path, file, { cacheControl: '3600', upsert: true, contentType: file.type });
    if (uploadError) {
      setError(uploadError.message);
      setSaving(false);
      return;
    }
    const { data: publicFile } = supabase.storage.from('truffle-photos').getPublicUrl(data.path);
    setCatalog((rows) => rows.map((row) => row.id === selected.id ? { ...row, image_path: data.path, image_url: publicFile.publicUrl } : row));
    setMessage('Снимката е качена. Запази продукта, за да публикуваш промените.');
    setSaving(false);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selected) return;
    setSaving(true);
    setError('');
    setMessage('');
    const { data, error: saveError } = await supabase.from('truffle_products').upsert({ ...selected, updated_at: new Date().toISOString() }).select('*').single();
    if (saveError) setError(saveError.message);
    else {
      setCatalog((rows) => rows.map((row) => row.id === selected.id ? data as CatalogProduct : row));
      setMessage('Промените са запазени. Публичният каталог ще ги покаже при следващо зареждане.');
    }
    setSaving(false);
  }

  if (!authReady || (session && adminAccess === 'loading')) return <main className="admin-state"><span className="admin-spinner" /><p>Проверяваме достъпа…</p></main>;

  if (!supabase) return <AdminSetup />;

  if (!session) return <main className="admin-login-page"><section className="admin-login"><Link className="admin-mark" to="/bg/"><img src="/images/brand-logo.png" alt="" /><span><strong>TRUFFLE BALKANS</strong><small>ADMIN WORKSPACE</small></span></Link><p className="admin-eyebrow">SECURE SIGN IN</p><h1>Вход в администрацията</h1><p className="admin-intro">Управление на трюфели, снимки и наличности.</p><form onSubmit={signIn}><label>Имейл<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Парола<div className="admin-password"><input type={passwordVisible ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setPasswordVisible(!passwordVisible)}>{passwordVisible ? 'Скрий' : 'Покажи'}</button></div></label>{error && <p className="admin-error" role="alert">{error}</p>}<button className="admin-primary" type="submit" disabled={saving}>{saving ? 'Влизане…' : 'Влез в администрацията'}</button></form><Link className="admin-back" to="/bg/">← Обратно към сайта</Link></section><div className="admin-login-aside"><img src={imageUrl('black-truffle', 1400)} alt="Черен трюфел" /><p>Балкански трюфели.<br />Подбрани за професионални кухни.</p></div></main>;

  if (adminAccess === 'denied') return <main className="admin-state"><ShieldCheck size={34} /><h1>Нямаш администраторски достъп</h1><p>{error || 'Профилът няма активен достъп до продуктовия каталог.'}</p><button className="admin-secondary" onClick={signOut}>Излез от профила</button></main>;

  return <main className="admin-shell"><aside className="admin-sidebar"><Link className="admin-mark" to="/bg/"><img src="/images/brand-logo.png" alt="" /><span><strong>TRUFFLE BALKANS</strong><small>ADMIN WORKSPACE</small></span></Link><div className="admin-sidebar-label">КАТАЛОГ</div><div className="admin-product-list">{truffleIds.map((id) => { const item = catalog.find((product) => product.id === id); return <button key={id} className={`admin-product-nav ${id === selectedId ? 'is-active' : ''}`} onClick={() => { setSelectedId(id); setMessage(''); setError(''); }}><span className="admin-product-thumb">{item?.image_url ? <img src={item.image_url} alt="" /> : <span />}</span><span><strong>{item?.title_by_locale.bg ?? truffles.bg[id].title}</strong><small>{item?.available ? 'В наличност' : 'Изчерпан'}</small></span><span className={`availability-dot ${item?.available ? 'is-available' : ''}`} /></button>; })}</div><div className="admin-sidebar-bottom"><Link to="/bg/" className="admin-back"><ArrowLeft size={15} /> Към сайта</Link><button className="admin-signout" onClick={signOut}><LogOut size={15} /> Изход</button></div></aside><section className="admin-workspace"><header className="admin-topbar"><div><p className="admin-eyebrow">TRUFFLE BALKANS / СТОКИ</p><h1>Продуктов каталог</h1></div><span className="admin-user">{session.user.email}</span></header>{loadingCatalog ? <div className="admin-state"><span className="admin-spinner" /><p>Зареждаме продуктите…</p></div> : selected ? <form className="admin-editor" onSubmit={saveProduct}><div className="admin-editor-heading"><div><span className="admin-status-line"><i className={selected.available ? 'is-available' : ''} />{selected.available ? 'Активен продукт' : 'Временно неналичен'}</span><h2>{selected.title_by_locale.bg}</h2><p>Редактирай информацията за продукта и го публикувай в каталога.</p></div><button className="admin-primary admin-save" type="submit" disabled={saving}>{saving ? <span className="admin-spinner" /> : <Save size={16} />}{saving ? 'Запазване…' : 'Запази промените'}</button></div><div className="admin-editor-grid"><div className="admin-editor-main"><section className="admin-card admin-photo-card"><div className="admin-card-heading"><div><span className="admin-eyebrow">ОСНОВНА СНИМКА</span><h3>Изображение на продукта</h3></div><label className="admin-upload-button"><ImagePlus size={16} />{saving ? 'Качване…' : 'Качи снимка'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={uploadPhoto} disabled={saving} /></label></div>{selected.image_url ? <img className="admin-product-photo" src={selected.image_url} alt={selected.title_by_locale[editLocale]} /> : <div className="admin-photo-empty"><Upload /><span>Добави снимка на продукта</span></div>}<p className="admin-help">JPG, PNG, WebP или AVIF · до 8 MB</p></section><section className="admin-card"><div className="admin-card-heading"><div><span className="admin-eyebrow">СЪДЪРЖАНИЕ</span><h3>Име и описание</h3></div><label className="admin-locale-select"><span>Език</span><select value={editLocale} onChange={(event) => setEditLocale(event.target.value as Locale)}>{locales.map((locale) => <option key={locale} value={locale}>{languageMeta[locale].flag} {languageMeta[locale].label}</option>)}</select></label></div><label>Име на продукта<input value={selected.title_by_locale[editLocale] ?? ''} onChange={(event) => updateLocalized('title_by_locale', event.target.value)} required /></label><label>Кратко описание<textarea rows={3} value={selected.description_by_locale[editLocale] ?? ''} onChange={(event) => updateLocalized('description_by_locale', event.target.value)} required /></label><label>Подробно описание<textarea rows={6} value={selected.body_by_locale[editLocale] ?? ''} onChange={(event) => updateLocalized('body_by_locale', event.target.value)} required /></label><div className="admin-form-row"><label>Сезон<input value={selected.season_by_locale[editLocale] ?? ''} onChange={(event) => updateLocalized('season_by_locale', event.target.value)} /></label><label>Градация / аромат<input value={selected.note_by_locale[editLocale] ?? ''} onChange={(event) => updateLocalized('note_by_locale', event.target.value)} /></label></div></section></div><aside className="admin-editor-aside"><section className="admin-card"><span className="admin-eyebrow">ТЪРГОВСКИ ДАННИ</span><h3>Цена и наличност</h3><label>Грамаж за една опаковка<div className="admin-input-suffix"><input type="number" min="1" step="1" value={selected.weight_grams ?? ''} onChange={(event) => updateField('weight_grams', event.target.value ? Number(event.target.value) : null)} placeholder="напр. 50" /><span>g</span></div></label><label>Цена за опаковка<div className="admin-input-suffix"><input type="number" min="0" step="0.01" value={selected.price ?? ''} onChange={(event) => updateField('price', event.target.value ? Number(event.target.value) : null)} placeholder="Без цена" /><select value={selected.currency} onChange={(event) => updateField('currency', event.target.value)}><option>EUR</option><option>BGN</option><option>USD</option></select></div></label><label>Налично количество<div className="admin-input-suffix"><input type="number" min="0" step="1" value={selected.stock_grams ?? ''} onChange={(event) => updateField('stock_grams', event.target.value ? Number(event.target.value) : null)} placeholder="Не е зададено" /><span>g</span></div></label><label className="admin-toggle-row"><span><strong>Показвай като наличен</strong><small>Управлява публичния статус на продукта</small></span><input type="checkbox" checked={selected.available} onChange={(event) => updateField('available', event.target.checked)} /></label><label>Произход<input value={selected.origin} onChange={(event) => updateField('origin', event.target.value)} /></label></section><section className="admin-card admin-preview-card"><span className="admin-eyebrow">ПЪТ НА ПРОДУКТА</span><p>Обществените адреси и SEO slug-овете остават стабилни при редакция.</p><code>/{locales.map((locale) => locale).join(' / ')}/…</code></section></aside></div>{error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-success" role="status"><Check size={15} />{message}</p>}<p className="admin-save-note">С последна редакция: {selected.updated_at ? new Date(selected.updated_at).toLocaleString('bg-BG') : 'начален каталог'}</p></form> : <div className="admin-state"><p>Няма продукти в каталога.</p></div>}</section></main>;
}

function AdminSetup() {
  return <main className="admin-state"><ShieldCheck size={34} /><p className="admin-eyebrow">ADMIN SETUP REQUIRED</p><h1>Настрой Supabase достъп</h1><p>Добави `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` към `.env.local` и Vercel Environment Variables.</p><p>Изпълни `supabase/schema.sql`, създай потребител в Supabase Auth и добави UUID-то му в `public.admin_users`.</p><a className="admin-primary" href="https://github.com/gitcho505-hue/mushroom/blob/main/docs/ADMIN_SETUP.md" target="_blank" rel="noreferrer">Отвори setup инструкциите <ArrowUpRight size={15} /></a><Link className="admin-back" to="/bg/">Към сайта</Link></main>;
}