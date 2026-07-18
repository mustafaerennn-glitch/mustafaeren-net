import { getCollection, type CollectionEntry } from 'astro:content';
import { contentUrl, type Locale } from '../i18n/routes';

// URL'de kullanılacak ASCII-güvenli tür slug'ları — diğer slug'larla (alan, konu) aynı
// de-aksanlı kebab-case kural.
export const KITAP_TURU_SLUGS: Record<string, string> = {
  yazdıklarım: 'yazdiklarim',
  editörlük: 'editorluk',
  katkılar: 'katkilar',
};

export const KITAP_TURU_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(KITAP_TURU_SLUGS).map(([tur, slug]) => [slug, tur]),
);

export const KITAP_TURU_LABELS_I18N: Record<Locale, Record<string, string>> = {
  tr: { yazdıklarım: 'Yazdıklarım', editörlük: 'Editörlük', katkılar: 'Katkılar' },
  en: { yazdıklarım: 'My Writing', editörlük: 'Edited', katkılar: 'Contributions' },
  de: { yazdıklarım: 'Eigene Texte', editörlük: 'Herausgeberschaft', katkılar: 'Beiträge' },
  fr: { yazdıklarım: 'Mes écrits', editörlük: 'Direction éditoriale', katkılar: 'Contributions' },
};

export async function buildKitaplarEntries(lang: Locale): Promise<CollectionEntry<'kitaplar'>[]> {
  return (
    await getCollection(
      'kitaplar',
      (e) => e.data.lang === lang || (e.data.digerDillerdeGoster ?? []).includes(lang),
    )
  ).sort((a, b) => b.data.year - a.data.year);
}

// Bir kitap kartının hedefi — çapraz listelenmiş (kendi `lang`'ı dışında bir
// sekmede de görünen) kayıtlarda kart, o kaydın GERÇEK diline ait sayfaya
// gitmeli, o an görüntülenen sekmenin diline değil.
export function kitapHref(entry: CollectionEntry<'kitaplar'>): string {
  return contentUrl('kitaplar', entry.data.lang, entry.id);
}
