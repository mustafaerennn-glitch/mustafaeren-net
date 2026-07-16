// Bir içeriğin öne çıkan görselini (_thumbnail_id) çözer, dosya tipini tespit eder.
import { postId, postmeta } from './wxr.mjs';

const WEBP_CONVERT_EXTS = new Set(['jpg', 'jpeg', 'png']);
const KEEP_AS_IS_EXTS = new Set(['svg', 'gif']);

function extOf(url) {
  const match = url.match(/\.([a-z0-9]+)(?:\?.*)?$/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * @param {object} item
 * @param {Map<string, {url: string, alt: string, parentId?: string}>} attachmentsById
 * @param {object} contentOverrides - post_id -> { localImage?: string } (WP'de _thumbnail_id
 *   hiç olmayan kayıtlar için kullanıcının verdiği gerçek görsel dosyasının adı)
 * @returns {{ featuredImage: { url?: string, localPath?: string, alt: string, action: 'webp'|'keep' } | undefined, warnings: string[], errors: string[] }}
 */
export function resolveFeaturedImage(item, attachmentsById, contentOverrides = {}) {
  const warnings = [];
  const errors = [];
  const id = postId(item);
  const meta = postmeta(item);
  const thumbId = meta['_thumbnail_id'];

  const localImage = contentOverrides[id]?.localImage;
  if (!thumbId && localImage) {
    const ext = extOf(localImage);
    if (!ext) {
      errors.push(`localImage uzantısı belirlenemedi: "${localImage}" (post_id=${id})`);
      return { featuredImage: undefined, warnings, errors };
    }
    const action = WEBP_CONVERT_EXTS.has(ext) ? 'webp' : KEEP_AS_IS_EXTS.has(ext) ? 'keep' : null;
    if (!action) {
      errors.push(`localImage bilinmeyen uzantı ".${ext}": "${localImage}" (post_id=${id})`);
      return { featuredImage: undefined, warnings, errors };
    }
    return { featuredImage: { localPath: localImage, alt: '', action }, warnings, errors };
  }

  if (!thumbId) {
    warnings.push(`_thumbnail_id yok (post_id=${id}) — needsReview, sahte görsel üretilmeyecek`);
    return { featuredImage: undefined, warnings, errors };
  }

  const attachment = attachmentsById.get(thumbId);
  if (!attachment || !attachment.url) {
    errors.push(`_thumbnail_id=${thumbId} bir attachment kaydına çözülemedi (post_id=${id})`);
    return { featuredImage: undefined, warnings, errors };
  }

  const ext = extOf(attachment.url);
  if (!ext) {
    errors.push(`Görsel URL'sinden uzantı çıkarılamadı: ${attachment.url} (post_id=${id})`);
    return { featuredImage: undefined, warnings, errors };
  }

  let action;
  if (WEBP_CONVERT_EXTS.has(ext)) action = 'webp';
  else if (KEEP_AS_IS_EXTS.has(ext)) action = 'keep';
  else if (ext === 'pdf') {
    warnings.push(`Öne çıkan görsel PDF (post_id=${id}) — beklenmeyen durum, needsReview`);
    return { featuredImage: undefined, warnings, errors };
  } else {
    warnings.push(`Bilinmeyen görsel uzantısı ".${ext}" (post_id=${id}) — needsReview`);
    return { featuredImage: undefined, warnings, errors };
  }

  if (!attachment.alt) {
    warnings.push(`Öne çıkan görselin alt metni boş (post_id=${id}, ${attachment.url})`);
  }

  return {
    featuredImage: { url: attachment.url, alt: attachment.alt, action },
    warnings,
    errors,
  };
}
