export const catalogChangeEvent = 'truffle-catalog-changed';
export function notifyCatalogChanged() {
  window.dispatchEvent(new Event(catalogChangeEvent));
  try { localStorage.setItem(catalogChangeEvent, `${Date.now()}-${Math.random()}`); } catch { /* Realtime and polling remain available. */ }
}
