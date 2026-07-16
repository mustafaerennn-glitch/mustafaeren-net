# Faz 2 Başlangıç Talimatı — mustafaeren.net Astro Göçü

**Bu dosya kime hitap ediyor:** Claude Code. Bu, Faz 1'in (bilgi mimarisi + mockup tasarımı, claude.ai'de yapıldı) tamamlandığı noktadan devralıp Faz 2'yi (gerçek Astro projesinin kurulumu) başlatmak için hazırlanmış bir devir dokümanı.

**Referans proje:** kanlipazar.net — aynı kişinin daha önce tamamladığı, GitHub + Netlify + Namecheap altyapısıyla kurulmuş bir statik site göçü. Bu projede de aynı barındırma zinciri kullanılacak, ama ölçek çok daha büyük olduğu için (145 içerik, 4 tip, 4 dil) elle HTML/CSS yerine Astro (SSG) ile ilerleniyor.

**Bu klasörde bulunması gereken diğer dosyalar** (proje sahibi tarafından ayrıca konacak):
- `mustafaeren-net-gocu-yol-haritasi.md` — tüm faz planı ve karara bağlanmış tasarım kararlarının tam listesi. **Bu dosyayı da oku, buradaki özet onun yerine geçmez.**
- `taksonomi-denetimi.md` — konu/alan taksonomisi, ~374 WordPress etiketinin ~30 kanonik konuya indirgenmesi, alan eşleme tablosu
- `konu-sayfasi-tasarimi.md` — konu hub sayfası tasarım spesifikasyonu
- 14 adet mockup HTML dosyası (`ana-sayfa-mockup.html`, `yazi-detay-mockup.html`, `yazilar-index-mockup.html`, `basinda-detay-mockup.html`, `basinda-index-mockup.html`, `video-detay-mockup.html`, `videolar-index-mockup-v10.html`, `kitap-detay-mockup.html`, `kitaplar-index-mockup.html`, `alan-hub-mockup.html`, `konu-sayfasi-mockup.html`, `mecra-arsiv-mockup.html`, `hakkimda-mockup.html`, `iletisim-mockup.html`) — bunlar **gerçek, onaylanmış görsel tasarımın kaynağı**. CSS değişkenleri, layout, bileşen davranışları buradan birebir alınacak, yeniden tasarlanmayacak.

---

## 1. Bu fazda ne yapılacak (özet)

1. Astro projesini kur (npm create astro, TypeScript, minimal template)
2. Content collections şemasını aşağıdaki tanıma göre kur (Zod)
3. i18n / çok dilli routing kurulumunu yap
4. 14 mockup'ı gerçek Astro şablonlarına (layout + component) dönüştür
5. Footer sosyal ikonlarını gerçek bir ikon paketinden (Simple Icons önerilir) al — mockup'lardaki elle çizilmiş SVG'ler sadece yer tutucu

**Bu fazda YAPILMAYACAK olanlar** (sonraki fazlara ait, karıştırılmamalı):
- Gerçek içerik yüklemesi (Faz 3-4-5'e ait — WordPress XML export henüz alınmadı)
- Domain/DNS/Netlify deploy (Faz 6)
- Konu ağı görselleştirmesi / görsel cila turu (Faz 7, bilinçli olarak en sona bırakıldı)

Yani bu fazın çıktısı: **boş ama şemaya uygun, mockup'lardaki tasarımı birebir yansıtan, birkaç örnek/sahte veriyle test edilmiş bir Astro projesi.** Gerçek 145 içerik parçası henüz yok.

---

## 2. Content Collections Şeması

**İlke — spekülatif alan yok:** Şema yalnızca onaylı mockup'larda, yol haritasında veya mevcut içerik yapısında karşılığı bulunan alanları içerir. Gelecekte yararlı olabileceği düşünülen alanlar (örn. ISBN, satın alma bağlantısı) **açık soru olarak not edilir, başlangıç şemasına eklenmez** — önce mockup'a girip onaylanmalı, şema oradan türemeli, tersi değil.

**Önemli teknik düzeltme:** Astro 5'ten itibaren config dosyası `src/content/config.ts` değil **`src/content.config.ts`** (src'nin köküne taşındı) ve her koleksiyon açık bir `loader` (`glob()`, `file()` vb.) gerektiriyor — "sihirli" otomatik yükleme kaldırıldı. Aşağıdaki taslak buna göre yazıldı. Astro 6'da eski konum yalnızca geçici bir uyumluluk bayrağıyla (`legacy.collectionsBackwardsCompat`) çalışıyor — kullanılmayacak, sıfırdan güncel API ile başlanacak.

### Ortak ilke
`alan` (Hapishane/Siyasi Tarih/Göç/Emek/Diğer) hiçbir içerik girdisinde doğrudan tutulmaz. Her girdi yalnızca `topics` taşır; alan üyeliği, `topics` data collection'ı üzerinden **build-time'da türetilir**. Bir içerik birden fazla alana ait konular taşıyorsa otomatik olarak birden fazla Alan Hub'da görünür — manuel "birincil alan" alanı yok.

### Çok dillilik
Her dil sürümü **bağımsız bir content collection girdisidir** — kendi dosyası, kendi slug'ı, kendi frontmatter'ı. `title: {tr: ..., en: ...}` gibi tek-nesne-çok-dilli-alan modeli **kullanılmayacak**. Her girdi kendi `lang` alanını taşır (dosya yolundan tahmin edilmez — `<html lang>`, hreflang, index filtreleme, RSS/sitemap hepsi bu alana bağımlı).

**Çeviri bağlantısı — tek yönlü referans:** Yalnızca ana dil (Türkçe/orijinal) girdisi, `translations` alanında kardeş çevirilerini `reference()` ile işaret eder; çeviri girdilerinde ters yönlü bir alan **tutulmaz**. Böylece bir çeviri eklenip/kaldırıldığında yalnızca tek dosya güncellenir, iki dosyayı senkron tutma yükü olmaz.

**Bu, ters yönlü aramayı zorunlu kılar — isteğe bağlı bir iyileştirme değil.** Her detay sayfasında (dil ne olursa olsun) başlık altında dil cluster'ı gösterileceği için (bkz. Hakkımda mockup'ındaki örnek), İngilizce/Almanca/Fransızca bir sayfanın da kendi cluster'ında diğer dilleri (Türkçe dahil) gösterebilmesi gerekiyor — ama bu sayfa kendi dosyasında "ben kimin çevirisiyim" bilgisini tutmuyor. Dolayısıyla sitenin inşa anında (build-time) tüm koleksiyon bir kez taranıp "hangi Türkçe dosya beni çevirileri arasında gösteriyor" sorusu önceden hesaplanan bir yardımcı fonksiyonla (`src/i18n/translationLookup.ts` gibi) çözülmeli; bu adım atlanırsa çeviri sayfalarında dil cluster'ı eksik/boş çıkar. İlk teknik spike'ta hem ileri (TR→EN) hem geri (EN→TR) yönün doğru çalıştığı ayrıca test edilecek; aynı koleksiyon içinde self-reference çalışmazsa yedek plan `translationKey` (serbest eşleştirme string'i) olacak.

### Merkezi referans koleksiyonları (`topics`, `mecralar`)
`topics` ve `mecralar`, içerik koleksiyonlarından ayrı, `file()` loader'la yüklenen **data collection**'lar olacak. İçerikler bunlara `reference()` ile bağlanır — böylece "olmayan bir konuya/mecraya referans" build-time'da hata verir, sessizce geçmez.

```ts
// src/content.config.ts — taslak, gerçek dosya adları/tipler netleştirilecek
import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const localeSchema = z.enum(['tr', 'en', 'de', 'fr']);

// --- Merkezi referans koleksiyonları ---
const topics = defineCollection({
  loader: file('./src/data/topics.json'),
  schema: z.object({
    ad: z.string(),
    alan: z.enum(['hapishane','siyasi-tarih','goc','emek','diger']),
  }),
});

const mecralar = defineCollection({
  loader: file('./src/data/mecralar.json'),
  schema: z.object({
    ad: z.string(),
    url: z.string().url(),
    yayinEki: z.string(),   // bulunma eki: "Bianet'te yayımlanan..." → "'te"
    iyelikEki: z.string(),  // ilgi eki: "Bianet'in yaptığı..." → "'in"
  }),
});

// site içi göreli yol (/pdf/...) VEYA mutlak URL kabul eden ortak yardımcı şema
const linkSchema = z.string().refine(
  (v) => v.startsWith('/') || URL.canParse(v),
  'Geçerli bir site içi yol veya mutlak URL olmalı.'
);

const ortakAlanlar = {
  title: z.string(),
  lang: localeSchema,
  description: z.string(), // index kart açıklaması + meta description kaynağı
  topics: z.array(reference('topics')).min(1),
  translations: z.array(reference(/* kendi koleksiyonu, spike'ta doğrulanacak */)).optional(),
  // ↑ YALNIZCA ana dil (TR) girdisinde doldurulur; çeviri girdilerinde boş kalır (tek yönlü)
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(), // yoksa description kullanılır
};

const yazilar = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/yazilar' }),
  schema: ({ image }) => z.object({
    ...ortakAlanlar,
    publishDate: z.coerce.date(), // tam tarih (gün dahil)
    mecra: reference('mecralar').optional(),
    // mecra yoksa: UI'da gri "Mustafaeren.net" rozeti gösterilir (bkz. mockup)
    featuredImage: image(), // ZORUNLU (Yazılar'ın standart alanı, opsiyonel değil)
    featuredImageAlt: z.string(), // dekoratifse bilinçli olarak boş string kabul edilir
    pdf: linkSchema.optional(),
    editorNote: z.string().optional(), // nadir/koşullu — arşiv/çeviri notu
  }),
});

const basinda = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/basinda' }),
  schema: ({ image }) => z.object({
    ...ortakAlanlar,
    publishDate: z.coerce.date(),
    mecra: reference('mecralar'), // ZORUNLU — Basında'nın tamamı mecralı
    featuredImage: image(), // ZORUNLU
    featuredImageAlt: z.string(),
    editorNote: z.string().optional(),
    sources: z.array(z.object({
      mecra: reference('mecralar'), tur: z.enum(['birincil','ikincil']),
    })).optional(), // SADECE birden fazla kaynak olduğunda kullanılır
    pdf: linkSchema.optional(),
    // NOT: içerik-türü (Haber/Söyleşi/Podcast) alanı YOK — bilinçli karar
  }),
});

const videolar = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/videolar' }),
  schema: ({ image }) => z.object({
    ...ortakAlanlar,
    publishDate: z.coerce.date(),
    videoTuru: z.enum(['söyleşi','belgesel','konferans-panel','kısa-video']),
    embedUrl: z.string().url(), // ayrı alan — "blind channel-id" kuralı YOK
    // (CNN belgesel embed'i CNN'in kanalından, diğerleri Mustafa'nın kanalından —
    //  script bunu embedUrl'den okur, otomatik tahmin etmez)
    mecra: reference('mecralar').optional(),
    durationMinutes: z.number().int().positive(), // "38 dk" gibi metin DEĞİL — UI dile göre formatlar
    thumbnail: image(), // index kart ızgarası için (128×72 sabit boyut, bkz. mockup)
    thumbnailAlt: z.string(),
  }),
});

const kitaplar = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/kitaplar' }),
  schema: ({ image }) => z.object({
    ...ortakAlanlar,
    year: z.number(), // SADECE YIL — kitaplar gün-bazlı tarihlenmiyor, bilinçli karar
    kitapTuru: z.enum(['yazdıklarım','editörlük','katkılar']),
    yayinevi: z.string(),
    sayfaSayisi: z.number(),
    kapak: image(), // object-fit: contain ile gösterilecek, kırpma YOK
    kapakAlt: z.string(),
    yayineviUrl: z.string().url().optional(),
    seri: z.string().optional(), // örn. "TCPS Kitaplığı" — badge olarak gösterilir, ayrı kategori DEĞİL
    pdf: linkSchema.optional(),
  }),
});

export const collections = { topics, mecralar, yazilar, basinda, videolar, kitaplar };
```

**Netleşmeyen bir nokta — `originalLanguage` alanı önerilmedi:** `lang` zaten her girdinin kendi dilini taşıyor, çeviri grubu da `reference`/`translationKey` ile kuruluyor; "orijinal dil" ayrıca ne çözer belirsiz. Gerçek bir ihtiyaç ortaya çıkarsa eklenir.

**`/mecra/{slug}/` sayfası açıklama şablonu (build-time üretilir, elle yazılmaz), `mecralar` koleksiyonundaki `yayinEki`/`iyelikEki`'ye dayanır:**
- Yalnızca Yazılar varsa: `"{mecra.ad}{mecra.yayinEki} yayımlanan yazıları bir araya getiren arşiv."`
- Yalnızca Basında varsa: `"{mecra.ad}{mecra.iyelikEki} yaptığı söyleşi ve haberleri bir araya getiren arşiv."`
- İkisi birden varsa: `"{mecra.ad}{mecra.yayinEki} yayımlanan yazıları ve {mecra.ad}{mecra.iyelikEki} yaptığı söyleşi/haberleri bir araya getiren arşiv."`

---

## 3. i18n / Routing Kararları

- Türkçe varsayılan dil, URL'de prefix yok. EN/DE/FR sırasıyla `/en/`, `/de/`, `/fr/` altında.
- **Genel/indeks sayfaları** (ana sayfa, Hakkımda, İletişim, 4 içerik tipinin indeksleri) → 4 dilde gerçek, ayrı URL (örn. `/hakkimda/`, `/en/about/`, `/de/ueber-mich/`, `/fr/a-propos/`). Nav/footer/UI metinleri sayfanın URL diline göre.
- **İçerik detay sayfaları** (Yazı/Basında/Kitap/Video) → yalnızca gerçekten mevcut çeviri varsa ayrı URL. Sahte/boş/fallback dil sayfası YOK.
- **Reddedilen yaklaşım (uygulanmayacak):** URL sabit kalıp sadece chrome dilinin localStorage ile değişmesi. Sebep: hydration flicker, JS kapalıyken çalışmama, URL'in gerçek sayfa dilini yansıtmaması, `<html lang>`/hreflang belirsizliği.
- **İçerik detay sayfalarında site geneli dil switcher'ı AYRICA gösterilmez** — orada yalnızca başlık altındaki içerik-düzeyi dil cluster'ı (`translations` alanından üretilir) kullanılır; aynı bilginin switcher + cluster olarak iki kez tekrarı önlenir.
- `hreflang` yalnızca gerçekten mevcut sürümler için üretilir; `x-default` Türkçe sürüme işaret eder.
- Astro, bir sayfanın her locale'de var olmasını şart koşmuyor — route'lar dosya yapısından/`getStaticPaths()` çıktısından üretiliyor; İngilizce route üretilmezse `/en/...` sayfası da oluşmuyor. Yani "bazı içerikler yalnızca Türkçe" durumu tek başına manuel routing (`i18n.routing: "manual"`) gerektirmiyor — bu, kendi kendine middleware'i devre dışı bırakıp tüm yönlendirme mantığını geliştiriciye yıkan, gereksiz karmaşıklık yaratabilecek bir seçim. **Başlangıç tercihi olmayacak**, standart i18n yapılandırmasıyla çözülemeyen somut bir ihtiyaç çıkarsa değerlendirilecek.
- Yine de bu, kısmi çeviri + genel/içerik sayfası ayrımı + hreflang'ın bir arada doğru çalıştığı ilk kurulum, dolayısıyla erken bir teknik spike'la doğrulanmalı (bkz. aşağıdaki 2A adımı): dört dilde bir genel sayfa, yalnızca Türkçe bir içerik, TR+EN çevirisi olan bir içerik — üçü de test edilip route/hreflang/`<html lang>` doğru üretiliyor mu kontrol edilecek.

---

## 4. Tasarım sabitleri (mockup'lardan birebir alınacak)

- Sayfa genişliği: 680px (site geneli tutarlılık, kanlipazar.net ile de uyumlu). **İstisna — Video sayfaları (Video detay + Videolar index): 760px, bilinçli bir karar.** Diğer tüm sayfalar 680px'te kalır; bu tek istisna, mockup'ların ("video-detay-mockup.html", "videolar-index-mockup-v10.html") kendisinde zaten uygulanmıştı, sonradan tutarsızlık sanılıp geri 680'e çekilmemeli.
- Ana sayfa dışında bütün index, hub, arşiv ve detay sayfalarında breadcrumb bulunur (ana sayfada anlamsız, konmaz). Görsel breadcrumb ile JSON-LD `BreadcrumbList` aynı veri kaynağından üretilir — breadcrumb'ın temel işlevi navigasyon, structured data onun yapısal karşılığı, tersi değil.
- Kitap kapakları: `object-fit: contain`, kırpma yok
- Görsel "cila" (arka plan dokusu, hero detayları) bilinçli olarak Faz 7'ye ertelendi — bu fazda mockup'lardaki sade hali yeterli, erken optimizasyon yapılmayacak
- Renkler, tipografi, spacing: her mockup dosyasının `<style>` bloğundaki CSS custom properties kaynak alınacak — burada tekrarlanmadı, mockup dosyaları otoriter kaynak

**Önemli — mockup'lar birebir kopyalanmayacak, önce bileşen envanteri çıkarılacak:** "14 mockup'ı sırayla şablona çevir" ifadesi yanlış anlaşılmaya açık; her dosyanın CSS'ini ayrı ayrı taşımak 14 sayfada tekrarlanan stil üretir — zaten roadmap'in kendi ilkesiyle (Yazı/Basında'nın `press-list`/`press-row` gibi paylaşılan bileşenleri, ayrı ayrı icat edilmedi) çelişir. Bunun yerine:
- Mockup'lar görsel referanstır, kod kaynağı değil
- Ortak design token'lar tek global dosyada (`src/styles/tokens.css`) birleştirilir
- Aynı görünüm ortak component + variant'larla üretilir (örn. `PressRow.astro` hem Yazılar hem Basında index'inde kullanılır)
- Mockup'lar arasında aynı değişkenin farklı değeri varsa roadmap'teki son karar esas alınır
- Önerilen klasörleme: `components/{layout,navigation,content,cards,metadata}/`, `layouts/{BaseLayout,ContentLayout,IndexLayout}.astro`, `styles/{tokens,global,components}.css`, `i18n/{ui,routes}.ts`

---

## 5. Bilinmesi gereken, henüz çözülmemiş noktalar

- "Hapishane" ve "Göç" konu adlarının kendi alanlarıyla çakışması — Faz 3'te gerçek XML export'ta çözülecek, şimdilik `taksonomi-denetimi.md`'deki ilkeye göre bilgilendirilmiş olarak ilerlenmeli
- Eski WordPress URL'lerinden yeni yapıya 301 yönlendirme haritası henüz çıkarılmadı (Faz 6)
- Yazılar/Basında'nın gerçek distinct içerik sayısı XML export'a kadar kesinleşmeyecek (~136 WordPress kategorisi muhtemelen çeviri kategorilerini de içeriyor)
- **Kitap şemasında ISBN, satın alma bağlantısı, içindekiler alanları YOK — bilinçli olarak eklenmedi.** Bunlar `kitap-detay-mockup.html`'de onaylanmış bir CTA/alan değil (mockup'ta sadece "PDF'yi oku", "Yayınevi sayfası", "Kitap hakkında" var); gerçekten istenirse önce mockup'a eklenip onaylanmalı, şema oradan türemeli — tersi değil.

---

## 6. Önerilen sıralama

### 2A — Teknik temel ve spike
1. `npm create astro@latest` — TypeScript strict, boş/minimal template
2. `src/content.config.ts` (loader tabanlı) içinde yukarıdaki şemayı kur; `topics` ve `mecralar` data collection'larını birkaç örnek girdiyle doldur
3. Dil modelini üç test vakasıyla doğrula: (a) 4 dilde bir genel sayfa, (b) yalnızca Türkçe bir içerik, (c) TR+EN çeviri grubu olan bir içerik — route üretimi, `reference()` ile çeviri bağlantısı (hem TR→EN ileri yön hem EN→TR ters-arama yönü), `hreflang`/`x-default`/`<html lang>` hepsi doğru mu?
4. `npm run astro check` + production build ile şemanın gerçekten hatasız derlendiğini doğrula

### 2B — Tasarım sistemi
5. 14 mockup'tan bir **bileşen envanteri** çıkar (hangi UI parçası kaç mockup'ta tekrarlanıyor) — bkz. yukarıdaki "önce bileşen envanteri" notu
6. Global design token'lar, `BaseLayout`, nav/footer, breadcrumb, meta-cluster/dil-cluster/badge/press-row gibi paylaşılan bileşenler

### 2C — Sayfa şablonları
7. Yazı/Basında index+detay, Mecra arşivi, Kitap index+detay, Video index+detay, Alan/Konu hub'ları, Ana sayfa, Hakkımda, İletişim

### 2D — Doğrulama
8. Her şema için örnek girdiler; bozuk `topics`/`mecra` referansı kasıtlı test edilip build'in gerçekten patladığından emin olunması; eksik çeviri için sahte route oluşmadığının kontrolü; responsive + klavye navigasyonu + JS kapalıyken temel kullanım; Lighthouse

### Ayrıca
- Footer ikonları için **ilk tercih** Simple Icons (zorunlu değil) — X, Facebook, LinkedIn, Academia, YouTube, Bluesky, Google Scholar (7 ikon, mail ikonu YOK); Academia/Scholar'ın pakette gerçekten karşılığı olup olmadığı kurulumda doğrulanmalı, yoksa uygun resmi vektör kaynağa geçilir. Marka adları için `aria-label`, dış bağlantılarda `rel="noopener"` unutulmamalı.
