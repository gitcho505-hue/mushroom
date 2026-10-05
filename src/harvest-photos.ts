import type { Locale } from './i18n';

export const harvestPhotos = [
  'IMG_7272.jpeg', 'IMG_7273.jpeg', 'IMG_7274.jpeg', 'IMG_7275.jpeg', 'IMG_7276.jpeg', 'IMG_7277.jpeg', 'IMG_7278.jpeg',
  'IMG_7280.jpeg', 'IMG_7281.jpeg', 'IMG_7282.jpeg', 'IMG_7283.jpeg', 'IMG_7284.jpeg', 'IMG_7285.jpeg', 'IMG_7286.jpeg',
  'IMG_7287.jpeg', 'IMG_7288.jpeg', 'IMG_7289.jpeg', 'IMG_7290.jpeg', 'IMG_7291.jpeg', 'IMG_7292.jpeg', 'IMG_7293.jpeg',
  'IMG_7294.jpeg', 'IMG_7295.jpeg', 'IMG_7296.jpeg', 'IMG_7297.jpeg', 'IMG_7298.jpeg', 'IMG_7299.jpeg', 'IMG_7300.jpeg',
  'IMG_7301.jpeg', 'IMG_7302.jpeg', 'IMG_7303.jpeg', 'IMG_7304.jpeg', 'IMG_7305.jpeg', 'IMG_7306.jpeg', 'IMG_7307.jpeg',
  'IMG_7308.jpeg', 'IMG_7309.jpeg', 'IMG_7310.jpeg', 'IMG_7311.jpeg', 'IMG_7312.png', 'IMG_7313.jpeg', 'IMG_7314.jpeg',
  'IMG_7315.png', 'IMG_7316.jpeg', 'IMG_7317.jpeg', 'IMG_7318.jpeg', 'IMG_7319.jpeg', 'IMG_7320.jpeg',
].map((fileName) => `/snimki/${fileName}`);

/** Hero carousel — full-resolution field frames, ordered by the homepage sequence. */
export const heroHarvestPhotos = [
  { src: '/snimki/IMG_7306.jpeg', position: 'center 58%' },
  { src: '/snimki/IMG_7302.jpeg', position: 'center 52%' },
  { src: '/snimki/IMG_7287.jpeg', position: 'center 62%' },
  { src: '/snimki/IMG_7301.jpeg', position: 'center 52%' },
] as const;

export const featuredHarvestPhotos = [
  '/snimki/IMG_7292.jpeg',
  '/snimki/IMG_7307.jpeg',
  '/snimki/IMG_7318.jpeg',
  '/snimki/IMG_7285.jpeg',
];

export const harvestGalleryCopy: Record<Locale, { eyebrow: string; title: string; description: string; imageLabel: string }> = {
  bg: { eyebrow: 'НАШАТА РЕКОЛТА', title: 'От гората до подбора', description: 'Истински моменти от терена, събирането и сортирането на сезонните гъби.', imageLabel: 'Снимка от реколтата' },
  en: { eyebrow: 'OUR HARVEST', title: 'From woodland to selection', description: 'Moments from the field, the search and the sorting of seasonal mushrooms.', imageLabel: 'Harvest photograph' },
  it: { eyebrow: 'IL NOSTRO RACCOLTO', title: 'Dal bosco alla selezione', description: 'Momenti sul campo, durante la ricerca e la selezione dei funghi di stagione.', imageLabel: 'Foto del raccolto' },
  fr: { eyebrow: 'NOTRE RÉCOLTE', title: 'De la forêt au tri', description: 'Des moments sur le terrain, pendant la recherche et le tri des champignons de saison.', imageLabel: 'Photo de la récolte' },
  de: { eyebrow: 'UNSERE ERNTE', title: 'Vom Wald zur Auswahl', description: 'Einblicke ins Gelände, in die Suche und in die Sortierung saisonaler Pilze.', imageLabel: 'Erntefoto' },
};