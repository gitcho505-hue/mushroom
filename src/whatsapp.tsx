export function whatsappLink(message: string) {
  return `https://wa.me/359896343109?text=${encodeURIComponent(message)}`;
}

export function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.7 7.5L3 20.5l1.4-4.7a8.5 8.5 0 1 1 16.1-4.2Z" /><path d="M8.2 7.5c-.6.2-1 .8-1 1.4 0 2.8 3.6 6.4 6.4 6.4.7 0 1.4-.5 1.6-1.2l.2-.7-2.2-1.1-.8.9c-1.4-.7-2.5-1.8-3.1-3.1l.8-.8-1.1-2Z" /></svg>;
}
