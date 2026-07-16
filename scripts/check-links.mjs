#!/usr/bin/env node
// dist/ build çıktısını iki şey için tarar:
//   1) Kırık link — href="/..." herhangi bir gerçek üretilmiş rotaya karşılık gelmiyor mu?
//   2) Locale hardcode — bir locale sayfası (en/de/fr), routes.ts'te kendi dilinde karşılığı
//      KAYITLI olan bir sayfaya, kendi karşılığı yerine başka bir dilin (genelde TR) URL'siyle
//      mi link veriyor? (örn. /en/about/ sayfasında href="/hakkimda/" — routes.hakkimda.en
//      dururken routes.hakkimda.tr kullanılmış olması bir hata.)
//
// Not: routes.ts'te KAYITLI OLMAYAN sayfalar (örn. /iletisim/, /yazilar/ — henüz çevirisi
// olmayan bölümler) bilerek atlanır; bunlar gerçek bir boşluk, hata değil.
//
// Not 2: `data-lang-switch` attribute'lu <a> etiketleri (bkz. LangCluster.astro) locale
// hardcode kuralından muaf — dil değiştiricinin işi zaten KASITLI olarak başka dillere link
// vermek, bu yüzden "kendi dilinde karşılığı varken başka dile gitmiş" hatası burada geçersiz.
// Kırık-link kontrolüne dahil olmaya devam ederler.
//
// Kullanım: npm run check-links  (önce `astro build` çalıştırılmış olmalı)

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const distDir = join(root, 'dist');

const { routes } = await import(join(root, 'src/i18n/routes.ts'));
const LOCALES = ['tr', 'en', 'de', 'fr'];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

const htmlFiles = walk(distDir);

// --- 1) Tüm gerçek rotaları topla ---
const validRoutes = new Set(['/']);
for (const file of htmlFiles) {
  if (file.endsWith('index.html')) {
    const route = relative(distDir, file).replace(/index\.html$/, '');
    validRoutes.add('/' + route.replace(/\\/g, '/'));
  }
}

// --- 2) routes.ts kaydındaki her URL'nin hangi (key, lang) çiftine ait olduğunu ters-indeksle ---
const hrefToRouteEntry = new Map(); // href -> { key, lang }
for (const [key, byLang] of Object.entries(routes)) {
  for (const [lang, href] of Object.entries(byLang)) {
    hrefToRouteEntry.set(href, { key, lang });
  }
}

const brokenLinks = new Map(); // href -> Set(kaynak dosyalar)
const localeViolations = []; // { file, pageLang, href, expectedHref, key }

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf-8');
  const bodyStart = html.indexOf('<body');
  const body = bodyStart === -1 ? html : html.slice(bodyStart);

  const langMatch = html.match(/<html lang="([a-z]+)"/);
  const pageLang = langMatch ? langMatch[1] : null;

  const hrefs = [...body.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);

  // data-lang-switch taşıyan <a> etiketlerinin href'leri — locale hardcode kuralından muaf.
  const langSwitchHrefs = new Set(
    [...body.matchAll(/<a\b[^>]*>/g)]
      .map((m) => m[0])
      .filter((tag) => /data-lang-switch/.test(tag))
      .map((tag) => tag.match(/href="(\/[^"]*)"/)?.[1])
      .filter(Boolean),
  );

  for (const rawHref of hrefs) {
    const clean = rawHref.split('?')[0].split('#')[0];
    const normalized = clean === '' || clean.endsWith('/') ? clean || '/' : clean + '/';

    // 1) Kırık link kontrolü
    if (normalized && !validRoutes.has(normalized)) {
      const rel = relative(distDir, file);
      if (!brokenLinks.has(normalized)) brokenLinks.set(normalized, new Set());
      brokenLinks.get(normalized).add(rel);
    }

    // 2) Locale hardcode kontrolü — routes.ts'te kayıtlı bir sayfaya mı gidiyor?
    if (pageLang && LOCALES.includes(pageLang) && !langSwitchHrefs.has(rawHref)) {
      const entry = hrefToRouteEntry.get(normalized);
      if (entry && entry.lang !== pageLang) {
        const expectedHref = routes[entry.key][pageLang];
        if (expectedHref && expectedHref !== normalized) {
          localeViolations.push({
            file: relative(distDir, file),
            pageLang,
            href: normalized,
            expectedHref,
            key: entry.key,
          });
        }
      }
    }
  }
}

let hasError = false;

console.log(`Taranan sayfa sayısı: ${htmlFiles.length}`);
console.log(`Bilinen gerçek rota sayısı: ${validRoutes.size}`);
console.log('');

if (brokenLinks.size > 0) {
  hasError = true;
  console.log(`❌ KIRIK LİNK (${brokenLinks.size}):`);
  for (const [href, sources] of [...brokenLinks.entries()].sort()) {
    console.log(`  ${href}`);
    for (const s of [...sources].slice(0, 3)) console.log(`    <- ${s}`);
  }
  console.log('');
} else {
  console.log('✅ Kırık link yok.');
}

if (localeViolations.length > 0) {
  hasError = true;
  console.log(`❌ LOCALE HARDCODE İHLALİ (${localeViolations.length}):`);
  for (const v of localeViolations) {
    console.log(`  ${v.file} (lang="${v.pageLang}") → href="${v.href}"`);
    console.log(`    "${v.key}" sayfasının "${v.pageLang}" karşılığı var: "${v.expectedHref}" kullanılmalıydı`);
  }
  console.log('');
} else {
  console.log('✅ Locale hardcode ihlali yok — hiçbir locale sayfası, kendi dilinde karşılığı kayıtlı bir sayfaya başka dilin URL\'siyle link vermiyor.');
}

process.exit(hasError ? 1 : 0);
