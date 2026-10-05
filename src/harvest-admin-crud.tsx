import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, Check, ImagePlus, LogOut, Pencil, Plus, Save, ShieldCheck, Trash2, X } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';
import { imageUrl, languageMeta, locales, type Locale } from './content';
import { pageSlugs } from './i18n';
import { createEmptyCatalogProduct, getSupabaseClient, loadCatalogProducts, loadHarvestRecords, safeCatalogImage, slugifyProduct, type CatalogProduct, type HarvestRecord } from './catalog';
import './admin.css';
import './admin-crud.css';

type AdminAccess = 'loading' | 'allowed' | 'denied';
type LocalizedField = 'title_by_locale' | 'description_by_locale' | 'body_by_locale' | 'season_by_locale' | 'note_by_locale';
type AdminUsername = 'ESI_ADMIN' | 'KOSIO_ADMIN';

const adminAuthAliases: Record<AdminUsername, string> = {
  ESI_ADMIN: 'gitcho505@gmail.com',
  KOSIO_ADMIN: 'gitcho505@gmail.com',
};

function adminUsernameForEmail(email: string | undefined) {
  return Object.values(adminAuthAliases).includes(email?.toLowerCase() ?? '') ? 'ESI_ADMIN' : null;
}

export function HarvestAdminPage() {
  const supabase = getSupabaseClient();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [adminAccess, setAdminAccess] = useState<AdminAccess>('loading');
  const [username, setUsername] = useState('');
  const [signedInUsername, setSignedInUsername] = useState<AdminUsername | null>(null);
  const [password, setPassword] = useState('');
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [harvestDate, setHarvestDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [harvestWeight, setHarvestWeight] = useState('');
  const [harvestQuantity, setHarvestQuantity] = useState('1');
  const [harvestNotes, setHarvestNotes] = useState('');
  const [harvestPhoto, setHarvestPhoto] = useState<File | null>(null);
  const [editingHarvestId, setEditingHarvestId] = useState<string | null>(null);
  const [harvestFormOpen, setHarvestFormOpen] = useState(false);
  const [loadingHarvests, setLoadingHarvests] = useState(false);
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
    if (!adminUsernameForEmail(session.user.email)) {
      setError('Този профил не е ESI_ADMIN или KOSIO_ADMIN.');
      setAdminAccess('denied');
      return () => { active = false; };
    }
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
      const { data, error: queryError } = await loadCatalogProducts(supabase!);
      if (!active) return;
      if (queryError) {
        setError(queryError.message);
        setLoadingCatalog(false);
        return;
      }
      const rows = data;
      rows.sort((first, second) => first.id.localeCompare(second.id));
      setCatalog(rows);
      if (!rows.some((row) => row.id === selectedId)) setSelectedId(rows[0]?.id ?? '');
      setLoadingCatalog(false);
    }
    void loadProducts();
    return () => { active = false; };
  }, [adminAccess, supabase]);

  useEffect(() => {
    if (!supabase || adminAccess !== 'allowed') return;
    let active = true;
    setLoadingHarvests(true);
    void loadHarvestRecords(supabase)
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(`Неуспешно зареждане на находките: ${queryError.message}`);
        else setHarvests(data);
        setLoadingHarvests(false);
      });
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

  function resetHarvestForm() {
    setEditingHarvestId(null);
    setHarvestDate(new Date().toLocaleDateString('en-CA'));
    setHarvestWeight('');
    setHarvestQuantity('1');
    setHarvestNotes('');
    setHarvestPhoto(null);
  }

  function editHarvest(record: HarvestRecord) {
    setEditingHarvestId(record.id);
    setHarvestDate(record.found_on);
    setHarvestWeight(String(record.weight_grams));
    setHarvestQuantity(String(record.quantity));
    setHarvestNotes(record.notes);
    setHarvestPhoto(null);
    setHarvestFormOpen(true);
  }

  async function addProduct() {
    if (!supabase) return;
    setSaving(true);
    setError('');
    const id = `product-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const { data, error: insertError } = await supabase.from('truffle_products').insert(createEmptyCatalogProduct(id)).select('*').single();
    if (insertError) setError(insertError.message);
    else {
      const product = data as CatalogProduct;
      setCatalog((rows) => [...rows, product].sort((first, second) => first.id.localeCompare(second.id)));
      setSelectedId(product.id);
      setMessage('Главният продукт е добавен. Попълни информацията и запази.');
    }
    setSaving(false);
  }

  async function deleteProduct() {
    if (!supabase || !selected) return;
    const childRecords = harvests.filter((record) => record.product_id === selected.id);
    if (!window.confirm(`Да изтрия ли „${selected.title_by_locale.bg || selected.id}“ и всичките му ${childRecords.length} подпродукта?`)) return;
    setSaving(true);
    setError('');
    const { error: deleteError } = await supabase.from('truffle_products').delete().eq('id', selected.id);
    if (deleteError) setError(deleteError.message);
    else {
      const imagePaths = [selected.image_path, ...childRecords.map((record) => record.image_path)].filter((path): path is string => Boolean(path));
      const nextProducts = catalog.filter((product) => product.id !== selected.id);
      setCatalog(nextProducts);
      setHarvests((rows) => rows.filter((record) => record.product_id !== selected.id));
      setSelectedId(nextProducts[0]?.id ?? '');
      setHarvestFormOpen(false);
      resetHarvestForm();
      if (imagePaths.length) {
        const { error: storageError } = await supabase.storage.from('truffle-photos').remove(imagePaths);
        setMessage(storageError ? 'Продуктът е изтрит, но част от снимките останаха в Storage.' : 'Продуктът и подпродуктите му са изтрити.');
      } else setMessage('Продуктът и подпродуктите му са изтрити.');
    }
    setSaving(false);
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const loginName = username.trim().toUpperCase();
    const emailAlias = Object.entries(adminAuthAliases).find(([allowedUsername]) => allowedUsername === loginName)?.[1];
    if (!emailAlias) {
      setError('Използвай ESI_ADMIN или KOSIO_ADMIN.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: emailAlias, password });
    if (signInError) setError('Неуспешен вход. Провери username-а и паролата.');
    else setSignedInUsername(loginName as AdminUsername);
    setSaving(false);
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCatalog([]);
    setPassword('');
    setSignedInUsername(null);
    setAdminAccess('denied');
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selected) return;
    setSaving(true);
    setError('');
    setMessage('');
    const slugByLocale = Object.fromEntries(locales.map((locale) => {
      const value = selected.slug_by_locale?.[locale] || selected.title_by_locale[locale] || selected.title_by_locale.en || selected.id;
      return [locale, slugifyProduct(value) || selected.id];
    })) as Record<Locale, string>;
    const duplicate = catalog.find((product) => product.id !== selected.id && locales.some((locale) => {
      const existingSlug = product.slug_by_locale?.[locale] || slugifyProduct(product.title_by_locale[locale] || product.id) || product.id;
      return existingSlug === slugByLocale[locale];
    }));
    if (duplicate) {
      setError(`URL адресът „${slugByLocale[editLocale]}“ вече се използва. Избери друг slug за ${languageMeta[editLocale].label}.`);
      setSaving(false);
      return;
    }
    const payload = { ...selected, slug_by_locale: slugByLocale, updated_at: new Date().toISOString() };
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

  async function saveHarvest() {
    if (!supabase || !selected) return;
    const weight = Number(harvestWeight);
    const quantity = Number(harvestQuantity);
    if (!harvestDate || !Number.isInteger(weight) || weight < 1 || !Number.isInteger(quantity) || quantity < 1) {
      setError('Въведи дата, грамаж и брой, по-големи от нула.');
      return;
    }
    if (harvestPhoto && (!harvestPhoto.type.startsWith('image/') || harvestPhoto.size > 8 * 1024 * 1024)) {
      setError('Снимката трябва да е изображение до 8 MB.');
      return;
    }
    setSaving(true);
    setError('');
    const currentRecord = harvests.find((record) => record.id === editingHarvestId);
    let imagePath: string | null = currentRecord?.image_path ?? null;
    let publicImage: string | null = currentRecord?.image_url ?? null;
    const bucket = supabase.storage.from('truffle-photos');
    if (harvestPhoto) {
      const extension = harvestPhoto.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
      const path = `harvests/${selected.id}/${Date.now()}.${extension}`;
      const { data: uploaded, error: uploadError } = await bucket.upload(path, harvestPhoto, { cacheControl: '3600', upsert: false, contentType: harvestPhoto.type });
      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }
      imagePath = uploaded.path;
      publicImage = bucket.getPublicUrl(uploaded.path).data.publicUrl;
    }
    const payload = {
      product_id: selected.id,
      found_on: harvestDate,
      weight_grams: weight,
      quantity,
      notes: harvestNotes.trim(),
      image_url: publicImage,
      image_path: imagePath,
    };
    const { data, error: saveError } = currentRecord
      ? await supabase.from('truffle_harvests').update(payload).eq('id', currentRecord.id).select('*').single()
      : await supabase.from('truffle_harvests').insert(payload).select('*').single();
    if (saveError) {
      if (harvestPhoto && imagePath) await bucket.remove([imagePath]);
      setError(saveError.message);
    } else {
      const saved = data as HarvestRecord;
      setHarvests((rows) => currentRecord
        ? rows.map((record) => record.id === saved.id ? saved : record)
        : [saved, ...rows]);
      if (currentRecord?.image_path && currentRecord.image_path !== imagePath) await bucket.remove([currentRecord.image_path]);
      setMessage(currentRecord ? 'Подпродуктът е обновен.' : 'Подпродуктът е добавен.');
      resetHarvestForm();
      setHarvestFormOpen(false);
    }
    setSaving(false);
  }

  async function toggleHarvest(record: HarvestRecord) {
    if (!supabase) return;
    setSaving(true);
    const { data, error: updateError } = await supabase.from('truffle_harvests')
      .update({ is_available: !record.is_available }).eq('id', record.id).select('*').single();
    if (updateError) setError(updateError.message);
    else setHarvests((rows) => rows.map((row) => row.id === record.id ? data as HarvestRecord : row));
    setSaving(false);
  }

  async function deleteHarvest(record: HarvestRecord) {
    if (!supabase || !window.confirm('Да изтрия ли тази находка?')) return;
    setSaving(true);
    const { error: deleteError } = await supabase.from('truffle_harvests').delete().eq('id', record.id);
    if (deleteError) setError(deleteError.message);
    else {
      setHarvests((rows) => rows.filter((row) => row.id !== record.id));
      if (record.image_path) {
        const { error: storageError } = await supabase.storage.from('truffle-photos').remove([record.image_path]);
        setMessage(storageError ? 'Находката е изтрита, но снимката остана в Storage.' : 'Находката е изтрита.');
      } else setMessage('Находката е изтрита.');
    }
    setSaving(false);
  }

  if (!authReady || (session && adminAccess === 'loading')) return <main className="admin-state"><span className="admin-spinner" /><p>Проверяваме достъпа…</p></main>;
  if (!supabase) return <AdminSetup />;
  if (!session) return <main className="admin-login-page"><section className="admin-login"><Link className="admin-mark" to="/bg/"><img src="/images/brand-logo.png" alt="" /><span><strong>TRUFFLE BALKANS</strong><small>ADMIN WORKSPACE</small></span></Link><p className="admin-eyebrow">SECURE SIGN IN</p><h1>Вход в администрацията</h1><p className="admin-intro">Гъби, снимки, описания, наличности и цени.</p><form onSubmit={signIn}><label>Потребителско име<input type="text" autoComplete="username" autoCapitalize="characters" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="ESI_ADMIN или KOSIO_ADMIN" required /></label><label>Парола<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="admin-error" role="alert">{error}</p>}<button className="admin-primary" type="submit" disabled={saving}>{saving ? 'Влизане…' : 'Влез в администрацията'}</button></form><Link className="admin-back" to="/bg/">← Към сайта</Link></section><div className="admin-login-aside"><img src={imageUrl('black-truffle', 1400)} alt="Трюфел" /></div></main>;
  if (adminAccess === 'denied') return <main className="admin-state"><ShieldCheck size={34} /><h1>Нямаш администраторски достъп</h1><p>{error || 'Профилът няма достъп до продуктовия каталог.'}</p><button className="admin-secondary" onClick={signOut}>Излез от профила</button></main>;
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-mark" to="/bg/"><img src="/images/brand-logo.png" alt="" /><span><strong>TRUFFLE BALKANS</strong><small>ADMIN WORKSPACE</small></span></Link>
        <div className="admin-sidebar-heading"><div className="admin-sidebar-label">{catalog.length} ПРОДУКТА · НАЛИЧНОСТ</div><button className="admin-add-product" type="button" title="Добави главен продукт" aria-label="Добави главен продукт" onClick={() => void addProduct()} disabled={saving}><Plus size={17} /></button></div>
        <div className="admin-product-list">
          {catalog.map((item) => <button type="button" key={item.id} className={`admin-product-nav ${item.id === selectedId ? 'is-active' : ''}`} onClick={() => { setSelectedId(item.id); setMessage(''); setError(''); setHarvestFormOpen(false); resetHarvestForm(); }}>
            <span className="admin-product-thumb"><img src={safeCatalogImage(item.image_url, item.id, 320)} alt="" /></span>
            <span><strong>{item.title_by_locale.bg || item.title_by_locale.en || item.id}</strong><small>{item.available ? `${harvests.filter((row) => row.product_id === item.id && row.is_available).reduce((sum, row) => sum + row.weight_grams, 0) || item.stock_grams || 0} g налични` : 'Скрит продукт'}</small></span>
            <span className={`availability-dot ${item.available ? 'is-available' : ''}`} />
          </button>)}
        </div>
        <div className="admin-sidebar-bottom"><Link to="/bg/" className="admin-back"><ArrowLeft size={15} />Към сайта</Link><button className="admin-signout" onClick={signOut}><LogOut size={15} />Изход</button></div>
      </aside>
      <section className="admin-workspace">
        <header className="admin-topbar"><div><p className="admin-eyebrow">УПРАВЛЕНИЕ НА РЕКОЛТАТА</p><h1>Гъби и цени</h1></div><span className="admin-user">{signedInUsername ?? adminUsernameForEmail(session.user.email) ?? 'ADMIN'}</span></header>
        {loadingCatalog ? <div className="admin-state"><span className="admin-spinner" /><p>Зареждаме продуктите…</p></div> : selected ? (
          <form className="admin-editor" onSubmit={saveProduct}>
            <div className="admin-editor-heading">
              <div><span className="admin-status-line"><i className={selected.available ? 'is-available' : ''} />{selected.available ? 'Публикуван продукт' : 'Скрит от сайта'}</span><h2>{selected.title_by_locale[editLocale] || selected.title_by_locale.bg || 'Нов продукт'}</h2><p>Редактирай описанието, снимката, количеството и цената на килограм.</p></div>
              <div className="admin-editor-actions"><button className="admin-danger" type="button" onClick={() => void deleteProduct()} disabled={saving}><Trash2 size={16} />Изтрий продукт</button><button className="admin-primary admin-save" type="submit" disabled={saving}>{saving ? <span className="admin-spinner" /> : <Save size={16} />}{saving ? 'Запазване…' : 'Запази'}</button></div>
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
                  <label>URL адрес за {languageMeta[editLocale].label}<input value={selected.slug_by_locale?.[editLocale] ?? ''} onChange={(event) => updateField('slug_by_locale', { ...selected.slug_by_locale, [editLocale]: event.target.value })} placeholder={slugifyProduct(selected.title_by_locale[editLocale] || selected.title_by_locale.en || selected.id) || selected.id} /></label>
                  <p className="admin-slug-preview">Страница: /{editLocale}/{pageSlugs[editLocale].products}/{slugifyProduct(selected.slug_by_locale?.[editLocale] || selected.title_by_locale[editLocale] || selected.title_by_locale.en || selected.id) || selected.id}</p>
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
            <section className="admin-card admin-harvest-card">
              <div className="admin-card-heading"><div><span className="admin-eyebrow">ПОДПРОДУКТИ</span><h3>Намерени количества</h3></div><div className="admin-harvest-heading-actions"><span className="admin-harvest-total">{harvests.filter((row) => row.product_id === selected.id && row.is_available).reduce((sum, row) => sum + row.weight_grams, 0)} g налични</span><button className="admin-primary" type="button" onClick={() => { resetHarvestForm(); setHarvestFormOpen((open) => !open); }} disabled={saving}><Plus size={15} />{harvestFormOpen ? 'Затвори' : 'Подпродукт'}</button></div></div>
              {harvestFormOpen && <div className="admin-harvest-form">
                <label>Намерена на<input type="date" value={harvestDate} onChange={(event) => setHarvestDate(event.target.value)} /></label>
                <label>Общо тегло<div className="admin-input-suffix"><input type="number" min="1" step="1" value={harvestWeight} onChange={(event) => setHarvestWeight(event.target.value)} placeholder="напр. 120" /><span>g</span></div></label>
                <label>Брой гъби<input type="number" min="1" step="1" value={harvestQuantity} onChange={(event) => setHarvestQuantity(event.target.value)} /></label>
                <label>Бележка<input value={harvestNotes} onChange={(event) => setHarvestNotes(event.target.value)} placeholder="Район, размер, качество…" /></label>
                <label className="admin-harvest-file"><ImagePlus size={15} />{harvestPhoto ? harvestPhoto.name : 'Снимка'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setHarvestPhoto(event.target.files?.[0] ?? null)} /></label>
                <div className="admin-harvest-form-actions"><button className="admin-secondary" type="button" onClick={() => { resetHarvestForm(); setHarvestFormOpen(false); }}>Откажи</button><button className="admin-primary" type="button" onClick={() => void saveHarvest()} disabled={saving}>{saving ? 'Запазване…' : editingHarvestId ? 'Запази подпродукт' : 'Добави подпродукт'}</button></div>
              </div>}
              {loadingHarvests ? <p className="admin-help">Зареждаме находките…</p> : <div className="admin-harvest-list">{harvests.filter((row) => row.product_id === selected.id).map((row) => <article className="admin-harvest-row" key={row.id}>
                {row.image_url ? <img src={row.image_url} alt="" /> : <span className="admin-harvest-no-image"><ImagePlus size={18} /></span>}
                <div><strong>{new Date(`${row.found_on}T12:00:00`).toLocaleDateString('bg-BG')} · {row.weight_grams} g · {row.quantity} бр.</strong><small>{row.notes || 'Без бележка'} · {row.is_available ? 'Показва се в сайта' : 'Скрита от сайта'}</small></div>
                <label className="admin-toggle admin-harvest-toggle"><span className="sr-only">Показване в сайта</span><input type="checkbox" checked={row.is_available} onChange={() => void toggleHarvest(row)} disabled={saving} /></label>
                <button className="admin-icon-button admin-harvest-edit" type="button" title="Редактирай подпродукта" aria-label="Редактирай подпродукта" onClick={() => editHarvest(row)} disabled={saving}><Pencil size={16} /></button>
                <button className="admin-icon-button admin-harvest-delete" type="button" title="Изтрий находката" aria-label="Изтрий находката" onClick={() => void deleteHarvest(row)} disabled={saving}><Trash2 size={16} /></button>
              </article>)}</div>}
            </section>
            {error && <p className="admin-error" role="alert">{error}</p>}
            {message && <p className="admin-success" role="status"><Check size={15} />{message}</p>}
            <p className="admin-save-note">Последна редакция: {selected.updated_at ? new Date(selected.updated_at).toLocaleString('bg-BG') : 'нов продукт'}</p>
          </form>
        ) : <div className="admin-state"><p>Няма главни продукти. Използвай `+`, за да добавиш първия.</p></div>}
      </section>
    </main>
  );
}

function AdminSetup() {
  return <main className="admin-state"><ShieldCheck size={34} /><p className="admin-eyebrow">ADMIN SETUP REQUIRED</p><h1>Настрой Supabase достъп</h1><p>Добави `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` към `.env.local` и Vercel Environment Variables.</p><p>Изпълни `supabase/schema.sql`, създай потребител в Supabase Auth и добави UUID-то му в `public.admin_users`.</p><a className="admin-primary" href="https://github.com/gitcho505-hue/mushroom/blob/main/docs/ADMIN_SETUP.md" target="_blank" rel="noreferrer">Отвори setup инструкциите <ArrowUpRight size={15} /></a><Link className="admin-back" to="/bg/">Към сайта</Link></main>;
}