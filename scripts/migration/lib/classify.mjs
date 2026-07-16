// Bir WordPress item'ının hangi Astro koleksiyonuna (ya da hiçbirine) gideceğini belirler.
import { postType, status, categoryNicenames, title, postId } from './wxr.mjs';

const LANG_CATS = new Set(['english', 'deutsch', 'francais']);
const TYPE_CATS = new Set(['yazilar', 'soylesiler']);
const LANG_BY_CAT = { english: 'en', deutsch: 'de', francais: 'fr' };

/**
 * @param {object} item
 * @param {object} contentOverrides - post_id -> { collection?, mecra?, extraTopics? }
 * @returns {{ collection: 'yazilar'|'basinda'|'videolar'|'kitaplar'|null, lang: string, reason: string }}
 */
export function classifyItem(item, contentOverrides) {
  const pt = postType(item);
  const st = status(item);
  const id = postId(item);
  const override = contentOverrides[id];

  if (pt === 'nor-videolar') {
    if (st !== 'publish') return { collection: null, lang: 'tr', reason: 'video taslak/yayında değil' };
    return { collection: 'videolar', lang: 'tr', reason: 'nor-videolar' };
  }

  if (pt === 'nor-portfolio') {
    if (st !== 'publish') return { collection: null, lang: 'tr', reason: 'kitap taslak/yayında değil' };
    return { collection: 'kitaplar', lang: 'tr', reason: 'nor-portfolio' };
  }

  if (pt !== 'post') {
    return { collection: null, lang: 'tr', reason: `post_type=${pt} — içerik değil (menü/tema/spam/vb.)` };
  }
  if (st !== 'publish') {
    return { collection: null, lang: 'tr', reason: `status=${st} — taslak/spam` };
  }

  const cats = new Set(categoryNicenames(item));
  const hasType = [...cats].find((c) => TYPE_CATS.has(c));
  const langCat = [...cats].find((c) => LANG_CATS.has(c));
  const lang = langCat ? LANG_BY_CAT[langCat] : 'tr';

  // 1) content-overrides.json — 27 parçalık elle sınıflandırma (dil kategorili ama tip
  //    kategorisiz parçalar için) buradan geliyor.
  if (override?.collection) {
    return { collection: override.collection, lang, reason: 'content-overrides.json' };
  }

  // 2) Kategori tabanlı — WP'nin kendi yazilar/soylesiler etiketi
  if (hasType === 'yazilar') return { collection: 'yazilar', lang, reason: 'kategori: yazilar' };
  if (hasType === 'soylesiler') return { collection: 'basinda', lang, reason: 'kategori: soylesiler' };

  // 3) Ne tip ne override var — muhtemelen menü/tema kalıntısı bir "post", ya da elimizden
  //    kaçmış bir dil-kategorili parça (content-overrides.json'a eklenmesi gerekir).
  return {
    collection: null,
    lang,
    reason: `tip kategorisi yok, content-overrides.json'da da yok — [${title(item)}] (post_id=${id}) incelenmeli`,
  };
}
