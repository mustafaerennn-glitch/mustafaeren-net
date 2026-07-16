// WordPress content:encoded (HTML) → Markdown dönüşümü.
// Kurallar spekülatif değil, gerçek 198 gövdenin taranmasıyla bulunan somut örneklere göre
// yazıldı (bkz. Faz 4B analiz notları): [caption]/[gallery] shortcode'ları, &nbsp;, nadir
// iframe/script embed'leri, iç linkler.
import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '_',
});

// Nadir ama değerli embed'ler (Twitter iframe, Flourish script) — markdown'a çevrilemez,
// ham HTML olarak korunuyor (Astro'nun markdown işlemcisi satır-içi HTML'i geçirir).
turndown.keep(['iframe', 'script']);

/**
 * [caption id="" align="x" width="500"]<img src="..." alt="..." .../> Açıklama metni[/caption]
 * → <figure><img.../><figcaption>Açıklama metni</figcaption></figure>
 * Tek gerçek örnek bu formatta (bkz. "Yeni Tip Hapishaneler ve Toplumsal Muhalefete Gözdağı").
 */
function convertCaptionShortcode(html) {
  return html.replace(
    /\[caption[^\]]*\](<img[^>]*>)([\s\S]*?)\[\/caption\]/gi,
    (_match, imgTag, captionText) => {
      const caption = captionText.trim();
      return caption ? `<figure>${imgTag}<figcaption>${caption}</figcaption></figure>` : imgTag;
    },
  );
}

/**
 * [gallery size="full" link="file" ids="961,963,962"] → attachment id'lerinden çözülen
 * <img> dizisi. Tek gerçek örnek bu formatta.
 */
function convertGalleryShortcode(html, attachmentsById) {
  return html.replace(/\[gallery[^\]]*ids="([\d,]+)"[^\]]*\]/gi, (_match, idsCsv) => {
    const ids = idsCsv.split(',').map((s) => s.trim());
    const imgs = ids
      .map((id) => attachmentsById.get(id))
      .filter(Boolean)
      .map((a) => `<img src="${a.url}" alt="${a.alt}" />`)
      .join('\n');
    return imgs;
  });
}

/**
 * Kopyala-yapıştır kaynaklı haber sitelerinden (BirGün vb.) gelen "spot" (lead paragraf)
 * öğeleri, kaynak sitenin kendi CSS sınıfıyla birlikte `<h5 class="detail__spot">` olarak
 * WP'ye yapışmış — gerçek bir başlık değil, vurgulu bir giriş cümlesi. Başlık anlamı taşımadan
 * kalın metin olarak korunuyor (Aşama 5 Lighthouse denetiminde bulundu — heading-order ihlali).
 */
function unwrapSpotHeadings(html) {
  // NOT: "spot" alt çizgiyle bitişik olabiliyor (ör. "detail__spot") — \b kullanılmıyor,
  // çünkü "_" bir kelime karakteri olduğundan \bspot\b "detail__spot" içinde eşleşmiyor.
  return html.replace(/<h[1-6][^>]*class="[^"]*spot[^"]*"[^>]*>([\s\S]*?)<\/h[1-6]>/gi, '<p><strong>$1</strong></p>');
}

/**
 * Bazı Basında gövdelerinde mecra/tarih alıntı satırı (`Mecra Adı - tarih`) yanlışlıkla bir
 * başlık olarak WP'ye girilmiş (`<h5><strong><a>Mecra</a> - tarih</strong></h5>`). Diğer tüm
 * kayıtlarda bu satır düz paragraf olarak duruyor — tutarlılık ve heading-order için başlık
 * sarmalayıcısı kaldırılıyor, içerik (link + tarih) olduğu gibi korunuyor.
 */
function unwrapCitationHeadings(html) {
  return html.replace(
    /<h[1-6][^>]*>\s*<strong>\s*(<a[^>]*>.*?<\/a>\s*[-–—]\s*[^<]*)<\/strong>\s*<\/h[1-6]>/gi,
    '<p>$1</p>',
  );
}

/**
 * Markdown başlıklarını normalize eder: gövdede kullanılan en sığ başlık seviyesi H2 olacak
 * şekilde tüm başlıklar kaydırılır (göreli iç içelik korunarak). H1 sayfanın kendi başlığı
 * olduğu için gövdede hiç kullanılmıyor; bazı WP gövdeleri doğrudan H5'ten başlıyordu, bu da
 * başlık hiyerarşisini atlayan bir erişilebilirlik ihlaliydi (Aşama 5 Lighthouse bulgusu).
 */
function normalizeHeadingLevels(markdown) {
  const levels = [...markdown.matchAll(/^(#{2,6})\s/gm)].map((m) => m[1].length);
  if (levels.length === 0) return markdown;
  const shift = Math.min(...levels) - 2;
  if (shift <= 0) return markdown;
  return markdown.replace(/^(#{2,6})(\s)/gm, (_match, hashes, space) => '#'.repeat(hashes.length - shift) + space);
}

/**
 * HTML gövdesini Markdown'a çevirir.
 * @param {string} html - content:encoded ham HTML'i
 * @param {Map<string, {url: string, alt: string}>} attachmentsById - [gallery] çözümü için
 * @returns {string} Markdown
 */
export function htmlToMarkdown(html, attachmentsById) {
  let processed = html;
  processed = convertCaptionShortcode(processed);
  processed = convertGalleryShortcode(processed, attachmentsById);
  processed = unwrapSpotHeadings(processed);
  processed = unwrapCitationHeadings(processed);
  // &nbsp; → normal boşluk (82 gövdede görüldü, markdown'da anlamsız/görünmez karaktere yol açar)
  processed = processed.replace(/&nbsp;/gi, ' ');
  // Ardışık boş paragraflar WordPress editörünün kalıntısı, gereksiz boşluk üretir
  processed = processed.replace(/<p>\s*<\/p>/gi, '');

  let markdown = turndown.turndown(processed);
  // Turndown bazen 3+ ardışık boş satır bırakabiliyor (shortcode temizliğinden sonra)
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
  return normalizeHeadingLevels(markdown);
}

/**
 * Gövde-içi görsellerin (Markdown `![alt](url)`), kendi sitesinin (mustafaeren.net/wp-content/
 * uploads) barındırdığı, WordPress'ten hiç işlenmeden geçen URL'lerini bulur. Bunlar yalnızca
 * öne çıkan görselden farklı olarak Aşama 4C'nin görsel indirme adımının hiç kapsamadığı,
 * canlı eski siteye bağımlı kalan görsellerdi (Aşama 5 Lighthouse denetiminde bulundu — 6.7 MB
 * sayfa ağırlığı, 7.3s LCP). Yinelenen URL'ler tek kayıt olarak döner.
 * @param {string} markdown
 * @returns {string[]} benzersiz URL listesi, gövdede geçiş sırasına göre
 */
export function extractInlineOwnSiteImages(markdown) {
  const urls = [...markdown.matchAll(/!\[[^\]]*\]\((https:\/\/mustafaeren\.net\/wp-content\/uploads\/[^)]+)\)/g)].map((m) => m[1]);
  return [...new Set(urls)];
}

/**
 * extractInlineOwnSiteImages() ile bulunan URL'leri, indirilip işlendikten sonra yerel göreli
 * yollarla değiştirir.
 * @param {string} markdown
 * @param {Map<string, string>} urlToLocalPath - orijinal URL -> `./_images/...` göreli yol
 * @returns {string}
 */
export function rewriteInlineImages(markdown, urlToLocalPath) {
  let rewritten = markdown;
  for (const [url, localPath] of urlToLocalPath) {
    rewritten = rewritten.split(`(${url})`).join(`(${localPath})`);
  }
  return rewritten;
}

/**
 * Gövdedeki mustafaeren.net/{eski-slug}/ formatındaki İÇ makale linklerini (wp-content/uploads
 * medya linkleri HARİÇ) yeni kanonik path'e çevirir. Çözülemeyen linkler dokunulmadan kalır ve
 * ayrıca raporlanır (çağıran taraf `unresolvedLinks` dizisini toplar).
 * @param {string} markdown
 * @param {Map<string, string>} oldSlugToNewPath - eski wp post_name -> yeni kanonik path
 * @returns {{ markdown: string, unresolvedLinks: string[] }}
 */
export function rewireInternalLinks(markdown, oldSlugToNewPath) {
  const unresolvedLinks = [];
  const rewritten = markdown.replace(
    /\]\((https?:\/\/mustafaeren\.net\/(?!wp-content\/)([a-z0-9-]+)\/?)\)/gi,
    (fullMatch, fullUrl, oldSlug) => {
      const newPath = oldSlugToNewPath.get(oldSlug);
      if (newPath) return `](${newPath})`;
      unresolvedLinks.push(fullUrl);
      return fullMatch;
    },
  );
  return { markdown: rewritten, unresolvedLinks };
}

/**
 * Bazı yazılar (Word belgesinden yapıştırılmış, dipnotlu) gövdede `file:///C:/Users/...docx#_ftnN`
 * gibi yazarın kendi bilgisayarına özel, hiçbir okuyucu için asla çalışmayacak dipnot linkleri
 * içeriyor (Aşama 4E'de 4 gerçek örnekte bulundu). Link hedefi anlamsız olduğu için kaldırılıp
 * yalnızca görünür referans numarası metin olarak bırakılıyor — sahte bir hedefe link vermek
 * yerine dürüst bir "bu bir link değil" davranışı.
 * @param {string} markdown
 * @returns {{ markdown: string, strippedCount: number }}
 */
export function stripDeadFileLinks(markdown) {
  let strippedCount = 0;
  // Link metni her zaman "\[N\]" (kaçışlı köşeli parantezli dipnot numarası) formatında —
  // desen buna kilitleniyor. Genel bir (.*?) kullanmak TEHLİKELİ: "." satır sonu hariç HER
  // karakteri eşler (] ve ) dahil), bu yüzden açgözlü olmayan bir joker bile en yakın "](file:"
  // yerine belgedeki uzaklardaki BAŞKA bir "](file:" oluşumuna kadar genişleyip aradaki tüm
  // gerçek linkleri (ör. [Bianet](https://...)) yutabiliyor — bu bug canlı veride bulunup
  // düzeltildi (Aşama 4E, 2026-07-16).
  const rewritten = markdown.replace(/\[(\\\[\d+\\\])\]\(file:\/\/\/[^)]*\)/gi, (_match, linkText) => {
    strippedCount += 1;
    return linkText;
  });
  return { markdown: rewritten, strippedCount };
}

/**
 * Gövdede kendi sitesine (wp-content/uploads) barındırılan bir .pdf linki varsa onu döndürür —
 * şemadaki `pdf` alanı adayı. Dış kaynaklara ait PDF'ler (tcps.org.tr, dergiler.ankara.edu.tr
 * vb. — bunlar kaynakça/dipnot referansı, makalenin KENDİ pdf'i değil) hariç tutulur.
 */
export function findSelfHostedPdf(html) {
  const match = html.match(/href="(https?:\/\/mustafaeren\.net\/wp-content\/uploads\/[^"]+\.pdf)"/i);
  return match ? match[1] : undefined;
}
