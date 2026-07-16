import { getCollection } from 'astro:content';

export interface ContentAvailability {
  yazilar: boolean;
  basinda: boolean;
  videolar: boolean;
  kitaplar: boolean;
}

/**
 * Bir dilde her koleksiyonda en az 1 gerçek girdi var mı — Nav'da o dile ait menü öğesini
 * göstermek/gizlemek için kullanılır (talimat: bir dilde hiç içerik yoksa menü öğesi
 * gösterilmez, boş sayfaya ya da başka dile yönlendirme yapılmaz).
 */
export async function getContentAvailability(lang: string): Promise<ContentAvailability> {
  const [yazilar, basinda, videolar, kitaplar] = await Promise.all([
    getCollection('yazilar', (e) => e.data.lang === lang),
    getCollection('basinda', (e) => e.data.lang === lang),
    getCollection('videolar', (e) => e.data.lang === lang),
    getCollection('kitaplar', (e) => e.data.lang === lang),
  ]);
  return {
    yazilar: yazilar.length > 0,
    basinda: basinda.length > 0,
    videolar: videolar.length > 0,
    kitaplar: kitaplar.length > 0,
  };
}
