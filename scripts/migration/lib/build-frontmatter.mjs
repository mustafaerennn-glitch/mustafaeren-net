// Bir kaydın çözümlenmiş alanlarından, hedef Astro şemasına birebir uyan sıralı bir frontmatter
// nesnesi kurar VE anında doğrular (onaylı plan kuralı: geçersiz kayıt DOSYAYA YAZILMAZ,
// reports/migration-issues.csv'ye düşer). Alan sırası koleksiyon örnek dosyalarıyla (src/content/
// */ornek-*.md) tutarlı tutuluyor — okunabilirlik ve deterministik çıktı için.

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * @param {object} r - migrate-wordpress.mjs'in 2. geçiş kaydı (topics/mecra/sources/vb. dahil)
 * @param {{ relativePath: string } | undefined} image - featuredImage/thumbnail/kapak çözümü
 * @param {string | undefined} pdfPath - downloadPdf() çıktısı (/pdf/... veya undefined)
 * @param {string} description
 * @param {Set<string>} validTopicIds
 * @param {Set<string>} validMecraIds
 * @returns {{ frontmatter: object, errors: string[] }}
 */
export function buildFrontmatter(r, image, pdfPath, description, validTopicIds, validMecraIds) {
  const errors = [];

  if (!isNonEmptyString(r.slug)) errors.push('slug boş');
  if (!isNonEmptyString(r.title)) errors.push('title boş');
  if (!isNonEmptyString(description)) errors.push('description boş');
  if (!r.topics || r.topics.length === 0) errors.push('topics boş (en az 1 gerekli)');
  for (const t of r.topics ?? []) {
    if (!validTopicIds.has(t)) errors.push(`geçersiz topic id: "${t}"`);
  }
  if (r.mecra && !validMecraIds.has(r.mecra)) errors.push(`geçersiz mecra id: "${r.mecra}"`);

  const common = {
    title: r.title,
    lang: r.lang,
    description,
    topics: r.topics,
  };
  if (r.translationTarget?.length) common.translations = r.translationTarget;

  let specific = {};
  if (r.proposedCollection === 'yazilar') {
    if (!image) errors.push('featuredImage yok (needsReview)');
    specific = {
      publishDate: r.publishDate,
      ...(r.mecra ? { mecra: r.mecra } : {}),
      featuredImage: image?.relativePath,
      featuredImageAlt: r.featuredImage?.alt ?? '',
      ...(pdfPath ? { pdf: pdfPath } : {}),
    };
  } else if (r.proposedCollection === 'basinda') {
    if (!isNonEmptyString(r.mecra)) errors.push('mecra boş (Basında için zorunlu)');
    if (!image) errors.push('featuredImage yok (needsReview)');
    specific = {
      publishDate: r.publishDate,
      mecra: r.mecra,
      featuredImage: image?.relativePath,
      featuredImageAlt: r.featuredImage?.alt ?? '',
      ...(r.sources ? { sources: r.sources } : {}),
      ...(pdfPath ? { pdf: pdfPath } : {}),
    };
  } else if (r.proposedCollection === 'videolar') {
    if (!isNonEmptyString(r.videoTuru)) errors.push('videoTuru boş');
    if (!isNonEmptyString(r.embedUrl)) errors.push('embedUrl boş');
    if (!(Number.isInteger(r.durationMinutes) && r.durationMinutes > 0)) errors.push('durationMinutes geçersiz/eksik (needsReview)');
    if (!image) errors.push('thumbnail yok (needsReview)');
    specific = {
      publishDate: r.publishDate,
      videoTuru: r.videoTuru,
      embedUrl: r.embedUrl,
      ...(r.mecra ? { mecra: r.mecra } : {}),
      durationMinutes: r.durationMinutes,
      thumbnail: image?.relativePath,
      thumbnailAlt: r.featuredImage?.alt ?? '',
    };
  } else if (r.proposedCollection === 'kitaplar') {
    if (!Number.isInteger(r.year)) errors.push('year geçersiz/eksik');
    if (!isNonEmptyString(r.kitapTuru)) errors.push('kitapTuru boş');
    if (!isNonEmptyString(r.yayinevi)) errors.push('yayinevi boş (needsReview)');
    if (!(Number.isInteger(r.sayfaSayisi) && r.sayfaSayisi > 0)) errors.push('sayfaSayisi eksik (needsReview — kullanıcı kararıyla şimdilik atlandı)');
    if (!image) errors.push('kapak yok (needsReview)');
    specific = {
      year: r.year,
      kitapTuru: r.kitapTuru,
      yayinevi: r.yayinevi,
      ...(r.yayineviUrl ? { yayineviUrl: r.yayineviUrl } : {}),
      sayfaSayisi: r.sayfaSayisi,
      kapak: image?.relativePath,
      kapakAlt: r.featuredImage?.alt ?? '',
      ...(pdfPath ? { pdf: pdfPath } : {}),
    };
  } else {
    errors.push(`bilinmeyen koleksiyon: ${r.proposedCollection}`);
  }

  return { frontmatter: { ...common, ...specific }, errors };
}
