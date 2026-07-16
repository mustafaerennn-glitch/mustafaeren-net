import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from './routes';

// Yalnızca `translations` alanı taşıyabilen (dolayısıyla çok dilli) koleksiyonlar.
type TranslatableCollection = 'yazilar' | 'basinda' | 'videolar' | 'kitaplar';

export interface TranslationClusterItem {
  lang: Locale;
  slug: string;
  title: string;
}

/**
 * Dil cluster'ını hem ileri (TR girdisi → translations) hem geri (EN/DE/FR girdisi,
 * kendi translations'ı yok ama başka bir girdinin translations'ında referans ediliyor)
 * yönde çözer. Model "tek yönlü referans" olduğu için (yalnızca ana dil girdisi
 * translations taşır), önce "kök" girdi bulunur, sonra kök + onun tüm çevirileri
 * cluster olarak döndürülür.
 */
export async function getTranslationCluster<C extends TranslatableCollection>(
  collection: C,
  entry: CollectionEntry<C>,
): Promise<TranslationClusterItem[]> {
  const all = (await getCollection(collection)) as CollectionEntry<C>[];

  let root = entry;
  const hasOwnTranslations = (entry.data as { translations?: unknown[] }).translations?.length;
  if (!hasOwnTranslations) {
    const pointingToThis = all.find((candidate) =>
      ((candidate.data as { translations?: { id: string }[] }).translations ?? []).some(
        (ref) => ref.id === entry.id,
      ),
    );
    if (pointingToThis) root = pointingToThis;
  }

  const cluster: TranslationClusterItem[] = [
    { lang: root.data.lang as Locale, slug: root.id, title: root.data.title as string },
  ];

  const refs = (root.data as { translations?: { id: string }[] }).translations ?? [];
  for (const ref of refs) {
    const target = all.find((candidate) => candidate.id === ref.id);
    if (target) {
      cluster.push({ lang: target.data.lang as Locale, slug: target.id, title: target.data.title as string });
    }
  }

  return cluster;
}
