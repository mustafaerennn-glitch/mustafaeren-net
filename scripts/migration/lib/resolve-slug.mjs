// Koleksiyon içi benzersiz slug'lar üretir. Kural (onaylı plan): wp:post_name korunur,
// otomatik "düzeltme" yapılmaz — yalnızca aynı koleksiyonda gerçek bir çakışma varsa
// -{lang} eki eklenir (deneme-yazisi / deneme-yazisi-en örneğindeki gibi); o da yetmezse
// -{postId} eklenip warning olarak raporlanır. Boş slug HATA'dır, otomatik üretilmez.

/**
 * @param {Array<{ postId: string, wpSlug: string, lang: string, collection: string }>} records
 * @returns {{ slugByPostId: Map<string, string>, warnings: string[], errors: string[] }}
 */
export function resolveSlugs(records) {
  const warnings = [];
  const errors = [];
  const slugByPostId = new Map();
  const takenByCollection = new Map(); // collection -> Set<slug>

  for (const record of records) {
    const { postId, wpSlug, lang, collection } = record;
    if (!collection) continue; // migre edilmeyecek kayıt, slug gerekmiyor

    if (!wpSlug) {
      errors.push(`Boş wp:post_name (post_id=${postId}) — slug elle belirlenmeli`);
      continue;
    }

    const taken = takenByCollection.get(collection) ?? new Set();
    takenByCollection.set(collection, taken);

    let candidate = wpSlug;
    if (taken.has(candidate)) {
      candidate = `${wpSlug}-${lang}`;
      warnings.push(`Slug çakışması: "${wpSlug}" zaten kullanılıyor, "${candidate}" olarak değiştirildi (post_id=${postId})`);
      if (taken.has(candidate)) {
        candidate = `${wpSlug}-${lang}-${postId}`;
        warnings.push(`"${wpSlug}-${lang}" de çakıştı, "${candidate}" kullanıldı (post_id=${postId}) — elle gözden geçir`);
      }
    }

    taken.add(candidate);
    slugByPostId.set(postId, candidate);
  }

  return { slugByPostId, warnings, errors };
}
