import { getCollection } from 'astro:content';
import type { Locale } from '../i18n/routes';

export interface ContentCounts {
  yazilar: number;
  basinda: number;
  videolar: number;
  kitaplar: number;
}

const LOCALES: Locale[] = ['tr', 'en', 'de', 'fr'];

/**
 * 4 koleksiyonun (Yazılar/Basında/Videolar/Kitaplar) her dildeki gerçek girdi sayısı —
 * index sayfalarındaki "Türkçe (145) · English (10) · ..." dil+sayı satırı için kullanılır
 * (bkz. LangCountRow.astro). Tek seferde tüm koleksiyonları okuyup dile göre gruplar,
 * her sayfa için ayrı ayrı 4 dil × 4 koleksiyon sorgusu yapmaktan kaçınır.
 */
export async function getContentCountsByLang(): Promise<Record<Locale, ContentCounts>> {
  const [yazilar, basinda, videolar, kitaplar] = await Promise.all([
    getCollection('yazilar'),
    getCollection('basinda'),
    getCollection('videolar'),
    getCollection('kitaplar'),
  ]);

  const counts = Object.fromEntries(
    LOCALES.map((l) => [l, { yazilar: 0, basinda: 0, videolar: 0, kitaplar: 0 }]),
  ) as Record<Locale, ContentCounts>;

  for (const e of yazilar) counts[e.data.lang as Locale].yazilar++;
  for (const e of basinda) counts[e.data.lang as Locale].basinda++;
  for (const e of videolar) counts[e.data.lang as Locale].videolar++;
  for (const e of kitaplar) counts[e.data.lang as Locale].kitaplar++;

  return counts;
}
