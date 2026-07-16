// Bir "Basında" parçasının hangi mecrada yayımlandığını çözer.
// Öncelik sırası (onaylı plan, Aşama 4B): content-overrides -> kategori/tip ->
// gövde dış-link domaini -> tag-mecra-map -> başlık/gövde metin kanıtı -> needsReview.
// Not: "başlık/gövde metin kanıtı" adımı bu script'te otomatik metin taraması YAPMAZ —
// bu oturumda elle bulunan örnekler (ör. BirGün) zaten content-overrides.json'a birinci
// öncelikli override olarak girildi. Otomatik metin araması yanlış-pozitif riski taşıdığı
// için burada kasıtlı olarak uygulanmadı.
import { tags, postId, bodyHtml } from './wxr.mjs';

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** mecralar.json listesinden domain -> mecra id haritası kurar (url'i olmayanlar atlanır). */
export function buildDomainMap(mecralarList) {
  const map = new Map();
  for (const mecra of mecralarList) {
    if (!mecra.url) continue;
    const domain = extractDomain(mecra.url);
    if (domain) map.set(domain, mecra.id);
  }
  return map;
}

/**
 * @param {object} item
 * @param {string} collection - classifyItem() sonucu
 * @param {object} contentOverrides - post_id -> { mecra?: string }
 * @param {Map<string, string>} domainMap - buildDomainMap() çıktısı
 * @param {Record<string, string>} tagMecraMap - etiket adı -> mecra id
 * @param {Set<string>} validMecraIds - mecralar.json'daki gerçek id'ler
 * @returns {{ mecra: string|undefined, warnings: string[], errors: string[] }}
 */
export function resolveMecra(item, collection, contentOverrides, domainMap, tagMecraMap, validMecraIds) {
  const warnings = [];
  const errors = [];
  const id = postId(item);

  // 2) Basında'da mecra ZORUNLU. Videolar'da opsiyonel ama gerçek veri varsa (ör. "Kanal Adı"
  // etiketi) faydalı olduğu için o da denenir. Yazılar/Kitaplar'da mecra alanı yok/anlamsız.
  if (collection !== 'basinda' && collection !== 'videolar') {
    return { mecra: undefined, warnings, errors };
  }

  // 1) content-overrides.json — en yüksek öncelik.
  const overrideMecra = contentOverrides[id]?.mecra;
  if (overrideMecra) {
    if (!validMecraIds.has(overrideMecra)) {
      errors.push(`content-overrides.json mecra "${overrideMecra}" mecralar.json'da yok (post_id=${id})`);
      return { mecra: undefined, warnings, errors };
    }
    return { mecra: overrideMecra, warnings, errors };
  }

  // 3) Gövdedeki dış link domaini — yalnızca tek bir farklı mecra domaini varsa güvenilir.
  const html = bodyHtml(item);
  const linkDomains = new Set();
  for (const match of html.matchAll(/href="(https?:\/\/[^"]+)"/gi)) {
    const domain = extractDomain(match[1]);
    if (domain && domainMap.has(domain)) linkDomains.add(domainMap.get(domain));
  }
  if (linkDomains.size === 1) {
    return { mecra: [...linkDomains][0], warnings, errors };
  }
  if (linkDomains.size > 1) {
    warnings.push(`Gövdede birden fazla farklı mecra domaini var (post_id=${id}): ${[...linkDomains].join(', ')} — etiket eşleşmesine geçildi`);
  }

  // 4) tag-mecra-map.json etiket eşleşmesi.
  const itemTags = tags(item);
  const tagMatches = new Set();
  for (const tag of itemTags) {
    const mecraId = tagMecraMap[tag];
    if (mecraId) tagMatches.add(mecraId);
  }
  if (tagMatches.size === 1) {
    return { mecra: [...tagMatches][0], warnings, errors };
  }
  if (tagMatches.size > 1) {
    warnings.push(`Birden fazla mecra etiketi bulundu (post_id=${id}): ${[...tagMatches].join(', ')} — sources[] otomatik üretilmiyor, needsReview'a düşüyor`);
  }

  // 6) Hiçbiri çözemedi.
  warnings.push(`Mecra çözülemedi (post_id=${id}) — needsReview`);
  return { mecra: undefined, warnings, errors };
}
