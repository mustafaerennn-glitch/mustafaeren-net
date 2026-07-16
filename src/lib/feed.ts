import { getCollection } from 'astro:content';
import { contentUrl } from '../i18n/routes';

export interface FeedItem {
  type: 'Yazı' | 'Basında' | 'Video' | 'Kitap';
  typeLabel: string; // ekranda gösterilen, dile göre çevrilmiş etiket
  title: string;
  href: string;
  date: Date; // sıralama için — kitaplarda yılın 1 Ocak'ı kullanılır (yalnızca yıl bilgisi var)
  dateLabel: string; // "Ekim 2025" ya da kitaplar için "2025"
  meta?: string; // mecra/yayınevi gibi soluk ek bilgi
}

// Feed'deki tip rozetlerinin (Yazı/Basında/Video/Kitap) dile göre çevirisi — iç `type` alanı
// (sıralama/mantık için) TR sabit kalıyor, yalnızca ekranda gösterilen `typeLabel` değişiyor.
export const TYPE_LABELS: Record<string, Record<FeedItem['type'], string>> = {
  tr: { Yazı: 'Yazı', Basında: 'Basında', Video: 'Video', Kitap: 'Kitap' },
  en: { Yazı: 'Article', Basında: 'Press', Video: 'Video', Kitap: 'Book' },
  de: { Yazı: 'Artikel', Basında: 'Presse', Video: 'Video', Kitap: 'Buch' },
  fr: { Yazı: 'Article', Basında: 'Presse', Video: 'Vidéo', Kitap: 'Livre' },
};

function formatMonthYear(date: Date, lang: string): string {
  return new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric' }).format(date);
}

/**
 * 4 içerik koleksiyonunu (yazılar/basında/videolar/kitaplar) tek kronolojik akışta birleştirir —
 * Ana sayfadaki "Son eklenenler" bölümü için. Yalnızca verilen dildeki girdiler (her dilde ayrı
 * ana sayfa var, videolar/kitaplar şu an yalnızca TR'de gerçek içerik taşıyor — o koleksiyonlar
 * EN/DE/FR'de doğal olarak boş döner, sahte veri üretilmez).
 */
export async function getMergedFeed(limit: number, lang: string = 'tr'): Promise<FeedItem[]> {
  const [yazilar, basinda, videolar, kitaplar] = await Promise.all([
    getCollection('yazilar', (e) => e.data.lang === lang),
    getCollection('basinda', (e) => e.data.lang === lang),
    getCollection('videolar', (e) => e.data.lang === lang),
    getCollection('kitaplar', (e) => e.data.lang === lang),
  ]);
  const labels = TYPE_LABELS[lang] ?? TYPE_LABELS.tr;

  const items: FeedItem[] = [
    ...yazilar.map((e): FeedItem => ({
      type: 'Yazı',
      typeLabel: labels.Yazı,
      title: e.data.title,
      href: contentUrl('yazilar', e.data.lang, e.id),
      date: e.data.publishDate,
      dateLabel: formatMonthYear(e.data.publishDate, e.data.lang),
    })),
    ...basinda.map((e): FeedItem => ({
      type: 'Basında',
      typeLabel: labels.Basında,
      title: e.data.title,
      href: contentUrl('basinda', e.data.lang, e.id),
      date: e.data.publishDate,
      dateLabel: formatMonthYear(e.data.publishDate, e.data.lang),
    })),
    ...videolar.map((e): FeedItem => ({
      type: 'Video',
      typeLabel: labels.Video,
      title: e.data.title,
      href: contentUrl('videolar', e.data.lang, e.id),
      date: e.data.publishDate,
      dateLabel: formatMonthYear(e.data.publishDate, e.data.lang),
    })),
    ...kitaplar.map((e): FeedItem => ({
      type: 'Kitap',
      typeLabel: labels.Kitap,
      title: e.data.title,
      href: contentUrl('kitaplar', e.data.lang, e.id),
      date: new Date(e.data.year, 0, 1),
      dateLabel: String(e.data.year),
    })),
  ];

  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return items.slice(0, limit);
}
