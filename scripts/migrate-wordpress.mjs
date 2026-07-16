#!/usr/bin/env node
// WordPress WXR export -> Astro content collection analizi + (opsiyonel) kontrollü üretim.
// Varsayılan mod: dry-run — 171 gerçek kaydın TAMAMI ayrıştırılıp doğrulanır, HİÇBİR DOSYA
// yazılmaz. `--produce` ile Aşama 4C çalışır: 0-hatalı kayıtlar için gerçek Markdown dosyaları
// + tip-duyarlı işlenmiş görseller `.tmp/migration-output/`'a yazılır (src/content/'e DEĞİL —
// bu yalnızca Aşama 4D'nin işi). Anlık doğrulamada hata veren kayıtlar YAZILMAZ, plan kuralı
// gereği reports/migration-produce-issues.csv'ye düşer.
//
// Kapsam notu: Yazılar ve Basında (130 post) bu script'te tam kapsamlı analiz ediliyor —
// mecra çözümü, topic çözümü, çeviri eşleştirmesi, HTML->Markdown, iç link yeniden yazımı.
// Videolar (23) ve Kitaplar (18), WordPress temasının 'northeme-post-meta' alanında
// SERIALIZED PHP formatında sakladığı özel alanlara (embedUrl/videoTuru/süre, yazar/yayınevi/
// sayfa sayısı) sahip; php-serialize.mjs bunu çözüyor. Video süresi ve kitap yayınevi/sayfa
// sayısı WordPress'te hiç saklanmıyordu — kullanıcı onaylı gerçek veriyle (YouTube/yayınevi
// kaynağı) content-overrides.json / resolve-book-fields.mjs üzerinden dolduruldu (bkz. rapor).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  parseWxr,
  postType,
  status,
  postId,
  title,
  slug,
  postDate,
  bodyHtml,
  link,
  indexAttachments,
} from './migration/lib/wxr.mjs';
import { classifyItem } from './migration/lib/classify.mjs';
import { resolveTopics } from './migration/lib/resolve-topics.mjs';
import { resolveMecra, buildDomainMap } from './migration/lib/resolve-mecra.mjs';
import { resolveFeaturedImage } from './migration/lib/resolve-media.mjs';
import { resolveSlugs } from './migration/lib/resolve-slug.mjs';
import { buildTranslationIndex, resolveTranslations } from './migration/lib/resolve-translations.mjs';
import { htmlToMarkdown, rewireInternalLinks, stripDeadFileLinks, findSelfHostedPdf } from './migration/lib/content-to-markdown.mjs';
import { resolveVideoFields } from './migration/lib/resolve-video-fields.mjs';
import { resolveBookFields } from './migration/lib/resolve-book-fields.mjs';
import { resolveDescription } from './migration/lib/resolve-description.mjs';
import { downloadAndProcessImage, processLocalImage, downloadPdf } from './migration/lib/media.mjs';
import { buildFrontmatter } from './migration/lib/build-frontmatter.mjs';
import { writeContentFile } from './migration/lib/write-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const quiet = args.includes('--quiet');
const produce = args.includes('--produce');
const STAGING_ROOT = path.join(ROOT, '.tmp/migration-output');

function loadJson(relPath) {
  return JSON.parse(readFileSync(path.join(ROOT, relPath), 'utf-8'));
}
function log(...msg) {
  if (!quiet) console.log(...msg);
}
function vlog(...msg) {
  if (verbose) console.log(...msg);
}

const topicsJson = loadJson('src/data/topics.json');
const mecralarJson = loadJson('src/data/mecralar.json');
const tagTopicMap = loadJson('scripts/migration/tag-topic-map.json');
const tagMecraMap = loadJson('scripts/migration/tag-mecra-map.json');
const contentOverrides = loadJson('scripts/migration/content-overrides.json');
const translationMap = loadJson('scripts/migration/translation-map.json');

const validTopicIds = new Set(topicsJson.map((t) => t.id));
const validMecraIds = new Set(mecralarJson.map((m) => m.id));
const domainMap = buildDomainMap(mecralarJson);

// --- translation-map.json bütünlüğü — en riskli dosya, ihlalde DUR (sessizce geçme) ---
const translationIndex = buildTranslationIndex(translationMap);
if (translationIndex.errors.length > 0) {
  console.error('translation-map.json bütünlük hatası, script durduruldu:');
  for (const e of translationIndex.errors) console.error(`  - ${e}`);
  process.exit(1);
}
log(`translation-map.json doğrulandı: ${translationIndex.mainToTranslations.size} grup.`);

const xmlPath = path.join(ROOT, 'mustafaeren.WordPress.2026-07-15.xml');
log(`WXR ayrıştırılıyor: ${xmlPath}`);
const items = parseWxr(xmlPath);
const attachmentsById = indexAttachments(items);
log(`Toplam <item>: ${items.length}, ekli medya: ${attachmentsById.size}`);

function contentUrl(collection, lang, id) {
  if (lang === 'tr') return `/${collection}/${id}/`;
  return `/${lang}/${collection}/${id}/`;
}

// --- 1. geçiş: sınıflandırma ---
const records = [];
for (const item of items) {
  if (postType(item) === 'attachment') continue;
  const { collection, lang, reason } = classifyItem(item, contentOverrides);
  records.push({ item, collection, lang, classifyReason: reason });
}

const actionable = records.filter((r) => r.collection);
const skipped = records.filter((r) => !r.collection);
const ambiguousSkips = skipped.filter((r) => r.classifyReason.includes('incelenmeli'));

log(`Sınıflandırılan: ${actionable.length} göç adayı, ${skipped.length} atlanan (${ambiguousSkips.length} belirsiz).`);
for (const r of ambiguousSkips) {
  log(`  ! ${r.classifyReason}`);
}

// --- slug çözümü (koleksiyon-genelinde çakışma kontrolü ile) ---
// slugOverride: WP'nin ürettiği anlamsız otomatik slug'ı (ör. "project-2") kullanıcı onayıyla
// okunur bir slug'a çevirmek için — bkz. content-overrides.json.
const slugInput = actionable.map((r) => ({
  postId: postId(r.item),
  wpSlug: contentOverrides[postId(r.item)]?.slugOverride ?? slug(r.item),
  lang: r.lang,
  collection: r.collection,
}));
const { slugByPostId, warnings: slugWarnings, errors: slugErrors } = resolveSlugs(slugInput);
for (const w of slugWarnings) vlog(`  [slug] ${w}`);
for (const e of slugErrors) log(`  [slug HATA] ${e}`);

// --- iç link haritası: eski wp slug -> yeni kanonik path ---
const oldSlugToNewPath = new Map();
for (const r of actionable) {
  const finalSlug = slugByPostId.get(postId(r.item));
  if (finalSlug) oldSlugToNewPath.set(slug(r.item), contentUrl(r.collection, r.lang, finalSlug));
}

// --- 2. geçiş: tam analiz ---
const results = [];
const sourceItemByPostId = new Map();

for (const r of actionable) {
  const { item, collection, lang } = r;
  const id = postId(item);
  const warnings = [];
  const errors = [];

  const finalSlug = slugByPostId.get(id);
  if (!finalSlug) errors.push('Slug üretilemedi (bkz. yukarıdaki slug hataları)');

  const { topics, warnings: tw, errors: te } = resolveTopics(item, tagTopicMap, validTopicIds, contentOverrides);
  warnings.push(...tw);
  errors.push(...te);

  const { mecra, warnings: mw, errors: me } = resolveMecra(item, collection, contentOverrides, domainMap, tagMecraMap, validMecraIds);
  warnings.push(...mw);
  errors.push(...me);

  // sources[] YALNIZCA content-overrides.json'da açıkça onaylanmış kayıtlarda kullanılır —
  // birden fazla mecra tag/link'i tek başına otomatik sources[] üretmez (plan kuralı).
  const sourcesOverride = contentOverrides[id]?.sources;
  let sources;
  if (sourcesOverride) {
    const invalid = sourcesOverride.filter((s) => !validMecraIds.has(s.mecra));
    if (invalid.length) {
      errors.push(`content-overrides.json sources[] geçersiz mecra id içeriyor: ${invalid.map((s) => s.mecra).join(', ')} (post_id=${id})`);
    } else {
      sources = sourcesOverride;
    }
  }

  // Videolar için _thumbnail_id hiç yok (WP'nin standart mekanizması yerine Northeme temasının
  // kendi video-embed alanı kullanılıyor) — bu koleksiyonda resolveFeaturedImage anlamsız/gürültülü
  // bir uyarı üretir, bunun yerine YouTube thumbnail'i kullanılıyor (aşağıda, resolveVideoFields).
  let featuredImage;
  if (collection !== 'videolar') {
    const { featuredImage: fi, warnings: fw, errors: fe } = resolveFeaturedImage(item, attachmentsById, contentOverrides);
    featuredImage = fi;
    warnings.push(...fw);
    errors.push(...fe);
  }

  const { translations, warnings: trw, errors: tre } = resolveTranslations(id, translationIndex, slugByPostId);
  warnings.push(...trw);
  errors.push(...tre);

  let markdown = '';
  let unresolvedInternalLinks = [];
  try {
    markdown = htmlToMarkdown(bodyHtml(item), attachmentsById);
    const rewired = rewireInternalLinks(markdown, oldSlugToNewPath);
    markdown = rewired.markdown;
    unresolvedInternalLinks = rewired.unresolvedLinks;
    if (unresolvedInternalLinks.length > 0) {
      warnings.push(`Çözülemeyen iç link(ler): ${unresolvedInternalLinks.join(', ')}`);
    }
    const { markdown: cleaned, strippedCount } = stripDeadFileLinks(markdown);
    markdown = cleaned;
    if (strippedCount > 0) {
      warnings.push(`${strippedCount} ölü file:/// dipnot linki kaldırıldı (Aşama 4E bulgusu)`);
    }

    // Elle doğrulanmış, tek-kayıtlık gövde düzeltmeleri (ör. yanlış kopyalanmış künye satırı).
    for (const { find, replace } of contentOverrides[id]?.bodyFindReplace ?? []) {
      if (!markdown.includes(find)) {
        errors.push(`bodyFindReplace: "${find.slice(0, 40)}…" gövdede bulunamadı (post_id=${id})`);
        continue;
      }
      markdown = markdown.replace(find, replace);
      warnings.push(`Gövdede elle doğrulanmış düzeltme uygulandı (post_id=${id})`);
    }
  } catch (err) {
    errors.push(`HTML->Markdown dönüşümü başarısız: ${err.message}`);
  }

  const pdfUrl = collection !== 'videolar' ? findSelfHostedPdf(bodyHtml(item)) : undefined;

  let { description, warnings: dw } = resolveDescription(item, markdown, contentOverrides);
  warnings.push(...dw);

  let typeFields = {};
  if (collection === 'videolar') {
    const { videoTuru, embedUrl, thumbnailUrl, durationMinutes, warnings: vw, errors: ve } = resolveVideoFields(item, contentOverrides);
    warnings.push(...vw);
    errors.push(...ve);
    typeFields = { videoTuru, embedUrl, durationMinutes };
    // WP'de video için _thumbnail_id yok (bkz. resolve-video-fields.mjs) — resolveFeaturedImage
    // bu yüzden hep undefined döner; YouTube'un kendi thumbnail'i onun yerine kullanılıyor.
    if (thumbnailUrl) {
      featuredImage = { url: thumbnailUrl, alt: title(item), action: 'webp' };
    }
  } else if (collection === 'kitaplar') {
    const { kitapTuru, year, yayineviUrl, yazar, yayinevi, sayfaSayisi, warnings: bw, errors: be } = resolveBookFields(item, contentOverrides);
    warnings.push(...bw);
    errors.push(...be);
    typeFields = { kitapTuru, year, yayineviUrl, yazar, yayinevi, sayfaSayisi };
    // Northeme temasının "editörlük" kayıtlarında (ve bazı "yazdıklarım" kayıtlarında) gövde/excerpt
    // hiç doldurulmamış, Lorem Ipsum tema demo metni kalmış — resolveDescription bunu reddedip boş
    // döndürdü (13 gerçek örnekte). Uydurma bir özet yazmak yerine, zaten doğrulanmış gerçek
    // bibliyografik alanlardan (yazar/yayınevi/yıl/sayfa) dürüst bir künye cümlesi kuruluyor.
    if (!description && yazar && yayinevi && year) {
      description = `Yazar: ${yazar}. ${yayinevi}, ${year}, ${sayfaSayisi ? sayfaSayisi + ' sayfa.' : ''}`.trim();
      warnings.push('description gövde/excerpt\'ten değil, gerçek bibliyografik alanlardan (yazar/yayınevi/yıl) kuruldu');
    }
  }

  const record = {
    sourcePostId: id,
    postType: postType(item),
    status: status(item),
    oldUrl: link(item),
    title: title(item),
    description,
    proposedCollection: collection,
    lang,
    slug: finalSlug,
    publishDate: postDate(item).slice(0, 10),
    topics,
    mecra,
    sources,
    featuredImage,
    translationTarget: translations,
    pdfUrl,
    ...typeFields,
    markdown,
    markdownLength: markdown.length,
    hasEmbed: /<iframe|<script/i.test(markdown),
    warnings,
    errors,
  };
  results.push(record);
  sourceItemByPostId.set(id, item);

  if (errors.length) vlog(`  [HATA] post_id=${id} "${title(item)}": ${errors.join(' | ')}`);
  else if (warnings.length) vlog(`  [uyarı] post_id=${id} "${title(item)}": ${warnings.join(' | ')}`);
}

const totalErrors = results.reduce((n, r) => n + r.errors.length, 0) + slugErrors.length;
const totalWarnings = results.reduce((n, r) => n + r.warnings.length, 0) + slugWarnings.length;
const byCollection = {};
for (const r of results) byCollection[r.proposedCollection] = (byCollection[r.proposedCollection] ?? 0) + 1;

log('\n--- Özet ---');
log(`Analiz edilen kayıt: ${results.length}`);
log('Koleksiyon dağılımı:', byCollection);
log(`Toplam hata: ${totalErrors}, toplam uyarı: ${totalWarnings}`);

// --- Risk-bazlı örnekler (Aşama 4E'nin ön-taraması, yalnızca konsol özeti) ---
const clean = results.filter((r) => r.errors.length === 0 && (r.proposedCollection === 'yazilar' || r.proposedCollection === 'basinda'));
function pick(label, arr) {
  if (arr.length === 0) return;
  log(`  ${label}: post_id=${arr[0].sourcePostId} "${arr[0].title}"`);
}
if (clean.length > 0) {
  log('\n--- Risk-bazlı örnekler (Aşama 4E ön-tarama) ---');
  pick('En uzun yazı', [...clean].sort((a, b) => b.markdownLength - a.markdownLength));
  pick('En eski yazı', [...clean].sort((a, b) => a.publishDate.localeCompare(b.publishDate)));
  pick('PDF içeren', clean.filter((r) => r.pdfUrl));
  pick('Embed/shortcode içeren', clean.filter((r) => r.hasEmbed));
  pick('Görselsiz (needsReview)', clean.filter((r) => !r.featuredImage));
  pick('Yabancı dil çevirisi', clean.filter((r) => r.lang !== 'tr'));
  pick('Çeviri hedefi olan (ana dil)', clean.filter((r) => r.translationTarget?.length));
}

// --- Raporları yaz ---
const reportsDir = path.join(ROOT, 'reports');
mkdirSync(reportsDir, { recursive: true });

const dryRunPath = path.join(reportsDir, 'migration-dry-run.json');
const reportRecords = results.map(({ markdown: _markdown, ...rest }) => rest);
writeFileSync(dryRunPath, JSON.stringify({ generatedFrom: xmlPath, totalItems: items.length, totalErrors, totalWarnings, byCollection, records: reportRecords }, null, 2));
log(`\nYazıldı: ${path.relative(ROOT, dryRunPath)}`);

const issuesRows = [['sourcePostId', 'title', 'proposedCollection', 'severity', 'message']];
for (const r of results) {
  for (const e of r.errors) issuesRows.push([r.sourcePostId, r.title, r.proposedCollection, 'error', e]);
  for (const w of r.warnings) issuesRows.push([r.sourcePostId, r.title, r.proposedCollection, 'warning', w]);
}
function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const csv = issuesRows.map((row) => row.map(csvEscape).join(',')).join('\n');
const issuesPath = path.join(reportsDir, 'migration-issues.csv');
writeFileSync(issuesPath, csv);
log(`Yazıldı: ${path.relative(ROOT, issuesPath)} (${issuesRows.length - 1} satır)`);

if (totalErrors > 0) {
  log(`\nUYARI: ${totalErrors} hata var. Aşama 4C'ye geçmeden önce bunlar çözülmeli.`);
  process.exitCode = 1;
}

// --- Aşama 4C: kontrollü üretim (.tmp/migration-output/'a, src/content/'e DEĞİL) ---
if (produce) {
  log(`\n--- Üretim (.tmp/migration-output/) ---`);

  const IMAGE_ROLE = { yazilar: 'featured', basinda: 'featured', videolar: 'thumb', kitaplar: 'kapak' };
  const IMAGE_FIELD = { yazilar: 'featuredImage', basinda: 'featuredImage', videolar: 'thumbnail', kitaplar: 'kapak' };

  async function processRecord(r) {
    if (r.errors.length > 0) {
      return { skipped: true, sourcePostId: r.sourcePostId, title: r.title, collection: r.proposedCollection, reason: 'dry-run hatası (bkz. migration-issues.csv)' };
    }

    // Görsel indirmeden ÖNCE görsel-dışı alanları kontrol et (ör. kitaplar'da sayfaSayisi eksikse)
    // — aksi halde başarısız olacağı zaten belli olan bir kayıt için boşuna indirme/dönüştürme
    // yapılıp .tmp/migration-output/'ta öksüz dosyalar birikir.
    const placeholderImage = { relativePath: '__PENDING__' };
    const { errors: precheckErrors } = buildFrontmatter(r, placeholderImage, undefined, r.description, validTopicIds, validMecraIds);
    if (precheckErrors.length > 0) {
      return { skipped: true, sourcePostId: r.sourcePostId, title: r.title, collection: r.proposedCollection, reason: precheckErrors.join(' | ') };
    }

    const destDir = path.join(STAGING_ROOT, r.proposedCollection);
    const imagesDir = path.join(destDir, '_images');
    const role = IMAGE_ROLE[r.proposedCollection];

    let image;
    if (r.featuredImage?.localPath) {
      const localFullPath = path.join(ROOT, r.featuredImage.localPath);
      const result = await processLocalImage(localFullPath, imagesDir, `${r.slug}-${role}`, r.featuredImage.action);
      if (result.error) {
        return { skipped: true, sourcePostId: r.sourcePostId, title: r.title, collection: r.proposedCollection, reason: result.error };
      }
      image = result;
    } else if (r.featuredImage) {
      const result = await downloadAndProcessImage(r.featuredImage.url, imagesDir, `${r.slug}-${role}`, r.featuredImage.action);
      if (result.error) {
        return { skipped: true, sourcePostId: r.sourcePostId, title: r.title, collection: r.proposedCollection, reason: result.error };
      }
      image = result;
    }

    let pdfPath;
    if (r.pdfUrl) {
      const pdfResult = await downloadPdf(r.pdfUrl, path.join(STAGING_ROOT, '_pdf'), r.slug);
      if (pdfResult.error) {
        vlog(`  [pdf uyarı] post_id=${r.sourcePostId}: ${pdfResult.error} — pdf alanı olmadan devam`);
      } else {
        pdfPath = pdfResult.relativePath;
      }
    }

    const { frontmatter, errors: fmErrors } = buildFrontmatter(r, image, pdfPath, r.description, validTopicIds, validMecraIds);
    if (fmErrors.length > 0) {
      return { skipped: true, sourcePostId: r.sourcePostId, title: r.title, collection: r.proposedCollection, reason: fmErrors.join(' | ') };
    }

    const outPath = writeContentFile(destDir, r.slug, frontmatter, r.markdown);
    return { skipped: false, sourcePostId: r.sourcePostId, title: r.title, collection: r.proposedCollection, file: path.relative(ROOT, outPath) };
  }

  // Küçük eşzamanlılık havuzu — 150+ dış görsel indirmesini sırayla yapmamak için, ama
  // hedef sunucuları da boğmamak için (aynı anda en fazla 6 istek).
  const CONCURRENCY = 6;
  const queue = [...results];
  const produceResults = [];
  async function worker() {
    while (queue.length > 0) {
      const r = queue.shift();
      produceResults.push(await processRecord(r));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const written = produceResults.filter((p) => !p.skipped);
  const skipped = produceResults.filter((p) => p.skipped);

  const manifestPath = path.join(reportsDir, 'migration-manifest.json');
  writeFileSync(
    manifestPath,
    JSON.stringify(
      { generatedFrom: xmlPath, stagingRoot: path.relative(ROOT, STAGING_ROOT), writtenCount: written.length, skippedCount: skipped.length, files: written.map((w) => w.file).sort() },
      null,
      2,
    ),
  );

  const produceIssuesRows = [['sourcePostId', 'title', 'proposedCollection', 'reason']];
  for (const s of skipped) produceIssuesRows.push([s.sourcePostId, s.title, s.collection, s.reason]);
  const produceIssuesPath = path.join(reportsDir, 'migration-produce-issues.csv');
  writeFileSync(produceIssuesPath, produceIssuesRows.map((row) => row.map(csvEscape).join(',')).join('\n'));

  const byCollectionWritten = {};
  for (const w of written) byCollectionWritten[w.collection] = (byCollectionWritten[w.collection] ?? 0) + 1;
  const byCollectionSkipped = {};
  for (const s of skipped) byCollectionSkipped[s.collection] = (byCollectionSkipped[s.collection] ?? 0) + 1;

  log(`Yazılan: ${written.length}`, byCollectionWritten);
  log(`Atlanan (needsReview): ${skipped.length}`, byCollectionSkipped);
  log(`Yazıldı: ${path.relative(ROOT, manifestPath)}`);
  log(`Yazıldı: ${path.relative(ROOT, produceIssuesPath)} (${produceIssuesRows.length - 1} satır)`);
}
