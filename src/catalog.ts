import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { imageUrl, locales, truffleIds, truffles, type Locale } from './content';

export type TruffleId = (typeof truffleIds)[number];

export type CatalogProduct = {
  id: TruffleId;
  title_by_locale: Record<Locale, string>;
  description_by_locale: Record<Locale, string>;
  body_by_locale: Record<Locale, string>;
  season_by_locale: Record<Locale, string>;
  note_by_locale: Record<Locale, string>;
  origin: string;
  image_url: string;
  image_path: string | null;
  weight_grams: number | null;
  price: number | null;
  currency: string;
  available: boolean;
  stock_grams: number | null;
  updated_at?: string;
};

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  client ??= createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}

function localizedValue(field: 'title' | 'description' | 'body' | 'season' | 'note', id: TruffleId) {
  return Object.fromEntries(locales.map((locale) => [locale, truffles[locale][id][field]])) as Record<Locale, string>;
}

export function createCatalogSeeds(): CatalogProduct[] {
  return truffleIds.map((id) => ({
    id,
    title_by_locale: localizedValue('title', id),
    description_by_locale: localizedValue('description', id),
    body_by_locale: localizedValue('body', id),
    season_by_locale: localizedValue('season', id),
    note_by_locale: localizedValue('note', id),
    origin: 'Balkans',
    image_url: imageUrl(truffles.bg[id].image, 1280),
    image_path: null,
    weight_grams: null,
    price: null,
    currency: 'EUR',
    available: true,
    stock_grams: null,
  }));
}