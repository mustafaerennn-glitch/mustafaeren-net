import { getCollection } from 'astro:content';
import { contentUrl, type Locale } from '../i18n/routes';

export type AlanTipQuery = 'yazi' | 'basinda' | 'video' | 'kitap';
export const ALAN_TIP_QUERIES: AlanTipQuery[] = ['yazi', 'basinda', 'video', 'kitap'];

export interface AlanHubItem {
  tip: 'Yazı' | 'Basında' | 'Video' | 'Kitap';
  tipQuery: AlanTipQuery;
  title: string;
  href: string;
  date: Date;
  topicId: string;
  mecraId?: string;
}

// Alan Hub sayfalarının (Yazı/Basında/Video/Kitap birleşik akışı) ortak veri katmanı —
// önceden [alan].astro dosyalarının her birine kopyalanmış aynı mantık buraya taşındı.
export async function buildAlanHubItems(alan: string, lang: Locale): Promise<AlanHubItem[]> {
  const topics = await getCollection('topics');
  const topicIdsInAlan = new Set(topics.filter((tp) => tp.data.alan === alan).map((tp) => tp.id));

  const [yazilar, basinda, videolar, kitaplar] = await Promise.all([
    getCollection('yazilar', (e) => e.data.lang === lang),
    getCollection('basinda', (e) => e.data.lang === lang),
    getCollection('videolar', (e) => e.data.lang === lang),
    getCollection('kitaplar', (e) => e.data.lang === lang),
  ]);

  function entryAlanTopics(entryTopics: { id: string }[]): string[] {
    return entryTopics.map((tp) => tp.id).filter((id) => topicIdsInAlan.has(id));
  }

  const items: AlanHubItem[] = [];
  for (const e of yazilar) {
    const matches = entryAlanTopics(e.data.topics);
    if (matches.length) {
      items.push({
        tip: 'Yazı',
        tipQuery: 'yazi',
        title: e.data.title,
        href: contentUrl('yazilar', e.data.lang, e.id),
        date: e.data.publishDate,
        topicId: matches[0],
        mecraId: e.data.mecra?.id,
      });
    }
  }
  for (const e of basinda) {
    const matches = entryAlanTopics(e.data.topics);
    if (matches.length) {
      items.push({
        tip: 'Basında',
        tipQuery: 'basinda',
        title: e.data.title,
        href: contentUrl('basinda', e.data.lang, e.id),
        date: e.data.publishDate,
        topicId: matches[0],
        mecraId: e.data.mecra.id,
      });
    }
  }
  for (const e of videolar) {
    const matches = entryAlanTopics(e.data.topics);
    if (matches.length) {
      items.push({
        tip: 'Video',
        tipQuery: 'video',
        title: e.data.title,
        href: contentUrl('videolar', e.data.lang, e.id),
        date: e.data.publishDate,
        topicId: matches[0],
        mecraId: e.data.mecra?.id,
      });
    }
  }
  for (const e of kitaplar) {
    const matches = entryAlanTopics(e.data.topics);
    if (matches.length) {
      items.push({
        tip: 'Kitap',
        tipQuery: 'kitap',
        title: e.data.title,
        href: contentUrl('kitaplar', e.data.lang, e.id),
        date: new Date(e.data.year, 0, 1),
        topicId: matches[0],
      });
    }
  }
  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return items;
}
