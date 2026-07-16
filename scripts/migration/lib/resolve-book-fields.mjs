// Kitaplar koleksiyonunun WordPress temasına (Northeme) özel alanlarını çözer.
// Kaynak: 'northeme-post-meta' postmeta'sı (PHP serialize) + 'northeme-array-work-customs'
// içindeki serbest metin etiket/değer çiftleri (Yazar, Yayın/Basım Tarihi, Link — etiket
// adları tutarlı değil, bu yüzden normalize edilmiş anahtarlarla eşleştiriliyor).
import { categories, postmeta, bodyHtml, postId } from './wxr.mjs';
import { phpUnserialize } from './php-serialize.mjs';

const KITAP_TUR_MAP = {
  yazdiklarim: 'yazdıklarım',
  editorluk: 'editörlük',
};

// Yayınevi adı WordPress'te hiç saklanmıyor, yalnızca bir kaynak "Link" var. Kullanıcı bu
// linklerin gerçek yayınevini doğrudan onayladı (2026-07-16): cisst.org.tr ve academia.edu
// (CİSST'in kendi proje raporları) -> "CİSST"; yaykoop.com -> "Kalkedon Yayınları".
const YAYINEVI_BY_DOMAIN = {
  'cisst.org.tr': 'CİSST',
  'academia.edu': 'CİSST',
  'www.academia.edu': 'CİSST',
  'yaykoop.com': 'Kalkedon Yayınları',
  'www.yaykoop.com': 'Kalkedon Yayınları',
};

function resolveYayinevi(link) {
  if (!link) return undefined;
  try {
    return YAYINEVI_BY_DOMAIN[new URL(link).hostname] ?? undefined;
  } catch {
    return undefined;
  }
}

function normalizeCustoms(customs) {
  const out = {};
  if (!customs) return out;
  for (const entry of Object.values(customs)) {
    const key = entry.name.trim().toLowerCase();
    if (key.startsWith('yazar')) out.yazar = entry.val;
    else if (key.includes('tarih')) out.tarih = entry.val; // "Yayın Tarihi" / "Basım Tarihi"
    else if (key === 'link') out.link = entry.val;
  }
  return out;
}

/** "Temmuz 2016" / "2016" / "Şubat 2012" gibi serbest metinden yıl çıkarır. */
function extractYear(text) {
  if (!text) return undefined;
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}

// Her kitabın kendi WordPress gövdesi, "Eser Adı / Yazar / Basım Tarihi / Sayfa Sayısı" gibi bir
// künye bloğuyla başlıyor (WP editöründe kalın etiket + &nbsp; + değer olarak yazılmış). Bu
// yüzden postmeta'da hiç saklanmayan sayfa sayısı, gövde metninden gerçek veri olarak okunabiliyor
// — 18 kitabın 18'inde de doğrulandı (2026-07-16), uydurma/tahmin değil.
function extractPageCount(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
  const match = text.match(/Sayfa\s*Say[ıi]s[ıi]\s*:\s*(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

/**
 * @param {object} item
 * @param {object} contentOverrides - post_id -> { sayfaSayisi?: number } (kullanıcı doğrulaması
 *   gövde metninden çıkarılan değerle çelişirse öncelik burada)
 * @returns {{ kitapTuru: string|undefined, year: number|undefined, yayineviUrl: string|undefined,
 *             yazar: string|undefined, yayinevi: string|null, sayfaSayisi: number|null,
 *             warnings: string[], errors: string[] }}
 */
export function resolveBookFields(item, contentOverrides = {}) {
  const warnings = [];
  const errors = [];
  const id = postId(item);

  const catNicename = categories(item).find((c) => c.domain === 'nor-portfolio_cat')?.nicename;
  const kitapTuru = catNicename ? KITAP_TUR_MAP[catNicename] : undefined;
  if (catNicename && !kitapTuru) {
    errors.push(`Bilinmeyen kitap kategorisi "${catNicename}" — KITAP_TUR_MAP'e eklenmeli`);
  } else if (!catNicename) {
    errors.push('nor-portfolio_cat kategorisi yok — kitapTuru belirlenemiyor');
  }

  const meta = postmeta(item)['northeme-post-meta'];
  let yazar, tarih, link;
  if (meta) {
    const data = phpUnserialize(meta);
    const normalized = normalizeCustoms(data['northeme-array-work-customs']);
    yazar = normalized.yazar;
    tarih = normalized.tarih;
    link = normalized.link;
  } else {
    errors.push('northeme-post-meta yok — kitap alanları belirlenemiyor');
  }

  const year = extractYear(tarih);
  if (tarih && !year) warnings.push(`Tarih metninden yıl çıkarılamadı: "${tarih}"`);

  const yayinevi = resolveYayinevi(link) ?? null;
  if (!yayinevi) {
    warnings.push(`Yayınevi domain'den çözülemedi: "${link}" — needsManualInput`);
  }

  const bodyExtractedPageCount = extractPageCount(bodyHtml(item));
  const overridePageCount = contentOverrides[id]?.sayfaSayisi;
  const sayfaSayisi = overridePageCount ?? bodyExtractedPageCount ?? null;
  if (overridePageCount && bodyExtractedPageCount && overridePageCount !== bodyExtractedPageCount) {
    warnings.push(`sayfaSayisi: kullanıcı doğrulaması (${overridePageCount}) gövde metninden çıkarılan değerden (${bodyExtractedPageCount}) farklı — kullanıcı değeri esas alındı`);
  }
  if (!sayfaSayisi) {
    warnings.push('sayfaSayisi gövde metninden çıkarılamadı — needsManualInput');
  }

  return {
    kitapTuru,
    year,
    yayineviUrl: link,
    yazar, // şemada karşılığı yok, yalnızca referans/rapor amaçlı
    yayinevi,
    sayfaSayisi,
    warnings,
    errors,
  };
}
