import { createContext, useContext, useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './catalog';
import { type GalleryPhoto } from './gallery-model';
import seedRows from './gallery-seed.json';

export const gallerySeeds = seedRows as GalleryPhoto[];
const GalleryContext = createContext<{ photos: GalleryPhoto[]; error: boolean }>({ photos: gallerySeeds, error: false });

export async function loadGallery(client: SupabaseClient, admin = false): Promise<GalleryPhoto[]> {
  const all: GalleryPhoto[] = [];
  for (;;) {
    let query = client.from('gallery_photos').select('*').order('sort_order').order('created_at', { ascending: false }).order('id');
    if (!admin) query = query.eq('published', true);
    const { data, error } = await query.range(all.length, all.length + 249);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < 250) return all;
  }
}

function bootstrapRows() {
  if (typeof document === 'undefined') return gallerySeeds;
  try {
    const content = document.getElementById('gallery-bootstrap')?.textContent;
    return content ? JSON.parse(content) as GalleryPhoto[] : gallerySeeds;
  } catch { return gallerySeeds; }
}

export function GalleryProvider({ initialRows, children }: { initialRows?: GalleryPhoto[]; children: React.ReactNode }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(() => initialRows ?? bootstrapRows());
  const [error, setError] = useState(false);
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;
    let active = true;
    void loadGallery(client).then((rows) => { if (active) { setPhotos(rows); setError(false); } }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);
  return <GalleryContext.Provider value={{ photos, error }}>{children}</GalleryContext.Provider>;
}

export const useGallery = () => useContext(GalleryContext);
