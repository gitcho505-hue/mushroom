import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

process.loadEnvFile('.env.production');
const destination = resolve(process.argv[2] || join(tmpdir(), 'esi-gallery-seed'));
await mkdir(destination, { recursive: true });
const source = await readFile('src/harvest-photos.ts', 'utf8');
const originals = [...source.split('/**')[0].matchAll(/IMG_\d+\.(?:jpeg|png)/g)].map((match) => match[0]);
const priorities = [...source.split('export const homeGalleryPhotos = [')[1].split('] as const')[0].matchAll(/IMG_\d+\.(?:jpeg|png)/g)].map((match) => match[0]);
const files = [...priorities, ...originals.filter((file) => !priorities.includes(file))];
const locales = ['bg', 'en', 'it', 'fr', 'de'];
const subjects = {
  harvest: ['Сортирани трюфели от сезонната реколта', 'Sorted truffles from the seasonal harvest', 'Tartufi selezionati del raccolto stagionale', 'Truffes triées de la récolte saisonnière', 'Sortierte Trüffel aus der saisonalen Ernte'],
  weighing: ['Претегляне на пресни трюфели от реколтата', 'Weighing fresh truffles from the harvest', 'Pesatura dei tartufi freschi del raccolto', 'Pesée des truffes fraîches de la récolte', 'Wiegen frischer Trüffel aus der Ernte'],
  people: ['На терен с търсачите на трюфели и техните кучета', 'In the field with truffle hunters and their dogs', 'Sul campo con i cercatori di tartufi e i loro cani', 'Sur le terrain avec les chercheurs de truffes et leurs chiens', 'Mit Trüffelsuchern und ihren Hunden im Gelände'],
  dogs: ['Кучетата ни по време на търсене на трюфели в гората', 'Our dogs searching for truffles in the woodland', 'I nostri cani alla ricerca di tartufi nel bosco', 'Nos chiens à la recherche de truffes en forêt', 'Unsere Hunde bei der Trüffelsuche im Wald'],
  landscape: ['Природата и горите на Балканите', 'Balkan landscapes and woodland', 'Paesaggi e boschi dei Balcani', 'Paysages et forêts des Balkans', 'Landschaften und Wälder des Balkans'],
  black: ['Черен трюфел, показан в ръка след събирането', 'A black truffle held in a hand after harvesting', 'Un tartufo nero tenuto in mano dopo la raccolta', 'Une truffe noire en main après la récolte', 'Eine schwarze Trüffel nach der Ernte in der Hand'],
  river: ['Горски поток по време на излет за трюфели', 'A woodland stream on a truffle foraging trip', 'Un ruscello nel bosco durante la ricerca dei tartufi', 'Un ruisseau en forêt lors d’une sortie aux truffes', 'Ein Waldbach bei einem Ausflug zur Trüffelsuche'],
  mushrooms: ['Диви гъби от нашите снимки от гората', 'Wild mushrooms from our woodland photographs', 'Funghi selvatici nelle nostre foto del bosco', 'Champignons sauvages dans nos photos de forêt', 'Wildpilze auf unseren Waldfotografien'],
  cut: ['Разрязан трюфел с видима вътрешна структура', 'A cut truffle showing its inner marbling', 'Un tartufo tagliato con la venatura interna visibile', 'Une truffe coupée montrant ses marbrures', 'Eine aufgeschnittene Trüffel mit sichtbarer Marmorierung'],
};
const categories = {
  weighing: [7274, 7275, 7277, 7278, 7296, 7309],
  people: [7280, 7291, 7292, 7312],
  dogs: [7282, 7283, 7284, 7290, 7293, 7298, 7299, 7300, 7301, 7308, 7311],
  landscape: [7281, 7285, 7313, 7314],
  black: [7286, 7287, 7288, 7289, 7294, 7295, 7305, 7310],
  river: [7302, 7307],
  mushrooms: [7303, 7304, 7306, 7318, 7319, 7320],
  cut: [7316, 7317],
};
const rows = [];
let originalBytes = 0;
for (const [index, file] of files.entries()) {
  const number = Number(file.match(/\d+/)[0]);
  const category = Object.entries(categories).find(([, numbers]) => numbers.includes(number))?.[0] || 'harvest';
  const slug = `balkan-truffle-${category}-${String(index + 1).padStart(2, '0')}`;
  const filename = `${slug}.webp`;
  const bytes = await readFile(`public/snimki/${file}`);
  originalBytes += bytes.length;
  const info = await sharp(bytes).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(join(destination, filename));
  const digest = createHash('sha256').update(`gallery:${file}`).digest();
  digest[6] = digest[6] & 15 | 64; digest[8] = digest[8] & 63 | 128;
  const hex = digest.subarray(0, 16).toString('hex');
  const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  const alt = Object.fromEntries(locales.map((locale, i) => [locale, subjects[category][i]]));
  const created = new Date(Date.UTC(2026, 9, 14, 20, 0, index)).toISOString();
  rows.push({ id, slug, image_url: `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/gallery-photos/${filename}`, image_path: filename, width: info.width, height: info.height, bytes: info.size, alt_by_locale: alt, title_by_locale: alt, published: true, sort_order: (index + 1) * 1024, home_position: index < 10 ? index + 1 : null, created_at: created, updated_at: created });
}
await writeFile('src/gallery-seed.json', JSON.stringify(rows, null, 2) + '\n');
const quote = (value) => value === null ? 'null' : typeof value === 'boolean' || typeof value === 'number' ? String(value) : `'${(typeof value === 'object' ? JSON.stringify(value) : value).replaceAll("'", "''")}'`;
const columns = Object.keys(rows[0]);
await writeFile('supabase/gallery-seed.sql', `-- Existing gallery photographs, compressed to WebP. Originals are unchanged.\nbegin;\ninsert into public.gallery_photos (${columns.join(', ')}) values\n${rows.map((row) => `(${columns.map((column) => quote(row[column])).join(', ')})`).join(',\n')}\non conflict (id) do nothing;\ncommit;\n`);
console.log(JSON.stringify({ count: rows.length, destination, originalBytes, webpBytes: rows.reduce((sum, row) => sum + row.bytes, 0) }));
