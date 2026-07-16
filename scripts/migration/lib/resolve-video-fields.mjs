// Videolar koleksiyonunun WordPress temasına (Northeme) özel alanlarını çözer.
// Kaynak: 'northeme-post-meta' postmeta'sı, PHP serialize formatında (bkz. php-serialize.mjs).
import { categories, postmeta, postId } from './wxr.mjs';
import { phpUnserialize } from './php-serialize.mjs';

const VIDEO_TUR_MAP = {
  belgesel: 'belgesel',
  'konferans-panel': 'konferans-panel',
  'kisa-videolar': 'kısa-video',
  soylesi: 'söyleşi',
};

function extractYoutubeId(url) {
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

/**
 * @param {object} item
 * @param {object} contentOverrides - post_id -> { durationMinutes?: number }
 * @returns {{ videoTuru: string|undefined, embedUrl: string|undefined, thumbnailUrl: string|undefined,
 *             durationMinutes: number|null, warnings: string[], errors: string[] }}
 */
export function resolveVideoFields(item, contentOverrides) {
  const warnings = [];
  const errors = [];
  const id = postId(item);

  const catNicename = categories(item).find((c) => c.domain === 'nor-videolar_cat')?.nicename;
  const videoTuru = catNicename ? VIDEO_TUR_MAP[catNicename] : undefined;
  if (catNicename && !videoTuru) {
    errors.push(`Bilinmeyen video kategorisi "${catNicename}" — VIDEO_TUR_MAP'e eklenmeli`);
  } else if (!catNicename) {
    errors.push('nor-videolar_cat kategorisi yok — videoTuru belirlenemiyor');
  }

  const meta = postmeta(item)['northeme-post-meta'];
  let embedUrl;
  let thumbnailUrl;
  if (meta) {
    const data = phpUnserialize(meta);
    const rawUrl = data['northeme-work-featured-video'];
    if (rawUrl) {
      const youtubeId = extractYoutubeId(rawUrl);
      if (youtubeId) {
        embedUrl = `https://www.youtube.com/embed/${youtubeId}`;
        // WP'de video için _thumbnail_id hiç yok (Northeme teması ayrı bir mekanizma kullanıyor,
        // bkz. resolve-media.mjs notu). YouTube'un kendi ürettiği gerçek thumbnail'i kullanılıyor
        // — hqdefault.jpg her yüklenen videoda garanti var (maxresdefault eski videolarda yok
        // olabiliyor, sahte/placeholder görsel riskini önlemek için hqdefault tercih edildi).
        thumbnailUrl = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
      } else {
        errors.push(`Video URL'sinden YouTube id çıkarılamadı: "${rawUrl}"`);
      }
    } else {
      errors.push('northeme-work-featured-video boş — embedUrl belirlenemiyor');
    }
  } else {
    errors.push('northeme-post-meta yok — embedUrl/videoTuru belirlenemiyor');
  }

  // WordPress export'unda video süresi HİÇ saklanmıyor (YouTube'un kendisinde var, WP'de yok).
  // Kullanıcı onayıyla her videonun gerçek YouTube süresi (meta[itemprop=duration]) tarayıcıyla
  // okunup content-overrides.json'a durationMinutes olarak işlendi (2026-07-16).
  const durationMinutes = contentOverrides[id]?.durationMinutes ?? null;
  if (durationMinutes === null) {
    warnings.push('durationMinutes content-overrides.json\'da yok — needsManualInput');
  }

  return { videoTuru, embedUrl, thumbnailUrl, durationMinutes, warnings, errors };
}
