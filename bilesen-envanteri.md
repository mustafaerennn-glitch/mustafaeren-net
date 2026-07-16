# Bileşen Envanteri — Faz 2B Çıktısı

14 mockup HTML dosyası tek tek okunarak çıkarıldı. Amaç: "14 mockup'ı sırayla şablona çevir"
yerine, aynı UI parçasının kaç dosyada tekrarlandığını görüp ortak Astro component'lerine
karar vermek. Mockup'lar görsel referans, kod kaynağı değil (talimat dosyasındaki ilke).

---

## 1. Design token'lar (12 CSS custom property, 14 dosyada birebir aynı)

```css
--surface-2: #ffffff;   --surface-1: #f1efe8;   --surface-0: #f7f6f2;
--text-primary: #1a1a18; --text-secondary: #5f5e5a; --text-muted: #888780;
--text-accent: #185fa5;  --border: rgba(0,0,0,0.1);
--fill-primary: #1a1a18; --on-primary: #ffffff; --radius: 8px;
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
```

14 dosyanın da `:root` bloğu harf harf aynı — hiç sapma yok. Doğrudan
`src/styles/tokens.css`'e taşınabilir, mockup'lar arası "hangi değer esas alınacak"
tartışması bu dosyada hiç çıkmadı.

---

## 2. Sayfa düzeni (Layout) bileşenleri

| Bileşen | Görüldüğü dosyalar | Not |
|---|---|---|
| `.page` (max-width container) | 14/14 | **Tutarsızlık:** 12 dosya `680px`, ama `video-detay-mockup.html` ve `videolar-index-mockup-v10.html` `760px` kullanıyor. Roadmap "Sayfa genişliği: 680px (site geneli tutarlılık)" diyor — video sayfalarının 760px'i bu kararla çelişiyor. **Açık soru, aşağıda ayrıca not edildi.** |
| `nav` / `nav.topnav` (Nav) | 14/14 | Ana sayfa düz `<nav>`, diğer 13 dosya `<nav class="topnav">` — CSS'leri aynı, sınıf farkı kozmetik. Brand + 7 nav öğesi (Yazılar/Videolar▾/Kitaplar▾/Basında/Konular▾/Hakkımda/İletişim), `.current` ile aktif öğe işaretleniyor. Konu/Alan hub, Mecra arşiv sayfalarında bilinçli olarak **hiçbir öğe current değil**. |
| `.breadcrumb` | 12/14 (ana sayfada yok — bilinçli) | JSON-LD BreadcrumbList için de aynı veri kaynağı kullanılacak (talimat). |
| `footer` / `.social-icons` | 14/14 | **Tutarsızlık — önemli:** 12 dosya eski 5-ikon setini taşıyor (X/Facebook/LinkedIn/Academia-üçgen/Mail). Yalnızca `hakkimda-mockup.html` ve `iletisim-mockup.html` roadmap'te finalize edilen 7-ikon setini taşıyor (X/Facebook/LinkedIn/**Academia-ince-A**/**YouTube**/**Bluesky**/**Google Scholar**, Mail kaldırılmış). Roadmap "14 dosyanın tamamına uygulandı" diyor ama dosyalarda öyle değil. **Astro'da Footer.astro, roadmap'in finalize kararına ve gerçek Simple Icons paketine göre kurulacak — 12 dosyadaki eski hali değil.** |

---

## 3. İçerik-detay ortak bileşenleri (Yazı + Basında + Video + Kitap arasında paylaşılan)

| Bileşen | Dosyalar | Not |
|---|---|---|
| `.mecra-rozeti` (+ `--local` varyantı) | Yazı detay, Basında detay | Dış link (↗), detay sayfasına özgü. Index'teki mecra göstergesinden (`.press-source-text`) kasıtlı olarak farklı — orada siteiçi `/mecra/` linki, ↗ yok. |
| `.meta-cluster` / `.meta-line` / `.lang-current` | Yazı detay, Basında detay | Tarih + diğer diller + PDF, tek blok, üçü de koşullu. |
| `.editor-note` | Yazı detay (CSS var, örnek kullanılmamış), Basında detay (kullanılmış örnek) | Arşiv notu + çeviri notu için tek bileşen. |
| `.preview-image` / `.preview-caption` | Yazı detay, Basında detay | `object-fit: contain`, max-height 320px. |
| `.article-body` | Yazı detay, Basında detay | Basında'da ek olarak `blockquote` stili var, Yazı'da yok — küçük varyant farkı. |
| `.share-row` / `.share-icons` | Yazı detay, Basında detay | Facebook/X/WhatsApp/E-posta — footer'daki takip ikonlarından kasıtlı ayrı. |
| `.topics-row` / `.area-pill` / `.topics-divider` / `.topic-pill` | Yazı detay, Basında detay, Video detay, Kitap detay | **4/4 detay sayfasında birebir aynı** — net bir `TopicsRow.astro` adayı. |
| `dialog#about-modal` (+ `.modal-meta`, `.modal-close`) | Video detay, Kitap detay | Birebir aynı yapı — `AboutModal.astro`. |
| `.role-eyebrow` | Video detay, Kitap detay | Video'da "Söyleşi" tip etiketi, Kitap'ta "Yazar/Editör" rolü — aynı görsel bileşen, farklı veri kaynağı. |

### 3a. "İlgili içerik listesi" — üç farklı isimle aynı bileşen (birleştirilmesi gereken tutarsızlık)

Dört yerde neredeyse birebir aynı satır deseni (sabit genişlikte tarih + tip/kaynak rozeti +
başlık, ok yok) görülüyor ama **her seferinde farklı class ismiyle**:

- `.related-row` (Yazı detay, Basında detay, Video detay → "İlgili içerikler")
- `.content-row` (Alan Hub, Konu sayfası → "Alandaki tüm içerik")
- `.press-row` / `.press-date` / `.press-source` (Kitap detay → "Kitap üzerine" — **aynı isim, index'teki `.press-row`'dan tamamen farklı yapı!**)

Bu üçü, sitenin geneline yayılan tek bir "ContentListRow" bileşeninin farklı mockup
oturumlarında farklı adlandırılmış hali. **Astro'da tek `ContentListRow.astro` (date, badge,
title, opsiyonel topic/area rozeti prop'larıyla) olarak kurulacak**, dört farklı class ismi
korunmayacak.

**Dikkat:** Bu, index sayfalarındaki `.press-row` (bkz. §4) ile **karıştırılmamalı** — o, tamamen
ayrı bir bileşen (tıklanabilir tam satır + ok ikonu + iki katmanlı başlık/meta). İsim çakışması
yalnızca Kitap detayının mockup'ında var, gerçek koddan kaynaklanmıyor.

---

## 4. Index / liste sayfaları ortak bileşenleri

| Bileşen | Dosyalar | Not |
|---|---|---|
| `.press-list` / `.press-row` / `.press-main` / `.press-title` / `.press-meta` / `.press-source-text` (+ `--local`) / `.press-arrow` | Yazılar index, Basında index, Mecra arşiv | **3/3'te birebir aynı** — roadmap'in kendi ilkesiyle tutarlı (`PressRow.astro` tek component, hem Yazılar hem Basında'da). Mecra arşivde ek olarak `.type-tag` (Yazı/Basında ayrımı, mecra rozeti yok çünkü zaten hepsi aynı mecra). |
| `.pills` / `.pill` (+ `.active`) | Yazılar index, Videolar index, Kitaplar index, Alan Hub, Konu sayfası | 5/14 dosyada. Konu sayfasındaki pill'ler farklı bir varyant: içinde küçük SVG ikon var (`.pill svg`) — `Pill.astro`'ya opsiyonel icon slot eklenmeli. |
| `.pagination` / `.page-num` (+ `.active`, `.next`) | Yazılar index, Basında index, Videolar index, Kitaplar index, Alan Hub, Konu sayfası, Mecra arşiv | **7/14 dosyada birebir aynı**, hiç sapma yok. |
| `.video-card` / `.thumb` / `.play-badge` / `.duration-tag` / `.video-info` / `.video-title` / `.video-meta-row` / `.type-badge` / `.area-pill` | Videolar index, Video detay ("Diğer videolar") | Birebir aynı kart. |
| Kitap kapak kartı | Ana sayfa (`.book-cover`+`.book-title`, sade), Kitaplar index (`.book-card`+`.cover`+`.book-meta`+`.seri-mark`, zengin), Kitap detay "Diğer kitaplar" (`.other-book-cover`+`.other-book-year`, rol+yıl) | **3 farklı varyant, aynı temel fikir** (kapak + başlık + meta). `BookCard.astro` tek component + `variant="compact\|grid\|detail"` prop'uyla kurulacak. |

---

## 5. Sayfaya özgü, tekil bileşenler

| Bileşen | Dosya | Not |
|---|---|---|
| `.hero`, `.avatar`, `.cta-row`, `.btn-primary`/`.btn-secondary`, `.project-card`, `.areas-grid`/`.area-card`, `.feed-row` | Ana sayfa | Yalnızca burada. |
| `.embed` (16:9 video placeholder) | Video detay | YouTube iframe için yer tutucu, gerçek implementasyonda lazy-load iframe olacak (mockup'ta not edilmiş). |
| `.book-hero` / `.cover` / `.book-info` / `.badges`/`.badge` (+ `.seri`) | Kitap detay | Yalnızca burada. |
| `.topics-grid` / `.topic-card` / `.topic-bar`/`.topic-bar-fill` | Alan Hub | Konu dağılım çubuklu kartlar — hub sayfasının imzası. |
| `.mecra-section` / `.mecra-pills` / `.mecra-pill` | Alan Hub, Konu sayfası | 2/14 — "yayınlandığı mecralar" bloğu. |
| `.related-section` / `.related-pills` / `.related-pill` | Konu sayfası | Yalnızca burada ("ilgili konular"). |
| `.sources-section` / `.sources-group` / `.source-row` | Basında detay | Yalnızca burada, SADECE çoklu kaynak durumunda render edilir (talimatta zaten belirtilmiş). |
| `form.contact-form` / `.field` / `.submit-btn` / honeypot | İletişim | Netlify Forms — yalnızca burada. |
| `.lang-switch` | Hakkımda | Bu mockup'a özgü JS-simülasyonu; gerçek sitede yerini gerçek routing alacak ama görsel dil (meta-cluster'daki dil satırıyla tutarlı) korunacak. |
| `.books-box` / `.books-list` | Hakkımda | Ana sayfadaki proje kartına benzer "kutu" tasarımı, ama kendi stil kümesi. |
| `.note` | Alan Hub | "/alanlar/ vs /konu/ ayrımı" açıklaması — bunun gerçek kullanıcıya gösterilen bir UI notu mu yoksa yalnızca mockup-içi geliştirici notu mu olduğu netleşmeli (aşağıda açık soru). |

---

## 6. Tespit edilen tutarsızlıklar (2C öncesi karar gerektirir)

1. **Sayfa genişliği — KARARLAŞTIRILDI (2026-07-15):** Site geneli kural roadmap'teki gibi
   `680px` kalıyor. Video detay + Videolar index için `760px` **bilinçli bir istisna** olarak
   korunuyor (video kartının yatay düzeni — 128×72 thumbnail + yan bilgi — 680px'te sıkışacağı
   için). `tokens.css`'te `--page-width: 680px` genel değişken olacak, video sayfaları kendi
   layout'unda bunu `760px` ile override edecek; bu, "tek kaynaklı token, bilinçli istisna"
   ilkesiyle tutarlı (alan/konu ayrımındaki "URL'de değil veri modelinde" mantığına benzer —
   istisna gizlenmiyor, açıkça işaretleniyor).
2. **Footer ikon seti:** 12/14 dosya eski (Mail dahil, Academia üçgen), 2/14 dosya (Hakkımda,
   İletişim) yeni/final (7 ikon, Mail yok). **Karar:** Footer.astro roadmap'in finalize ettiği
   7-ikon setini kullanacak — bu zaten talimat dosyasında da istenen yön (Simple Icons'tan
   gerçek ikonlar). Diğer 12 mockup dosyası güncellenmeyecek, sadece referans olarak kalacak.
3. **"İlgili içerik" satırı üç farklı isimle var** (§3a) — tek `ContentListRow.astro`'da
   birleştirilecek.
4. **Alan Hub'daki `.note` bloğu** — kullanıcıya mı gösterilecek yoksa geliştirici notu mu,
   netleşmedi. Muhtemelen gerçek kullanıcıya da faydalı (URL ayrımını açıklıyor), o yüzden
   şimdilik **UI bileşeni olarak kabul edilip** taşınacak; yanlışsa 2C'de kolayca çıkarılır.
5. **`--text-muted` renk tonu — KARARLAŞTIRILDI (2026-07-15, 2D Lighthouse denetiminde):**
   Mockup'taki `#888780`, `surface-0/1/2` zeminlerinde WCAG AA'nın altında kalıyordu (3.1-3.6:1,
   gereken 4.5:1). Kullanıcı onayıyla `#6b6b63`'e koyulaştırıldı — tüm zeminlerde 4.5:1+ sağlıyor,
   "soluk" hissi korunuyor. 14 mockup dosyası değiştirilmedi, yalnızca gerçek `tokens.css`.
6. **Açık soru — Lighthouse'ta tespit edildi, henüz çözülmedi:** Dil cluster'ındaki linkler
   (`.lang-cluster a`, meta-cluster'daki "English" gibi) mockup kararı gereği `text-decoration:
   none` (yalnızca hover'da alt çizgi) — bu, çevresindeki soluk metinle yeterli kontrast
   oluşturmadığı için WCAG'ın "yalnızca renkle ayırt edilebilirlik yetmez" kuralını ihlal
   ediyor (Lighthouse: `link-in-text-block`). Kullanıcı kararıyla şimdilik dokunulmadı — Faz 7
   görsel cila turunda veya ayrı bir erişilebilirlik geçişinde ele alınabilir.

---

## 7. Önerilen klasörleme (talimat dosyasındaki öneriyle uyumlu)

```
src/
  styles/
    tokens.css          — §1
    global.css
  layouts/
    BaseLayout.astro     (zaten var, i18n spike'tan)
    ContentLayout.astro  — Yazı/Basında/Video/Kitap detay ortak iskeleti
    IndexLayout.astro    — 4 içerik tipi index'i + Alan/Konu hub ortak iskeleti
  components/
    layout/    Nav.astro, Footer.astro, Breadcrumb.astro
    metadata/  MecraRozeti.astro, MetaCluster.astro, EditorNote.astro, TopicsRow.astro, LangCluster.astro
    content/   PreviewImage.astro, ArticleBody.astro, ShareRow.astro, SourcesBlock.astro, AboutModal.astro
    cards/     BookCard.astro (variant prop), VideoCard.astro, ContentListRow.astro
    navigation/ PressList.astro/PressRow.astro, Pills.astro, Pagination.astro
  i18n/
    ui.ts, routes.ts, translationLookup.ts   (zaten var)
```

---

*Bu envanter 2C'ye (sayfa şablonları) geçmeden önce onay için hazırlandı — mockup'ların hiçbiri
değiştirilmedi, yalnızca okundu ve karşılaştırıldı.*
