import { getCollection, getEntry } from 'astro:content';
import { getAreasForTopicRefs } from './taxonomy';
import { contentUrl, type Locale } from '../i18n/routes';

// Yazılar/Basında index sayfalarının ortak sayfalama boyutu — roadmap kararı
// (bkz. mustafaeren-net-gocu-yol-haritasi.md, "Sayfa başına içerik").
export const PAGE_SIZE = 12;

export interface PressRowData {
  href: string;
  title: string;
  date: string;
  publishDate: Date;
  secondary: { label: string; href?: string };
  areas: string[];
}

// /mecra/{id}/ arşiv sayfaları yalnızca TR içeriğe referans veren mecralar için üretiliyor
// (bkz. mecra/[slug].astro) — bu yüzden mecra linki yalnızca TR sayfalarda tıklanabilir.
export async function buildYazilarRows(lang: Locale): Promise<PressRowData[]> {
  const entries = await getCollection('yazilar', (e) => e.data.lang === lang);
  entries.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
  return Promise.all(
    entries.map(async (entry) => {
      const mecra = entry.data.mecra ? await getEntry(entry.data.mecra) : undefined;
      const areas = await getAreasForTopicRefs(entry.data.topics);
      return {
        href: contentUrl('yazilar', lang, entry.id),
        title: entry.data.title,
        date: new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(entry.data.publishDate),
        publishDate: entry.data.publishDate,
        secondary: mecra
          ? { label: mecra.data.ad, href: lang === 'tr' ? `/mecra/${mecra.id}/` : undefined }
          : { label: 'Mustafaeren.net' },
        areas,
      };
    }),
  );
}

export async function buildBasindaRows(lang: Locale): Promise<PressRowData[]> {
  const entries = await getCollection('basinda', (e) => e.data.lang === lang);
  entries.sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
  return Promise.all(
    entries.map(async (entry) => {
      const mecra = await getEntry(entry.data.mecra);
      return {
        href: contentUrl('basinda', lang, entry.id),
        title: entry.data.title,
        date: new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(entry.data.publishDate),
        publishDate: entry.data.publishDate,
        secondary: { label: mecra.data.ad, href: lang === 'tr' ? `/mecra/${mecra.id}/` : undefined },
        areas: [],
      };
    }),
  );
}

export function paginateRows<T>(rows: T[], page: number): { pageRows: T[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  return { pageRows: rows.slice(start, start + PAGE_SIZE), totalPages };
}

// sayfa/[page].astro route'ları için: geçerli sayfa numaraları (2..totalPages) — sayfa 1
// zaten index.astro'da üretiliyor, burada tekrar üretilmiyor.
export function extraPageParams(totalPages: number): { params: { page: string } }[] {
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({ params: { page: String(i + 2) } }));
}
