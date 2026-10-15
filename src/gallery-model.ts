import type { Locale } from './i18n';

export type GalleryPhoto = {
  id: string; slug: string; image_url: string; image_path: string;
  width: number; height: number; bytes: number;
  alt_by_locale: Partial<Record<Locale, string>>; title_by_locale: Partial<Record<Locale, string>>;
  published: boolean; sort_order: number; home_position: number | null;
  created_at: string; updated_at: string;
};

export function photoAlt(photo: GalleryPhoto, locale: Locale) {
  return photo.alt_by_locale[locale]?.trim() || photo.alt_by_locale.bg?.trim() || photo.slug.replace(/-/g, ' ');
}

export function photoTitle(photo: GalleryPhoto, locale: Locale) {
  return photo.title_by_locale[locale]?.trim() || photoAlt(photo, locale);
}

export function homepagePhotos(photos: readonly GalleryPhoto[]) {
  const published = photos.filter((photo) => photo.published);
  const featured = published.filter((photo) => photo.home_position !== null).sort((a, b) => a.home_position! - b.home_position!);
  const latest = published.filter((photo) => photo.home_position === null).sort((a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id));
  return [...featured, ...latest].slice(0, 10);
}
