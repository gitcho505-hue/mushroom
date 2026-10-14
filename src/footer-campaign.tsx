import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { pathFor, type Locale } from './content';
import { getSupabaseClient } from './catalog';
import { newsletterCopy } from './newsletter-copy';
import { WhatsAppIcon, whatsappLink } from './whatsapp';

export function FooterCampaign({ locale }: { locale: Locale }) {
  const text = newsletterCopy[locale];
  const client = getSupabaseClient();
  const [ready, setReady] = useState<'checking' | 'ready' | 'unavailable'>('checking');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!client) { setReady('unavailable'); return; }
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    void client.rpc('newsletter_ready').abortSignal(controller.signal).then(({ data, error }) => {
      if (active) setReady(!error && data === true ? 'ready' : 'unavailable');
    });
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [client]);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || ready !== 'ready' || status === 'saving') return;
    const fields = new FormData(event.currentTarget);
    setStatus('saving');
    try {
      const { error } = await client.rpc('subscribe_to_newsletter', {
        subscriber_email: String(fields.get('email') ?? '').trim().toLowerCase(),
        subscriber_locale: locale,
        consent: fields.get('consent') === 'on',
        website: String(fields.get('website') ?? ''),
      });
      setStatus(error ? 'error' : 'success');
    } catch { setStatus('error'); }
  }

  return <section className="footer-campaign" aria-labelledby="footer-campaign-title">
    <img className="footer-campaign-photo" src="/images/truffle-newsletter.jpg" alt="" aria-hidden="true" loading="lazy" width="1983" height="793" />
    <div className="footer-campaign-inner"><div className="footer-campaign-copy">
      <h2 id="footer-campaign-title">{text.title}</h2>
      <p className="footer-campaign-intro">{text.intro}</p>
      <a className="button footer-whatsapp" href={whatsappLink(text.message)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon />WhatsApp<ArrowRight size={18} aria-hidden="true" /></a>
      <div className="newsletter">
        <h3>{text.heading}</h3><p>{text.description}</p>
        {status === 'success' ? <p className="newsletter-success" role="status"><Check size={22} aria-hidden="true" />{text.success}</p> : <form onSubmit={subscribe} aria-busy={status === 'saving'}>
          <div className="newsletter-fields"><label htmlFor="newsletter-email">{text.email}</label><div className="newsletter-input-row"><input id="newsletter-email" name="email" type="email" autoComplete="email" placeholder={text.email} required maxLength={254} disabled={ready !== 'ready' || status === 'saving'} /><button className="button" type="submit" disabled={ready !== 'ready' || status === 'saving'}>{status === 'saving' ? text.sending : text.subscribe}<ArrowRight size={17} aria-hidden="true" /></button></div></div>
          <div className="newsletter-trap" aria-hidden="true"><label>Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label></div>
          <label className="newsletter-consent"><input name="consent" type="checkbox" required disabled={ready !== 'ready' || status === 'saving'} /><span>{text.consent} <Link to={pathFor(locale, 'privacy')}>{text.privacy}</Link></span></label>
          {status === 'error' && <p className="newsletter-error" role="alert">{text.error}</p>}
        </form>}
        {ready !== 'ready' && <p className="newsletter-notice" role="status">{ready === 'checking' ? text.checking : text.unavailable}</p>}
        <a className="newsletter-unsubscribe" href={whatsappLink(text.unsubscribeMessage)} target="_blank" rel="noopener noreferrer">{text.unsubscribe}</a>
      </div>
    </div></div>
  </section>;
}
