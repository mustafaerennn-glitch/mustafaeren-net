// Genel/indeks sayfaları için dil → gerçek URL eşlemesi.
// Her sayfa kendi diline göre farklı bir slug taşıyabilir (örn. /hakkimda/ vs /en/about/),
// bu yüzden Astro'nun otomatik aynı-slug locale routing'i yerine bu merkezi kayıt kullanılır.
// hreflang/canonical/dil değiştirici hepsi bu tek kaynaktan üretilir.

export const routes = {
  hakkimda: {
    tr: '/hakkimda/',
    en: '/en/about/',
    de: '/de/ueber-mich/',
    fr: '/fr/a-propos/',
  },
} as const;

export type RouteKey = keyof typeof routes;
export type Locale = 'tr' | 'en' | 'de' | 'fr';

// İçerik detay sayfaları için dil bazlı URL üretimi (TR varsayılan, prefix yok).
// Bu spike'ta yalnızca teknik mekanizmayı doğrulamak amaçlı basit bir kural —
// Faz 2C'de nihai URL segment isimlendirmesi (örn. "yazılar" kelimesinin İngilizcesi) ayrıca kararlaştırılacak.
export function contentUrl(collection: string, lang: string, id: string): string {
  if (lang === 'tr') return `/${collection}/${id}/`;
  return `/${lang}/${collection}/${id}/`;
}

// Meta-cluster / dil cluster'ındaki tam dil adları (etiketsiz, yan yana gösterim — bkz. roadmap).
export const LANG_NAMES: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
};
