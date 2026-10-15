import { renderPublicPage } from '../lib/site-render.js';

export default function handler(request, response) {
  const url = new URL(request.url, 'https://site.invalid');
  const locale = url.searchParams.get('locale');
  const path = url.searchParams.get('path') || '';
  return renderPublicPage(request, response, locale, `/${locale}/${path}`);
}
