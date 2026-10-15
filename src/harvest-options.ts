import type { Locale } from './i18n';
import type { HarvestRecord } from './catalog';

type Option = { code: string; labels: Record<Locale, string> };
const option = (code: string, bg: string, en: string, it: string, fr: string, de: string): Option => ({ code, labels: { bg, en, it, fr, de } });
export const harvestOptions = {
  grade_code: [
    option('extra', 'Екстра', 'Extra grade', 'Qualità extra', 'Qualité extra', 'Extraqualität'),
    option('first', 'Първо качество', 'First grade', 'Prima qualità', 'Premier choix', 'Erste Qualität'),
    option('pieces', 'Парчета', 'Pieces', 'Pezzi', 'Morceaux', 'Stücke'),
  ],
  size_code: [
    option('small', 'Дребни', 'Small', 'Piccoli', 'Petites', 'Klein'),
    option('medium', 'Средни', 'Medium', 'Medi', 'Moyennes', 'Mittel'),
    option('large', 'Едри', 'Large', 'Grandi', 'Grandes', 'Groß'),
    option('mixed', 'Смесени', 'Mixed sizes', 'Pezzatura mista', 'Calibres mélangés', 'Gemischte Größen'),
  ],
  preparation_code: [
    option('unwashed', 'Непочистени', 'Uncleaned', 'Non puliti', 'Non nettoyées', 'Ungereinigt'),
    option('cleaned', 'Почистени', 'Cleaned', 'Puliti', 'Nettoyées', 'Gereinigt'),
  ],
};
export type HarvestOptionField = keyof typeof harvestOptions;
export const harvestOptionFields = Object.keys(harvestOptions) as HarvestOptionField[];
export const harvestOptionLabels: Record<HarvestOptionField, string> = { grade_code: 'Качество', size_code: 'Размер', preparation_code: 'Подготовка' };
export const emptyHarvestOptions = () => ({ grade_code: '', size_code: '', preparation_code: '' });
export function legacyGrade(notes: string) {
  const value = notes.trim().toLowerCase();
  if (['първо', 'първо качество', 'първо клас', 'first', 'first grade'].includes(value)) return 'first';
  if (['екстра', 'extra'].includes(value)) return 'extra';
  if (['парчета', 'pieces'].includes(value)) return 'pieces';
  return '';
}
export function harvestDetails(record: HarvestRecord, locale: Locale) {
  return harvestOptionFields.flatMap((field) => {
    const code = record[field] || (field === 'grade_code' ? legacyGrade(record.notes) : '');
    const selected = harvestOptions[field].find((item) => item.code === code);
    return selected ? [selected.labels[locale]] : [];
  }).join(' · ');
}
export const harvestStockCopy = {
  bg: { title: 'Актуални количества', total: 'общо', pieces: 'бр.', weight: 'Тегло', quantity: 'Брой' },
  en: { title: 'Current harvest', total: 'total', pieces: 'pcs', weight: 'Weight', quantity: 'Count' },
  it: { title: 'Raccolta disponibile', total: 'totali', pieces: 'pz', weight: 'Peso', quantity: 'Quantità' },
  fr: { title: 'Récoltes disponibles', total: 'au total', pieces: 'pcs', weight: 'Poids', quantity: 'Quantité' },
  de: { title: 'Aktuelle Ernte', total: 'insgesamt', pieces: 'Stk.', weight: 'Gewicht', quantity: 'Anzahl' },
};
