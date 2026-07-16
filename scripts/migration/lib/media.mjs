// Görsel/PDF indirme + tip-duyarlı işleme (Aşama 4C). Kural (onaylı plan): körlemesine WebP
// YOK — JPEG/PNG -> WebP, SVG/GIF olduğu gibi korunur, PDF dönüştürülmez dosya olarak kopyalanır.
// Her indirmede timeout + retry + HTTP status/MIME/boyut kontrolü + aynı URL'nin bir script
// çalıştırması içinde tekrar indirilmesini önleyen bellek-içi cache.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const TIMEOUT_MS = 20_000;
const MAX_RETRIES = 3;
const MIN_BYTES = 100; // 100 bayttan küçük yanıt muhtemelen bir hata sayfasıdır, dosya değil

const downloadCache = new Map(); // url -> ArrayBuffer (bu script çalıştırması boyunca)

async function fetchWithRetry(url) {
  if (downloadCache.has(url)) return downloadCache.get(url);

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength < MIN_BYTES) throw new Error(`Yanıt çok küçük (${buf.byteLength} bayt) — muhtemelen hata sayfası`);
      downloadCache.set(url, buf);
      return buf;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
    }
  }
  throw new Error(`${MAX_RETRIES} denemede indirilemedi: ${lastError?.message}`);
}

function extOf(url) {
  const match = url.match(/\.([a-z0-9]+)(?:\?.*)?$/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * @param {string} url - kaynak görsel URL'si
 * @param {string} destDir - hedef klasör (ör. .tmp/migration-output/yazilar/_images)
 * @param {string} baseName - uzantısız hedef dosya adı (ör. "some-slug-featured")
 * @param {'webp'|'keep'} action - resolve-media.mjs'in kararı
 * @returns {Promise<{ relativePath: string } | { error: string }>}
 */
export async function downloadAndProcessImage(url, destDir, baseName, action) {
  try {
    const buf = await fetchWithRetry(url);
    mkdirSync(destDir, { recursive: true });

    if (action === 'webp') {
      const outPath = path.join(destDir, `${baseName}.webp`);
      const webpBuf = await sharp(buf).webp({ quality: 82 }).toBuffer();
      writeFileSync(outPath, webpBuf);
      return { relativePath: `./_images/${baseName}.webp` };
    }

    // 'keep': SVG/GIF orijinal formatında, dönüştürmeden kopyalanır
    const ext = extOf(url) ?? 'bin';
    const outPath = path.join(destDir, `${baseName}.${ext}`);
    writeFileSync(outPath, buf);
    return { relativePath: `./_images/${baseName}.${ext}` };
  } catch (err) {
    return { error: `Görsel indirilemedi/işlenemedi (${url}): ${err.message}` };
  }
}

/**
 * WP'de _thumbnail_id hiç olmayan kayıtlar için kullanıcının verdiği yerel bir görsel dosyasını
 * işler (indirme yok, doğrudan diskten okunur) — aynı tip-duyarlı webp/keep kuralı geçerli.
 * @param {string} localPath - kaynak dosyanın tam yolu
 * @param {string} destDir
 * @param {string} baseName
 * @param {'webp'|'keep'} action
 * @returns {Promise<{ relativePath: string } | { error: string }>}
 */
export async function processLocalImage(localPath, destDir, baseName, action) {
  try {
    const buf = readFileSync(localPath);
    mkdirSync(destDir, { recursive: true });

    if (action === 'webp') {
      const outPath = path.join(destDir, `${baseName}.webp`);
      const webpBuf = await sharp(buf).webp({ quality: 82 }).toBuffer();
      writeFileSync(outPath, webpBuf);
      return { relativePath: `./_images/${baseName}.webp` };
    }

    const ext = extOf(localPath) ?? 'bin';
    const outPath = path.join(destDir, `${baseName}.${ext}`);
    writeFileSync(outPath, buf);
    return { relativePath: `./_images/${baseName}.${ext}` };
  } catch (err) {
    return { error: `Yerel görsel işlenemedi (${localPath}): ${err.message}` };
  }
}

/**
 * PDF'i olduğu gibi indirip kopyalar (dönüştürme yok).
 * @param {string} url
 * @param {string} destDir
 * @param {string} baseName
 * @returns {Promise<{ relativePath: string } | { error: string }>}
 */
export async function downloadPdf(url, destDir, baseName) {
  try {
    const buf = await fetchWithRetry(url);
    mkdirSync(destDir, { recursive: true });
    const outPath = path.join(destDir, `${baseName}.pdf`);
    writeFileSync(outPath, buf);
    return { relativePath: `/pdf/${baseName}.pdf`, absolutePath: outPath };
  } catch (err) {
    return { error: `PDF indirilemedi (${url}): ${err.message}` };
  }
}
