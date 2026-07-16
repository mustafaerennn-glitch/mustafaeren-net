// `description` alanını (index kartı + meta description kaynağı, ZORUNLU) çözer.
// Kaynak önceliği: WordPress excerpt:encoded (gerçek anlamlı bir özet varsa) -> yoksa
// Markdown gövdesinden otomatik türetilmiş kısa özet (kelime sınırında kesilmiş).
// 171 gerçek kayıttan yalnızca 61'inde anlamlı (>20 karakter) bir excerpt vardı — geri kalanı
// otomatik türetiliyor (uydurma değil, gövdenin kendisinden alınan gerçek metin).
import { cdata, postId } from './wxr.mjs';

const MAX_LENGTH = 160;
const BARE_URL_RE = /^https?:\/\/\S+$/i;
// Northeme temasının bazı nor-portfolio (Kitaplar) kayıtlarında excerpt hiç doldurulmamış,
// tema demo içeriğinden kalma Lorem Ipsum metni olduğu gibi kalmış (gerçek veri değil, 3
// kitapta bulundu — 2026-07-16). Bunu gerçek bir özet gibi kullanmamak için tespit ediliyor.
const LOREM_IPSUM_RE = /\b(lorem ipsum|dolor sit amet|consectetur adipiscing|nullam|phasellus|vestibulum ante|vivamus id|mauris hendrerit)\b/i;

function stripMarkdown(markdown) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // görseller
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // linkler -> yalnızca metin
    .replace(/<[^>]+>/g, '') // kalan ham HTML (iframe/script vb.)
    .replace(/[#*_>`~-]/g, '') // markdown biçimlendirme karakterleri
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateAtWordBoundary(text, maxLength) {
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}

/**
 * @param {object} item
 * @param {string} markdown - htmlToMarkdown() çıktısı
 * @param {object} contentOverrides - post_id -> { description?: string } (ör. videolar için
 *   WP gövdesi yalnızca bir video linkinden ibaret olduğunda gerçek YouTube açıklaması)
 * @returns {{ description: string, warnings: string[] }}
 */
export function resolveDescription(item, markdown, contentOverrides = {}) {
  const warnings = [];
  const id = postId(item);

  const overrideDescription = contentOverrides[id]?.description;
  if (overrideDescription) {
    return { description: truncateAtWordBoundary(overrideDescription, MAX_LENGTH), warnings };
  }

  const excerptHtml = cdata(item['excerpt:encoded']);
  const excerptText = excerptHtml ? stripMarkdown(excerptHtml) : '';

  if (excerptText.length > 20 && LOREM_IPSUM_RE.test(excerptText)) {
    warnings.push(`WordPress excerpt'i Lorem Ipsum tema demo metni — göz ardı edildi: "${excerptText.slice(0, 60)}…"`);
  } else if (excerptText.length > 20) {
    return { description: truncateAtWordBoundary(excerptText, MAX_LENGTH), warnings };
  }

  const bodyText = stripMarkdown(markdown);
  // Bazı gövdeler (ör. Videolar — WP'de yalnızca bir video linkinden ibaret) çıplak bir URL'den
  // başka bir şey içermiyor. Bunu description olarak kullanmak anlamsız/bozuk görünür —
  // needsManualInput'a düşürülüyor, uydurma bir cümle üretilmiyor.
  if (!bodyText || BARE_URL_RE.test(bodyText)) {
    warnings.push('description üretilemedi: excerpt/gövde yok ya da yalnızca çıplak bir URL — needsManualInput');
    return { description: '', warnings };
  }
  warnings.push('description WordPress excerpt\'inden değil, gövde metninden otomatik türetildi — gözden geçirilmeli');
  return { description: truncateAtWordBoundary(bodyText, MAX_LENGTH), warnings };
}
