import { useState } from 'react';
import { Download, RefreshCw, Trash2 } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';

type Subscriber = { id: string; email: string; locale: string; consent_at: string; consent_version: string };

export function NewsletterAdmin({ client }: { client: SupabaseClient }) {
  const [rows, setRows] = useState<Subscriber[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setBusy(true); setError('');
    try {
      const all: Subscriber[] = [];
      for (;;) {
        const { data, error: queryError } = await client.from('newsletter_subscribers')
          .select('id,email,locale,consent_at,consent_version').order('created_at', { ascending: false }).order('id').range(all.length, all.length + 249);
        if (queryError) throw queryError;
        all.push(...(data ?? []));
        if (!data || data.length < 250) break;
      }
      setRows(all);
    } catch { setError('Не успяхме да заредим абонатите. Проверете дали newsletter.sql е приложен и профилът има администраторски достъп.'); }
    finally { setBusy(false); }
  }

  function exportCsv() {
    if (!rows?.length) return;
    const cell = (value: string) => `"${(/^[=+@-]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`;
    const csv = [['email', 'language', 'consent_at', 'consent_version'], ...rows.map((row) => [row.email, row.locale, row.consent_at, row.consent_version])].map((row) => row.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'esi-truffle-newsletter.csv'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function remove(row: Subscriber) {
    setBusy(true); setError('');
    try {
      const { error: deleteError } = await client.from('newsletter_subscribers').delete().eq('id', row.id);
      if (deleteError) throw deleteError;
      setRows((current) => current?.filter((item) => item.id !== row.id) ?? null);
    } catch { setError('Адресът не беше изтрит. Опитайте отново.'); }
    finally { setBusy(false); }
  }

  return <section className="admin-card admin-newsletter" aria-labelledby="admin-newsletter-title">
    <div className="admin-card-heading"><div><span className="admin-eyebrow">ИМЕЙЛ БЮЛЕТИН</span><h3 id="admin-newsletter-title">Абонати{rows && ` · ${rows.length}`}</h3></div><div className="admin-newsletter-actions"><button className="admin-secondary" type="button" onClick={() => void load()} disabled={busy}><RefreshCw size={16} />{busy ? 'Зареждане…' : rows ? 'Обнови' : 'Зареди абонатите'}</button><button className="admin-secondary" type="button" onClick={exportCsv} disabled={busy || !rows?.length}><Download size={16} />CSV</button></div></div>
    <p>Списъкът е достъпен само за администратори. Експортирайте адресите за имейл кампания или изтрийте адрес при поискване на отписване. Тази секция не изпраща имейли.</p>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {rows?.length === 0 && <p>Все още няма записани абонати.</p>}
    {!!rows?.length && <div className="admin-newsletter-table"><table><thead><tr><th scope="col">Имейл</th><th scope="col">Език</th><th scope="col">Съгласие</th><th scope="col">Отписване</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.email}</td><td>{row.locale.toUpperCase()}</td><td><time dateTime={row.consent_at}>{new Date(row.consent_at).toLocaleDateString('bg-BG')}</time></td><td><button className="admin-icon-button" type="button" aria-label={`Отпиши ${row.email}`} disabled={busy} onClick={() => void remove(row)}><Trash2 size={17} /></button></td></tr>)}</tbody></table></div>}
  </section>;
}
