# mustafaeren.net — Statik Site Göçü Yol Haritası

**Amaç:** WordPress.com'daki kişisel siteyi (mustafaeren.net), Kanlı Pazar'da kullanılan altyapıyla (GitHub + Netlify + Namecheap) statik bir siteye taşımak — ama düz bir kopya değil, içerik ve SEO amaçlarına göre yeniden kurgulanmış bir bilgi mimarisiyle.

**Referans proje:** kanlipazar.net (tamamlanmış statik göç, elle HTML/CSS ile kuruldu — bu projede ölçek çok daha büyük olduğu için elle değil bir SSG ile ilerliyoruz)

---

## Karara bağlanmış noktalar

- **Barındırma/deploy:** GitHub + Netlify + Namecheap (domain zaten Namecheap'te)
- **Statik site üretici (SSG):** Astro — ücretsiz, açık kaynak
- **Netlify kredisi:** Push başına 15 kredi, toplu göç tek push'ta yapılacağı için endişe edilecek bir kısıt değil
- **İçerik türleri (tip):** Yazı (~65), Basında/Söyleşi (~38), Video (23), Kitap (19) — hepsi ayrı, simetrik indeks sayfalarına sahip (`/yazilar/`, `/videolar/`, `/kitaplar/`, `/basinda/`)
- **Yazılar/Basında sayı belirsizliği**: WordPress kategori toplamı (136) distinct içerik sayısı değil — yabancı dil kategorileri (English/Deutsch/Français, 33) muhtemelen Yazılar/Basında'nın çevirisi. Gerçek distinct sayı Faz 3'teki XML export'ta netleşecek.
- **Konu sayfaları (`/konu/...`):** Ayrı, kendi başına duran "hub" sayfalar — bkz. `konu-sayfasi-tasarimi.md`
- **Alan katmanı:** Kanonik konuları gruplayan üst katman (Hapishane, Siyasi Tarih, Göç, Emek, Diğer) — bkz. `taksonomi-denetimi.md`. URL'e gömülü değil, tek kaynaklı metadata (`topics.json` benzeri)
- **TCPS Kitaplığı:** Biyografi sayfasında kalacak, ana sayfada öne çıkarılmayacak, hero bio metnine de girmeyecek
- **Kayyum uygulamaları sitesi:** Ayrı bir proje, ileride kurulacak
- **Kitaplar'da üçüncü kategori:** Yazdıklarım / Editörlük'e ek olarak **Katkılar** (Bölüm yazarı / Katkı yazarı — kitabı sen yazmadın ama bir bölümüyle katkıda bulundun). Gerçek sayı: 2 kitap.
- **Yazılar ile Basında ayrımı, "nerede yayınlandığına" değil "kim yazdığına" dayanıyor:** Yazı = sen yazdın (ilk kez başka bir mecrada çıkmış olsa bile). Basında = biri seninle söyleşi yaptı / senin hakkında yazdı / senden alıntı yaptı. Bir gazetede yayımlanan senin yazdığın bir metin Basında'ya değil Yazılar'a girer.
- **CV (Almanca, yapılandırılmış özgeçmiş) siteden tamamen çıkarılıyor.** Eski sitede "Özgeçmiş" dropdown'ı altında Bio'dan (4 dilli, nesir, akademik/araştırmacı kimliğe hitap eden) ayrı bir sayfa olarak duruyordu — kronolojik iş deneyimi, İsviçre'deki güncel işi (AOZ, mülteci merkezi), dil seviyeleri gibi bir iş başvurusu belgesiydi, site amacına (araştırma/yazı arşivi) uymuyordu. Yeni sitede tek "Hakkımda" sayfası kalacak, sadece Bio içeriğine dayalı.

---

## Ana sayfa mimarisi (finalize edildi)

Sıralama: Nav → Hero (profil fotoğraflı) → Kanlı Pazar proje kartı → Araştırma alanları (kenarlıklı kart, ikon+isim+sayı) → Son eklenenler (4 tipi de kapsayan tek kronolojik akış, 5 öğe, tip rozetli) → Kitaplar (5 kart, kompakt ızgara) → Footer (genişletilmiş sosyal linkler: X, Facebook, LinkedIn, Academia, mail)

- Hero bio: *"Hapishane politikaları, göç, insan hakları ve yakın siyasal tarih üzerine araştırmalar yapan, yazan ve dijital arşivler geliştiren sosyolog ve araştırmacı."*
- **Not:** Hakkımda sayfası Bio metnindeki "çalışma alanlarım" cümlesi de aynı tutarlılıkla güncellendi — "göç" eklendi: *"...hapishaneler/kapatılma, emek, toplumsal hareketler, siyasi tarih, göç ve dezavantajlı gruplardır."* (Hero bio zaten göçü içeriyordu, Hakkımda'daki uzun metin eksikti.)
- "Son Yazılar" + "Basında" ayrı bölümleri kaldırıldı, tek "Son eklenenler" akışında birleşti (video ve kitap da dahil)
- Araştırma alanları kartları Kitaplar kartlarından görsel olarak ayrışıyor (kenarlıklı, ikonlu, ortalanmış içerik — kitap kapağı stiliyle karışmasın diye)

## Nav mimarisi (finalize edildi)

`Yazılar` · `Videolar ▾` · `Kitaplar ▾` · `Basında` · `Konular ▾` · `Hakkımda` · `İletişim`

- **Videolar dropdown**: Tümü / Söyleşi / Belgesel / Konferans-Panel / Kısa videolar → `video-türü` alanından otomatik türer
- **Kitaplar dropdown**: Tümü / Yazdıklarım / Editörlük / **Katkılar** → `kitap-türü` alanından otomatik türer
- **Konular dropdown**: Hapishane / Siyasi Tarih / Göç / Emek / Diğer + "Tüm konular" linki → alan katmanından otomatik türer
- **Basında ve Yazılar ayrı top-level öğeler olarak kalıyor, ikisi de dropdown'suz düz nav öğesi** — birleştirilmedi (biri birincil üretim, diğeri dışsal görünürlük; farklı kavramlar)
- Nav dropdown öğeleri ilgili sayfaya önceden filtrelenmiş gider (örn. Belgesel → `/videolar/?tur=belgesel`, sayfadaki pill otomatik aktif); dropdown ve sayfa-içi pill aynı veri kaynağını okur, ayrı yönetilmez
- Dil değiştirici (TR/EN/DE/FR) — Yazılar dropdown'ına gömülmesi reddedildi (kategori-bazlı çok dillilik, tam olarak eski WordPress sitesinin SEO sorunuydu). Ayrıntılı tasarım kararı için bkz. aşağıdaki "Çok dillilik ve dil değiştirici" bölümü.

---

## Çok dillilik ve dil değiştirici (finalize edildi)

Site, **kısmi çok dillilik modeliyle** kurulacak: bu bir "her sayfa 4 dilde var" sitesi değil, ağırlıklı Türkçe bir araştırma arşivi olup bazı içeriklerin çevirileri mevcut. Bu ayrım, aşağıdaki tüm kararların temelini oluşturuyor.

**URL ve routing:**
- Türkçe varsayılan dil; varsayılan dil URL'lerinde prefix kullanılmaz. İngilizce, Almanca, Fransızca sırasıyla `/en/`, `/de/`, `/fr/` altında yer alır.
- Ana sayfa, Hakkımda, İletişim ve içerik indeks sayfaları gibi **genel/indeks sayfalarının** dört dilde gerçek URL'leri olur (örn. `/hakkimda/`, `/en/about/`, `/de/ueber-mich/`, `/fr/a-propos/`). Bu sayfalarda nav, footer, başlıklar, açıklamalar, filtreler ve diğer arayüz metinleri sayfanın URL diline göre çevrilir.
- Yazı, Basında, Kitap, Video gibi **içerik detay sayfalarında** yalnızca gerçekten mevcut dil sürümleri için ayrı URL üretilir. Çevirisi olmayan bir içerik için sahte, boş veya fallback URL oluşturulmaz — örn. sadece Türkçe olan bir yazının `/en/articles/...` karşılığı hiç yoktur.
- **Reddedilen yaklaşım:** URL sabit kalıp yalnızca chrome dilinin (nav/UI) localStorage gibi bir istemci-taraflı tercihle değişmesi. Bu, hydration sırasında dil değişikliği/flicker, JS kapalıyken çalışmama, URL'in sayfanın gerçek dilini yansıtmaması ve `<html lang>`/hreflang/erişilebilirlik açısından belirsizlik yaratır. Her sayfanın URL'si, chrome'u ve içerik dili birbiriyle tutarlı olmalı.

**Content schema:**
- Her dil sürümü **kendi dosyasına, slug'ına, frontmatter alanlarına ve URL'sine sahip bağımsız bir content collection girdisidir.** Dil sürümleri `translations` alanıyla birbirine bağlanır (dil → gerçek URL eşlemesi, yalnızca mevcut çeviriler için).
- `title.tr` / `title.en` gibi tek içerik nesnesi içinde çok dilli alan modeli **kullanılmayacaktır** — bu, slug, yayın tarihi, öne çıkan görsel, SEO açıklaması gibi alanların çeviriler arasında farklı zamanlarda/bağımsız yönetilmesini gereksiz yere zorlaştırır.

**Site geneli switcher ile içerik-düzeyi dil cluster'ının iş bölümü:**
- **Genel/indeks sayfalarında** (ana sayfa, Hakkımda, İletişim, Yazılar/Videolar/Kitaplar/Basında indeksleri): site geneli dil değiştirici görünür, yalnızca gerçekten var olan karşı sayfalara yönlendirir.
- **İçerik detay sayfalarında** (Yazı, Basında, Kitap, Video): site geneli switcher ayrıca gösterilmez. Dil geçişi ve çeviri mevcudiyeti yalnızca başlık altındaki içerik-düzeyi dil cluster'ı üzerinden yönetilir — aynı dil bilgisinin sayfada iki kez tekrarlanması (switcher + cluster) böylece önlenir.
- İçerik cluster'ı yalnızca `translations` alanındaki mevcut çevirileri linkler; mevcut dil koyu/tıklanamaz, olmayan diller pasif gösterilebilir veya sade bir "yalnızca Türkçe mevcut" notuna indirgenebilir — dört dili her sayfada zorunlu sıralamak şart değil, amaç gürültüyü azaltmak.
- Yabancı dildeki bir indeks sayfasında (örn. `/en/articles/`) farklı dildeki içerikler (örn. sadece Türkçe bir yazı) listelenebilir; özgün başlık korunur, içerik dili tıklamadan önce bir rozetle (TR/EN/DE/FR) açıkça belirtilir. Kullanıcı tıkladığında içeriğin kendi kanonik URL'sine ve o sayfanın gerçek diline geçer — chrome da o dile döner. Bu beklenmedik değil, dürüst bir davranış: kullanıcı artık o dildeki gerçek belgeye girmiştir.

**hreflang / canonical:**
- Yalnızca gerçekten mevcut dil sürümleri için `hreflang` üretilir; olmayan bir çeviri için sahte/boş hreflang eklenmez. `x-default`, Türkçe varsayılan sürüme (veya sayfa türüne göre uygun varsayılan girişe) işaret eder.

**Kapsam dışı bırakılan (ayrı faz):**
- Otomatik/AI destekli çeviri, insan editörlüğü ve eski arşivin hangi sırayla (örn. son yazılardan başlayarak) çevrileceği — bu, switcher mimarisinden ayrı bir **içerik üretimi fazı** (Faz 4-5 civarı) olarak ele alınacak, burada karara bağlanmadı.

---

## Yazı / Basında detay ve indeks tasarım kararları (finalize edildi)

Bu iki içerik türü, aynı temel bileşenleri paylaşan tek bir tasarım dili olarak kuruldu — ayrı ayrı icat edilmedi.

**Ortak satır bileşeni (indeks):** `press-list` / `press-row` — tarih, koşullu mecra rozeti, tıklanabilir başlık. Yazılar ve Basında index'i bu bileşeni birebir paylaşıyor; hiyerarşi ikisinde de aynı (`Tarih · Mecra · Başlık`), farklı göstermeye çalışmak gereksiz karmaşıklık olurdu.

**Mecra rozeti — HER ZAMAN render edilir, koşullu gizleme yok:**
İçeriğin büyük çoğunluğu (Yazılar'ın ~%95'i, Basında'nın tamamı) bir mecrada yayınlanmış olduğu için, mecrasız içerikte rozeti tamamen kaldırmak "unutulmuş" izlenimi verir. Bunun yerine:
- Mecra varsa: mavi renk, `↗` ikonu, tıklanabilir, `target="_blank"` (dış bağlantı)
- Mecra yoksa (siteye özgü içerik): gri renk, **"Mustafaeren.net"** sabit metni, tıklanamaz (`.mecra-rozeti--local` / `.press-source--local` varyantı)
- **İndeks'te** rozet `/mecra/{slug}/` sayfasına gider (siteiçi arşiv, `↗` yok)
- **Detayda** rozet dış kaynağa gider (`↗` var) — aynı görsel dil, farklı hedef

**`↗` vs `↓` kuralı:** `↗` = dış siteye çıkan bağlantı (mecra rozeti, kaynaklar listesi). `↓` = siteye ait bir dosyayı indirme (PDF). Bu ayrım tutarlı tutulmalı; PDF'e `↗` konmaz.

**Meta-küme (detay sayfası, başlığın altında, tek blok):**
- Tarih (tam tarih, gün dahil — örn. "18 Mayıs 2025"; sadece indekste ay-yıl kısaltması kullanılıyor, kalabalık olmasın diye)
- Diğer diller (varsa): etiketsiz, dil adları yan yana (`Türkçe · English · Deutsch`), mevcut dil koyu/tıklanamaz, diğerleri link
- PDF (varsa): ayrı satır, sadece `PDF ↓`, "indir" fiili yok
- Üçü de koşullu — ayrı "Diğer diller" veya "PDF" bölümü YOK, hepsi bu tek küçük meta bloğunun parçası

**Öne çıkan görsel — STANDART alan (opsiyonel değil):** Her Yazı ve Basında girdisinde var. Küçük, başlıktan sonra, `object-fit: contain` (farklı en-boy oranları sayfayı bozmasın diye — kitap kapağındaki kırpmama ilkesiyle aynı), altında kısa açıklama.

**Editor-note (nadir/koşullu):** Arşiv notu ve çeviri notu için tek genel bileşen — sol çizgi + açık zemin, gövdeden görsel olarak ayrık. Standart bir alan değil, sadece özel açıklama gerektiğinde (örn. bir haberin birden fazla mecrada çıkması) kullanılıyor.

**Kaynaklar bloğu (gövde sonu):** SADECE birden fazla kaynak olduğunda görünür — tek kaynaklı içerikte üstteki mecra rozeti zaten yeterli, altta tekrar gösterilmiyor. Birden fazla kaynak varsa birincil/ikincil ayrımıyla listelenir (`İlk yayın` / `Diğer yayımlar`).

**Kaynakça / dipnotlar:** Ayrı bir bileşen yok — gövdenin doğal `<h2>Kaynakça</h2>` + paragraf akışı, `.article-body` zaten bunu taşıyor.

**Paylaşım bloğu:** Footer'daki sosyal hesap ikonlarından (takip et) kasıtlı olarak ayrı bir blok (paylaş). Facebook dahil (belirli bir yaş grubu hâlâ kullanıyor), ayrıca X, WhatsApp, e-posta.

**Basında'da içerik türü (Haber/Söyleşi/Podcast vb.) alanı YOK** — bilinçli bir karar: kullanıcıya ciddi bir fayda sağlamıyor, gereksiz taksonomi karmaşıklığı yaratır. Basında tek bir arşiv olarak kalıyor, ayrım yalnızca mecra düzeyinde.

**Mecra arşiv sayfaları (`/mecra/bianet/` gibi):** Ayrı özel tasarım DEĞİL — aynı `press-list` bileşenini yeniden kullanan bir etiket/filtre sayfası olacak. Henüz kendi mockup'ı yapılmadı ama tasarım kararı net.

**Yazılar index pill filtresi:** ~30 granüler konu değil, 4 araştırma alanı (Hapishane, Siyasi Tarih, Göç, Emek) + Diğer + Tümü — yönetilebilir sayıda, nav'daki Konular dropdown'ıyla aynı katman.

**Basında index'te pill filtresi YOK** — mecra site genelinde düşük görsel ağırlıkta tutulan bir boyut (bkz. `konu-sayfasi-tasarimi.md`), düzinelerce mecrayı pill'e çıkarmak bu ilkeyi çiğner ve `/mecra/` sayfası mekanizmasıyla çakışır.

**Sayfa başına içerik:** Kitaplar 12 (grid matematiğinden: 4×3 masaüstü, 2×6 mobil, ikisinde de tam dolu satır). Yazılar ve Basında da tutarlılık için 12 (liste olduğu için grid zorunluluğu yok ama aynı bileşeni paylaştıkları için aynı sayfa boyutu mantıklı).

---

## Yol haritası (fazlar)

### Faz 0 — Taksonomi denetimi ✓ (tamamlandı, bkz. `taksonomi-denetimi.md`)
- [x] Mevcut kategori/etiket listelerini çıkar, kanonik konu listesine indirge
- [x] Alan katmanı (4 ana alan + Diğer) tanımlandı
- [ ] Doğrulanacak açık nokta: "İnsan Hakları"nın Göç altına ataması, gerçek XML export'ta doğrulanacak

### Faz 1 — Bilgi mimarisi & mockuplar
- [x] Ana sayfa mockup'ı — finalize edildi
- [x] Nav mimarisi (dropdown'lar) — finalize edildi
- [x] Konu sayfası mockup'ı — finalize edildi, bkz. `konu-sayfasi-tasarimi.md`
- [x] Alan hub sayfası mockup'ı (`alan-hub-mockup.html`)
- [x] Kitap detay sayfası mockup'ı (`kitap-detay-mockup.html`)
- [x] Kitaplar indeks sayfası mockup'ı (`kitaplar-index-mockup.html` — kapak ızgarası, 3 pill: Yazdıklarım/Editörlük/Katkılar)
- [x] Video detay sayfası mockup'ı (`video-detay-mockup.html`)
- [x] Videolar indeks sayfası mockup'ı (`videolar-index-mockup-v10.html`)
- [x] Yazı detay sayfası mockup'ı (`yazi-detay-mockup.html`) — **düzeltme:** önceki roadmap'te bu satır yanlışlıkla "tasarım kararı verildi" ile "mockup üretildi"yi karıştırıp erken işaretlenmişti, hiç HTML dosyası yoktu; şimdi gerçekten var
- [x] Yazılar indeks sayfası mockup'ı (`yazilar-index-mockup.html`)
- [x] Basında detay sayfası mockup'ı (`basinda-detay-mockup.html`)
- [x] Basında indeks sayfası mockup'ı (`basinda-index-mockup.html`)
- [x] Hakkımda/Bio sayfası mockup'ı (`hakkimda-mockup.html`) — finalize edildi. Tek sayfa, 4 dil (TR/EN/DE/FR) JS ile sayfa-içi geçiş (site geneli dil değiştiriciden ayrı, o hâlâ karar bekliyor). Türkçe master metin esas alındı: CV çıkarıldı, kişisel bilgi (eş/çocuklar) mahremiyet için çıkarıldı, 5 kitap (6.'sı çıkarıldı), radyo tarihi düzeltildi (2012-2024), eğitim/iş güncellemeleri eklendi (Zürih Üniversitesi 2019-2020, Migrationsfachperson 2026, Betreuer işi 2023-), çalışma alanlarına "göç" eklendi. Kitaplar ayrı bir "kutu" bileşeninde (ana sayfadaki proje kartı emsaline uygun, surface-1 zemin + tam yuvarlak köşe), kitap başlıkları kendi detay sayfalarına linkli. Dil switcher meta-cluster deseniyle tutarlı (alt çizgi yok, hover'da geliyor). Sadece Türkçe içerik dolduruldu; EN/DE/FR metinleri mockup dosyasının JS'inde hazır duruyor ama görsel olarak henüz üretilmedi — gerektiğinde bu örnekten üretilecek.
- [x] İletişim sayfası mockup'ı (`iletisim-mockup.html`) — finalize edildi. Eski sitedeki WordPress form eklentisinin (Name/Email/Comment) yerini **Netlify Forms** alıyor (`data-netlify="true"`, backend gerekmiyor, submission'lar Netlify panelinde toplanıyor). Form + üstte doğrudan `info@mustafaeren.net` maillink'i. Sosyal ikonlar sayfa içinde TEKRARLANMIYOR — zaten footer'da var (Hakkımda'daki "footer yeterli" kararıyla tutarlı). **2. tur iyileştirmeler:** honeypot spam koruması (`netlify-honeypot="bot-field"` + gizli alan), `autocomplete` (name/email), teşekkür sayfasına yönlendirme (`action="/iletisim/tesekkur/"` — eski sitedeki "Yanıtınız için teşekkür ederiz ✨" davranışının karşılığı, ayrı mockup dosyası gerektirmiyor), kısa gizlilik notu, güçlendirilmiş focus stili (erişilebilirlik). Metin düzeltmesi: Mustafa'nın kendi önerisiyle finalize edildi — "Yazılarım ve araştırmalarım hakkında yazmak veya bana ulaşmak isterseniz aşağıdaki formu kullanabilir ya da doğrudan e-posta gönderebilirsiniz." ("iş birliği" ifadesi çıkarıldı, ona soğuk geldiği için; "veya"/"ya da" ayrı yerlerde kullanılarak tekrar sorunu da kendiliğinden çözüldü).
- [x] Mecra arşiv sayfası mockup'ı (`mecra-arsiv-mockup.html`, örnek: Bianet) — finalize edildi. Ayrı bileşen değil, press-list'in filtrelenmiş hâli. Pill yok (mecra zaten filtre), satırlarda mecra rozeti yok (hepsi aynı mecra, tekrar gereksiz) — onun yerine içerik türü etiketi (**Yazılar** / **Basında** — bölüm adının kendisi, içerik-türü sınıflandırması değil). Başlık altında kısa açıklama + tek dış link (`{mecra}.org ↗`). Nav'da zorla "current" işaretlenmiyor (Konu/Alan hub'larla aynı davranış).
- [x] Üç press-list sayfasında (Yazılar index, Basında index, Mecra arşiv) sistem-geneli bir eksiklik giderildi: 480px altı mobilde satır hizalaması artık `align-items: flex-start` + ok `margin-top: 2px`, uzun başlıklarda ok metinle çakışmasın diye.
- [x] **Faz 2 notu (kural netleşti, kod Faz 2'de yazılacak):** Mecra sayfası açıklama metni artık elle yazılmayacak, aşağıdaki build-time şablon kuralına göre otomatik üretilecek. Mevcut örnek (`mecra-arsiv-mockup.html`, Bianet): *"Bianet'te yayımlanan yazıları ve Bianet'in yaptığı söyleşi/haberleri bir araya getiren arşiv."* — bu üç durumdan biri olan "ikisi" durumunun karşılığı.

  **Şablon mantığı** (mecra adına göre, o mecrada hangi koleksiyonlardan içerik olduğu build-time'da `content.mecra === {mecra}` filtresiyle tespit edilir):
  - Yalnızca **Yazılar** varsa: `"{mecra}'te yayımlanan yazıları bir araya getiren arşiv."`
  - Yalnızca **Basında** varsa: `"{mecra}'in yaptığı söyleşi ve haberleri bir araya getiren arşiv."`
  - **İkisi birden** varsa: `"{mecra}'te yayımlanan yazıları ve {mecra}'in yaptığı söyleşi/haberleri bir araya getiren arşiv."`
  - Mecra adının Türkçe ünlü uyumuna göre ek seçimi ("'te" / "'da" vb.) build-time'da otomatik değil — bu iyelik eki çeşitliliği (Bianet'te, Evrensel'de, DW'de) manuel bir `mecra.ek` alanıyla `topics.json`/mecra tanım dosyasına eklenmeli; tam otomatik ünlü uyumu tespiti (özellikle yabancı/kısaltma mecra adlarında — DW, CNN gibi) güvenilir değil, elle sabitlenecek küçük bir alan yeterli.
- [x] `target="_blank"` kuralının Kitap/Video mockup'larına uygulanması — **kontrol edildi, zaten uygulanmış.** `kitap-detay-mockup.html`'de "Yayınevi sayfası" (satır 169) ve `video-detay-mockup.html`'de "YouTube'da izle" (satır 194) linkleri `target="_blank" rel="noopener"` taşıyor. Roadmap'teki eski not güncel değilmiş, aksiyon gerekmiyordu.
- [x] Kitap/Video detay sayfalarındaki tarih formatının Yazı/Basında ile tutarlılığı — **kontrol edildi.** Video zaten tam tarih kullanıyor ("14 Mart 2025", `video-detay-mockup.html` satır 188/202), Yazı/Basında ile birebir tutarlı — aksiyon gerekmedi. Kitap ise bilinçli olarak yalnızca yıl gösteriyor ("2017 · CİSST Yayınları · 184 sayfa") — bu bir tutarsızlık değil, içerik türüne özgü doğru granülerlik: kitaplar yayınevi verisiyle yıl bazında tarihlenir, yazı/basında/video gibi gün-bazlı bir yayın/yayın tarihi kaydı yok. Karar: **kitap tarihi yıl-only kalacak, değiştirilmeyecek.**
- [x] Yazılar/Basında indekslerinde thumbnail kullanılmayacak — **KESİNLEŞTİ.** Her içeriğin gerçek bir öne çıkan görseli olsa da index bilinçli olarak metin-listesi (press-list/press-row) olarak kalıyor, yeniden değerlendirme kapandı.

### Faz 2 — Astro kurulumu
- [ ] Content collections şeması: yazılar, videolar (+ `video-türü`), söyleşiler/basında, kitaplar (+ `kitap-türü`: Yazdıklarım/Editörlük/Katkılar) — ortak `topics` alanıyla (`alan` içerikte tutulmaz; `topics.json`'daki konu→alan eşlemesinden build-time'da türer — bkz. `taksonomi-denetimi.md`)
- [ ] Şemaya eklenecek ortak/koşullu alanlar: `mecra` (ad + url + `ek` — iyelik eki, örn. "'te"/"'in", mecra açıklama şablonu için), `translations` (dil→url), `pdf` (url), `editorNote` (arşiv/çeviri notu), `featuredImage` (Yazı/Basında'da zorunlu, diğerlerinde opsiyonel), `sources[]` (Basında'da çoklu kaynak durumu için, birincil/ikincil ayrımlı)
- [ ] Mockup'lardaki tasarımı Astro şablonlarına dönüştür
- [ ] i18n / çok dilli yönlendirme kurulumu (URL prefix + hreflang, kategori-bazlı değil)
- [ ] **Footer sosyal ikonları gerçek bir ikon paketinden (ör. Simple Icons, IconScout) alınacak** — mockup'lardaki elle çizilmiş SVG'ler (X, Facebook, LinkedIn, Academia, YouTube, Bluesky, Google Scholar) sadece yer tutucu; Academia denemesi bunun elle marka logosu üretmenin güvenilir olmadığını gösterdi.

### Faz 3 — WordPress export
- [ ] Tools → Export ile tam XML al
- [ ] SFTP üzerinden medya kütüphanesini indir
- [ ] Yabancı dil postların Yazılar/Basında ile örtüşme oranını kontrol et (distinct içerik sayısını netleştirmek için)

### Faz 4 — Dönüştürme script'i
- [ ] XML → Astro content collection formatına çeviren script
- [ ] Faz 0'daki taksonomi + alan eşleme tablosunu script'e entegre et
- [ ] Görselleri optimize et (WebP, sıkıştırma)
- [ ] Her içerik kaydında `mecra` alanının gerçekten dolu olup olmadığını XML'den çıkar (Yazılar'ın ~%95'i mecralı olacak şekilde)

### Faz 5 — İçerik yükleme & deploy
- [ ] Script'i çalıştır, içeriği toplu olarak siteye doldur
- [ ] Yerelde test et
- [ ] GitHub'a push → Netlify tek seferlik deploy

### Faz 6 — Domain & son kontrol
- [ ] Namecheap DNS/nameserver ayarlarını Netlify'a yönlendir
- [ ] İletişim formunu Netlify Forms'a bağla
- [ ] Yorumları statik metne dönüştür ya da kaldır
- [ ] Eski WordPress URL'lerinden yeni yapıya 301 yönlendirme haritası

### Faz 7 — Konu ağı görselleştirmesi (en son, cila aşaması)
- [ ] Obsidian tarzı interaktif konu bağlantı ağı (d3.js, force-directed layout)
- [ ] Bu faz, içerik gerçekten göç edip content collection'lara oturduktan sonra yapılabilir
- [ ] **Görsel "cila" turu** (arka plan dokusu, kahraman alanları, ince görsel detaylar) — bilinçli olarak buraya, Faz 5 sonrasına ertelendi. Gerekçe: bilgi mimarisi ve bileşen kararları henüz tam oturmadan görsel detaylandırmaya girmek erken optimizasyon olur; önce içerik göçmeli, sonra cilalanmalı.

---

## Açık sorular (ilerledikçe netleşecek)

- "Hapishane" ve "Göç" konu adlarının kendi alanlarıyla çakışması — Faz 3'te XML export'ta çözülecek (bkz. `taksonomi-denetimi.md`, "Yeni ilke: Alan adı, kendi altındaki hiçbir Konu ile aynı olamaz")
- `target="_blank"` kuralının Kitap/Video mockup'larına uygulanması — **bekliyor, Mustafa'nın isteğiyle sonraya bırakıldı (Claude tarafından halledilecek)**
- Kitap/Video detaylarındaki tarih formatı tutarlılığı — **bekliyor, Mustafa'nın isteğiyle sonraya bırakıldı (Claude tarafından halledilecek)**
- Eski URL yapısı ile yeni yapı arasındaki 301 yönlendirme haritası henüz çıkarılmadı
- **Footer sosyal ikon seti — KESİNLEŞTİ:** X, Facebook, LinkedIn, Academia, YouTube, Bluesky, Google Scholar (7 ikon). Mail ikonu kaldırıldı (nav'da zaten her sayfada İletişim var, tekrar gereksizdi). Facebook aktif kullanıldığı doğrulandı, kalıyor. Scholar profili: `scholar.google.com/citations?user=ewQr0rAAAAAJ`. **Düzeltme:** Academia ve Scholar ikonları önce yanlış/uydurma şekillerle çizilmişti (birbirine karışmasınlar diye) — doğrusu Academia'nın gerçek logosu **"A" harfi**, Scholar'ın gerçek logosu **mezuniyet kepi**; ikisi zaten farklı şekiller olduğu için uydurmaya hiç gerek yokmuş. İkon uydurmak yerine platformun gerçek logosunu kullanmak ilke olarak benimsendi (X/Facebook/LinkedIn/YouTube/Bluesky zaten bu ilkeyle çizilmişti). **14 dosyanın tamamına uygulandı.** **2. tur düzeltme denendi, geri alındı:** Dolu/solid üçgen "A" denemesi (fill-rule evenodd) gerçek ekranda kötü durdu, kullanıcı tarafından reddedildi ("facia oldu"). **İnce çizgisel A'ya geri dönüldü** (iki diagonal çizgi + orta çubuk, stroke tabanlı, diğer ikonlarla aynı görsel dilde). Academia'nın gerçek logosunun bir "A" harfi olduğu bilgisi doğru ama bunu tam sadakatle yeniden üretmek mockup ortamında iyi sonuç vermedi — ince stroke versiyonu daha okunaklı/tutarlı kaldı, gerçek logo yalnızca Astro implementasyonunda (gerçek SVG/ikon paketiyle) kullanılacak.
- **Emeğin Gündemi (Açık Radyo, 2012-2024, ~12 yıllık emek/grev arşivi, blogspot.com'da barınıyor) görünürlüğü — KESİNLEŞTİ:** Ayrı bir Proje kartı ya da Alan Hub referansı yapılmayacak. Sadece Hakkımda sayfasındaki bio metninde geçtiği kadarıyla kalacak (mevcut hâliyle yeterli).

---

*Bu doküman ilerledikçe güncellenecek — her sohbette kaldığımız yeri buradan takip edebiliriz.*
