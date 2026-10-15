import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { catalogProductSlug, imageUrl, locales, truffleIds, truffles, type Locale } from './content';

export type TruffleId = string;

export type CatalogProduct = {
  id: TruffleId;
  slug_by_locale: Record<Locale, string>;
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
  price_per_kg: number | null;
  currency: string;
  available: boolean;
  is_hidden?: boolean;
  status?: string;
  stock_grams: number | null;
  updated_at?: string;
};

const cyrillicSlugMap: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht',
  ъ: 'a', ь: '', ю: 'yu', я: 'ya', ѝ: 'i',
};

export function slugifyProduct(value: string) {
  return value.toLowerCase()
    .replace(/[а-яёѝ]/g, (letter) => cyrillicSlugMap[letter] ?? letter)
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type HarvestRecord = {
  id: string;
  product_id: TruffleId;
  found_on: string;
  weight_grams: number;
  quantity: number;
  notes: string;
  image_url: string | null;
  image_path: string | null;
  is_available: boolean;
  is_hidden?: boolean;
  status?: string;
  grade_code?: string | null;
  size_code?: string | null;
  preparation_code?: string | null;
  created_at?: string;
};

type PageResult<T> = { data: T[] | null; count: number | null; error: { message: string } | null };
type AllRowsResult<T> = { data: T[]; error: null } | { data: null; error: { message: string } };

async function loadAllRows<T>(fetchPage: (from: number, to: number) => Promise<PageResult<T>>): Promise<AllRowsResult<T>> {
  const pageSize = 250;
  const rows: T[] = [];
  let total: number | null = null;

  while (total === null || rows.length < total) {
    const { data, count, error } = await fetchPage(rows.length, rows.length + pageSize - 1);
    if (error) return { data: null, error };
    if (!data?.length) break;
    rows.push(...data);
    if (count !== null) total = count;
    else if (data.length < pageSize) break;
  }

  return { data: rows, error: null };
}

export const isPublicProduct = (product?: CatalogProduct | null) => product?.available === true && product.is_hidden !== true && product.status !== 'hidden';
export const isPublicHarvest = (record: HarvestRecord) => record.is_available === true && record.is_hidden !== true && record.status !== 'hidden';
export type PublicCatalog = { products: CatalogProduct[]; harvests: HarvestRecord[] };
export function filterPublicCatalog(products: CatalogProduct[], harvests: HarvestRecord[]): PublicCatalog {
  const visible = products.filter(isPublicProduct);
  const ids = new Set(visible.map((product) => product.id));
  return { products: visible, harvests: harvests.filter((record) => isPublicHarvest(record) && ids.has(record.product_id)) };
}

export async function loadCatalogProducts(client: SupabaseClient, publicOnly = false): Promise<AllRowsResult<CatalogProduct>> {
  const result = await loadAllRows<CatalogProduct>(async (from, to) => {
    let query = client.from('truffle_products').select('*', { count: 'exact' });
    if (publicOnly) query = query.eq('available', true);
    return await query.order('id').range(from, to);
  });
  if (result.error) return result;
  return { data: result.data!.filter((product) => !publicOnly || isPublicProduct(product)).map((product) => ({ ...product, slug_by_locale: Object.fromEntries(locales.map((locale) => [locale, catalogProductSlug(locale, product.id, product.slug_by_locale)])) as Record<Locale, string> })), error: null };
}

export function loadHarvestRecords(client: SupabaseClient, publicOnly = false) {
  return loadAllRows<HarvestRecord>(async (from, to) => {
    let query = client.from('truffle_harvests').select('*', { count: 'exact' });
    if (publicOnly) query = query.eq('is_available', true);
    return await query.order('found_on', { ascending: false }).order('created_at', { ascending: false }).order('id').range(from, to);
  });
}

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

export function safeCatalogImage(image: string, fallbackId: string, width = 1200) {
  if (image.startsWith('/snimki/')) return image;
  if (/^\/images\/[\w-]+\.(?:jpg|jpeg|png|webp|avif)$/.test(image)) return image;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  if (supabaseUrl && image.startsWith(`${supabaseUrl}/storage/v1/object/public/truffle-photos/`)) return image;
  return imageUrl(fallbackId, width);
}

function localizedValue(field: 'title' | 'description' | 'body' | 'season' | 'note', id: (typeof truffleIds)[number]) {
  return Object.fromEntries(locales.map((locale) => [locale, truffles[locale][id][field]])) as Record<Locale, string>;
}

export function createCatalogSeeds(): CatalogProduct[] {
  return truffleIds.map((id) => ({
    id,
    slug_by_locale: Object.fromEntries(locales.map((locale) => [locale, truffles[locale][id].slug])) as Record<Locale, string>,
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
    price_per_kg: null,
    currency: 'EUR',
    available: true,
    stock_grams: null,
  }));
}

export function createEmptyCatalogProduct(id: string): CatalogProduct {
  const localized = Object.fromEntries(locales.map((locale) => [locale, ''])) as Record<Locale, string>;
  const initialSlugs = Object.fromEntries(locales.map((locale) => [locale, id])) as Record<Locale, string>;
  return {
    id,
    slug_by_locale: initialSlugs,
    title_by_locale: { ...localized, bg: 'Нов продукт' },
    description_by_locale: { ...localized },
    body_by_locale: { ...localized },
    season_by_locale: { ...localized },
    note_by_locale: { ...localized },
    origin: 'Balkans',
    image_url: imageUrl('black-truffle', 1280),
    image_path: null,
    weight_grams: null,
    price: null,
    price_per_kg: null,
    currency: 'EUR',
    available: true,
    stock_grams: null,
  };
}
