import { getCollection, type CollectionEntry } from 'astro:content';

export const ALAN_LABELS: Record<string, string> = {
  hapishane: 'Hapishane',
  'siyasi-tarih': 'Siyasi Tarih',
  goc: 'Göç',
  emek: 'Emek',
  diger: 'Diğer',
};

export const ALAN_SLUGS = Object.keys(ALAN_LABELS);

type TopicRef = { id: string };

/**
 * Bir içeriğin taşıdığı `topics` referanslarından, `topics.json`'daki konu→alan eşlemesi
 * üzerinden build-time'da alan üyeliğini türetir (talimat: alan içerikte doğrudan tutulmaz).
 * Bir içerik birden fazla alana ait konular taşıyorsa birden fazla alan slug'ı döner.
 */
export async function getAreasForTopicRefs(topicRefs: TopicRef[]): Promise<string[]> {
  const topics = await getCollection('topics');
  const alanSet = new Set<string>();
  for (const ref of topicRefs) {
    const topic = topics.find((t) => t.id === ref.id);
    if (topic) alanSet.add(topic.data.alan);
  }
  return [...alanSet];
}

export async function getTopicLabel(topicId: string): Promise<string | undefined> {
  const topics = await getCollection('topics');
  return topics.find((t) => t.id === topicId)?.data.ad;
}

export async function getTopicsMap(): Promise<Map<string, CollectionEntry<'topics'>>> {
  const topics = await getCollection('topics');
  return new Map(topics.map((t) => [t.id, t]));
}

/** Her alan için, o alana ait en az bir konu taşıyan içerik sayısı (4 koleksiyon toplamı, TR). */
export async function getAreaCounts(): Promise<Record<string, number>> {
  const [yazilar, basinda, videolar, kitaplar, topics] = await Promise.all([
    getCollection('yazilar', (e) => e.data.lang === 'tr'),
    getCollection('basinda', (e) => e.data.lang === 'tr'),
    getCollection('videolar', (e) => e.data.lang === 'tr'),
    getCollection('kitaplar', (e) => e.data.lang === 'tr'),
    getCollection('topics'),
  ]);
  const topicToAlan = new Map(topics.map((t) => [t.id, t.data.alan]));
  const counts: Record<string, number> = Object.fromEntries(ALAN_SLUGS.map((s) => [s, 0]));

  for (const entry of [...yazilar, ...basinda, ...videolar, ...kitaplar]) {
    const alanSet = new Set<string>();
    for (const ref of entry.data.topics as TopicRef[]) {
      const alan = topicToAlan.get(ref.id);
      if (alan) alanSet.add(alan);
    }
    for (const alan of alanSet) counts[alan] = (counts[alan] ?? 0) + 1;
  }

  return counts;
}
