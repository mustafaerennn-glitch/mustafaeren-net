import { getCollection } from 'astro:content';
import { contentUrl } from '../i18n/routes';

export interface FeedItem {
  type: 'Yazı' | 'Basında' | 'Video' | 'Kitap';
  title: string;
  href: string;
  date: Date; // sıralama için — kitaplarda yılın 1 Ocak'ı kullanılır (yalnızca yıl bilgisi var)
  dateLabel: string; // "Ekim 2025" ya da kitaplar için "2025"
  meta?: string; // mecra/yayınevi gibi soluk ek bilgi
}

function formatMonthYear(date: Date, lang: string): string {
  return new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(date);
}

/**
 * 4 içerik koleksiyonunu (yazılar/basında/videolar/kitaplar) tek kronolojik akışta birleştirir —
 * Ana sayfadaki "Son eklenenler" bölümü için. Yalnızca TR girdileri (ana sayfa şu an TR-only).
 */
export async function getMergedFeed(limit: number): Promise<FeedItem[]> {
  const [yazilar, basinda, videolar, kitaplar] = await Promise.all([
    getCollection('yazilar', (e) => e.data.lang === 'tr'),
    getCollection('basinda', (e) => e.data.lang === 'tr'),
    getCollection('videolar', (e) => e.data.lang === 'tr'),
    getCollection('kitaplar', (e) => e.data.lang === 'tr'),
  ]);

  const items: FeedItem[] = [
    ...yazilar.map((e): FeedItem => ({
      type: 'Yazı',
      title: e.data.title,
      href: contentUrl('yazilar', e.data.lang, e.id),
      date: e.data.publishDate,
      dateLabel: formatMonthYear(e.data.publishDate, e.data.lang),
    })),
    ...basinda.map((e): FeedItem => ({
      type: 'Basında',
      title: e.data.title,
      href: contentUrl('basinda', e.data.lang, e.id),
      date: e.data.publishDate,
      dateLabel: formatMonthYear(e.data.publishDate, e.data.lang),
    })),
    ...videolar.map((e): FeedItem => ({
      type: 'Video',
      title: e.data.title,
      href: contentUrl('videolar', e.data.lang, e.id),
      date: e.data.publishDate,
      dateLabel: formatMonthYear(e.data.publishDate, e.data.lang),
    })),
    ...kitaplar.map((e): FeedItem => ({
      type: 'Kitap',
      title: e.data.title,
      href: contentUrl('kitaplar', e.data.lang, e.id),
      date: new Date(e.data.year, 0, 1),
      dateLabel: String(e.data.year),
    })),
  ];

  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return items.slice(0, limit);
}
