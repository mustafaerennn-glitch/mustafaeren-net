# Aşama 4E — Editoryal İnceleme Raporu

**Tarih:** 2026-07-16
**Kapsam:** Risk-bazlı örnekleme, 171 gerçek içerik üzerinden (76 Yazı, 54 Basında, 23 Video, 18 Kitap).
**Yöntem:** Her örnek gerçek tarayıcıda açıldı; başlık/tarih/dil/breadcrumb, görsel+alt metin, gövde biçimlendirme,
dipnot/dış link, iç link, konu/alan ilişkisi, mecra rozeti, çeviri kümesi bağlantıları, PDF/video oynatma,
mobil+masaüstü görünüm, canonical/hreflang/meta description ayrı ayrı kontrol edildi. Bulunan sorunlar bu
aşamada düzeltildi, ilgili sayfa yeniden açılıp doğrulandı, ardından `astro check` + `astro build` +
`npm run check-links` tekrar çalıştırıldı.

## Özet

- **16/16 kategori** kontrol edildi (2 kategoride gerçek veride örnek yok — aşağıda ayrıca belirtildi).
- **7 gerçek editoryal/teknik sorun** bulundu, **7'si de bu aşamada düzeltildi**.
- Son doğrulama: `astro check` 0 hata · `astro build` 244 sayfa, 0 hata · `check-links` 0 gerçek kırık link
  (15'i bilinen bir yanlış-alarm, aşağıda açıklanıyor), 0 locale-hardcode ihlali.

---

## 1. En uzun yazı

- **İçerik:** Death Fasts: A Kind of Action within the Dilemma between the Sanctity of Life and the Right to Resist
- **URL:** `/en/yazilar/death-fasts-sanctity-of-life-right-to-resist/`
- **Neden seçildi:** 171 kayıt içinde en uzun gövde (77.850 karakter).
- **Kontrol edilenler:** başlık/tarih/dil, meta description, canonical, görsel (gerçek boyutunda yükleniyor),
  PDF linki, dış linkler (WMA, TBMM, Gutenberg, Marxists.org vb. — hepsi gerçek ve çalışıyor), iç link yok
  (tek-başına "eslenemeyenler" kaydı, TR orijinali export'ta yok), 6 konu rozeti, 2 alan rozeti.
- **Sonuç:** Temiz.
- **Bulunan sorun:** Yok.
- **Not:** Gövdede birkaç dış linkte `utm_source=chatgpt.com` parametresi var (yazarın orijinal kaynak
  toplama sürecinden kalma) — linkler çalışıyor, bir hata değil, dokunulmadı.

## 2. En eski yazı

- **İçerik:** Ceza İnfaz Kurumu Yönetimi El Kitabı Üzerinde Bir Değerlendirme
- **URL:** `/yazilar/ceza-infaz-kurumu-yonetimi-el-kitabi-uzerinde-bir-degerlendirme-hapishanelere-iliskin-avrupa-kriterlerinin-ve-turkiye-pratiginin-bir-belge-uzerinden-okunmasi/`
- **Neden seçildi:** 171 kayıt içinde en eski yayın tarihi (18 Ocak 2012).
- **Kontrol edilenler:** başlık/tarih, meta description, canonical, öne çıkan görsel, mecra rozeti (Mustafaeren.net).
- **Sonuç:** 1 sorun bulundu, düzeltildi.
- **Bulunan sorun:** Öne çıkan görsel WordPress'te yalnızca 118×166px'lik bir ekran görüntüsüydü, ama
  `PreviewImage.astro` bileşeni her zaman 800px genişlik istiyordu — Astro'nun görsel servisi görseli
  ~6.8× büyütüp bulanıklaştırıyordu.
- **Yapılan düzeltme:** `src/components/content/PreviewImage.astro`'da istenen genişlik
  `Math.min(800, image.width)` ile sınırlandırıldı — kaynak görsel küçükse artık büyütülmüyor. Bu, Yazı/Basında
  koleksiyonlarında toplam **16 görseli** (11 Yazı + 5 Basında) etkileyen genel bir düzeltme.
- **Yeniden doğrulama:** Sayfa yeniden açıldı, görsel istek URL'si `w=118&h=166` (native boyut) döndürdüğü
  doğrulandı. `astro build` + `check-links` tekrar çalıştırıldı, temiz.

## 3. Çok görselli yazı

- **İçerik:** Yargılanmamış Bir Katliam: Kanlı Pazar
- **URL:** `/yazilar/yargilanmamis-bir-katliam-kanli-pazar/`
- **Neden seçildi:** Gövdede 17 satır-içi görsel + 1 öne çıkan görsel (toplam 18), korpustaki en yüksek sayı.
- **Kontrol edilenler:** 18 görselin tamamının yüklenmesi (network 200, gerçek piksel verisi — ilk JS
  kontrolünde bir görsel `complete:false` görünse de gerçek bir zamanlama artefaktıydı, ekran görüntüsüyle
  doğrulandı), dış link yok, iç link yok.
- **Sonuç:** Temiz.
- **Bulunan sorun:** Yok.

## 4. PDF içeren yazı

- **İçerik:** Özel İhtiyaçları Olan Mahpuslar ve İnsan Hakları
- **URL:** `/yazilar/ozel-ihtiyaclari-olan-mahpuslar-ve-insan-haklari/`
- **Neden seçildi:** Kendi barındırılan PDF'i olan yazılardan biri.
- **Kontrol edilenler:** "PDF ↓" linkinin gerçek dosyaya gitmesi, dosyanın geçerliliği.
- **Sonuç:** Temiz — `public/pdf/ozel-ihtiyaclari-olan-mahpuslar-ve-insan-haklari.pdf` gerçek, 3 sayfalık, 471 KB.
- **Bulunan sorun:** Yok.

## 5. Shortcode/embed geçmişi olan yazı

- **İçerik (Basında):** Fabrikalaşan Cezaevleri: "Endüstriyel Kompleks Oluşturuldu"
- **URL:** `/basinda/fabrikalasan-cezaevleri-endustriyel-kompleks-olusturuldu/`
- **Neden seçildi:** Gövdede korunmuş bir Twitter `<iframe>` embed'i var (DW'nin orijinal habercilik embed'i).
- **Kontrol edilenler:** iframe'in doğru `src` ile render olması, h1/meta description doğruluğu.
- **Sonuç:** Temiz — embed korunmuş ve çalışıyor.
- **Bulunan sorun:** Yok.

## 6. Tablo veya blockquote içeren yazı

- **İçerik:** Türkiye'de Hapishanenin Tarihi ve Estetize Edilen Ölüm
- **URL:** `/yazilar/turkiyede-hapishanenin-tarihi-ve-estetize-edilen-olum/`
- **Neden seçildi:** Korpusta blockquote yoğunluğu en yüksek yazı (23 markdown satırı, 14 gerçek
  `<blockquote>` elemanına render oluyor).
- **Kontrol edilenler:** blockquote render'ı, file:// link yok, meta description.
- **Sonuç:** Temiz.
- **Bulunan sorun:** Yok.
- **Not (kapsam bulgusu):** 171 kaydın hiçbirinde gerçek bir Markdown **tablosu** yok — WordPress
  içeriğinde tablo formatı hiç kullanılmamış. Bu bir eksiklik değil, gerçek verinin bir özelliği.

## 7. TR–EN çeviri kümesi

- **İçerik:** Mülteci ve Mahpus Olmak / AB'de "Yabancılar" Dört Kat Fazla Hapsediliyor
- **URL'ler:** `/yazilar/multeci-ve-mahpus-olmak-abde-yabancilar-dort-kat-fazla-hapsediliyor/` (TR) ↔
  `/en/yazilar/migrants-refugees-prison-eu/` (EN)
- **Neden seçildi:** Bu oturumda kullanıcının onayladığı, tarih farkı olan (~1 ay) TR↔EN çifti; ayrıca
  4 file:/// dipnot sorununa da sahip (bkz. madde 16).
- **Kontrol edilenler:** hreflang (tr/en/x-default), dil küme linki, canonical.
- **Sonuç:** Temiz.
- **Bulunan sorun:** file:/// dipnot linkleri — bkz. madde 16 (ayrı raporlanıyor, burada tekrar edilmiyor).

## 8. TR–DE çeviri kümesi

- **İçerik:** Yeni Tip Hapishaneler ve Toplumsal Muhalefete Gözdağı
- **URL'ler:** `/yazilar/yeni-tip-hapishaneler-ve-toplumsal-muhalefete-gozdagi/` (TR) ↔
  `/de/yazilar/neue-hochsicherheits-gefaengnisse-tuerkei/` (DE), ayrıca EN üyesi de var (3'lü küme).
- **Neden seçildi:** 3 dilli (TR+EN+DE) tam küme.
- **Kontrol edilenler:** Her iki yönde hreflang simetrisi, DE sayfasında Almanca meta description, DE
  sayfasında PDF linki, breadcrumb ("Startseite › Artikel").
- **Sonuç:** Temiz.
- **Bulunan sorun:** Yok — bu kümenin DE sayfası, Aşama 4D'de fark edilen "hiç DE/FR sayfa şablonu yok"
  boşluğunun düzeltilmiş haliyle şu an düzgün çalışıyor.

## 9. TR–FR çeviri kümesi

- **Neden seçildi:** İstenen kategori.
- **Bulgu:** Gerçek veride **TR–FR çeviri kümesi yok**. `translation-map.json`'daki 5 grubun hiçbiri
  Fransızca içermiyor; 5 gerçek Fransızca Basında kaydının tamamı TR karşılığı olmayan **özgün** yabancı-dil
  parçaları (`_standaloneYabanciOzgunler`). Bu, migrasyonun bir eksikliği değil, WordPress export'unun
  gerçek içeriğinin bir özelliği.
- **Yerine kontrol edilen:** `/fr/basinda/turquie-le-systeme-carceral-au-bord-de-la-rupture/` (özgün FR
  Basında kaydı) — nav/breadcrumb Fransızca ("Accueil › Presse"), mecra rozeti "OUEST FRANCE ↗" doğru
  render oluyor, görsel yükleniyor. Temiz.

## 10. Çoklu konu/alan taşıyan içerik

- **İçerik:** AKP, Kriminalizasyon ve "Kampüs" Hapishaneler Cumhuriyeti
- **URL:** `/yazilar/akp-kriminalizasyon-ve-kampus-hapishaneler-cumhuriyeti/`
- **Neden seçildi:** 7 konu taşıyor, bunlardan 6'sı "Hapishane" alanına, 1'i ("Hukuk / Adalet Sistemi")
  "Siyasi Tarih" alanına ait — gerçek 2 alanlı bir içerik.
- **Kontrol edilenler:** Sayfadaki alan rozetleri.
- **Sonuç:** 1 **sistemik** sorun bulundu, düzeltildi.
- **Bulunan sorun:** Sayfa yalnızca **"Hapishane"** rozetini gösteriyordu, "Siyasi Tarih" hiç görünmüyordu.
  Kaynak: `getAreasForTopicRefs()` doğru şekilde tüm alanları hesaplıyordu (`["hapishane","siyasi-tarih"]`),
  ama 4 sayfa dosyasında (`YaziDetaySayfasi.astro`, `BasindaDetaySayfasi.astro`,
  `videolar/[slug].astro`, `kitaplar/[slug].astro`) sonuç `[0]` ile ilk alana kesiliyordu —
  `TopicsRow.astro` bileşeni zaten çoklu alan göstermek üzere tasarlanmıştı, ama hiçbir çağıran kod bunu
  kullanmıyordu. Faz 2'den kalma bir hataydı, gerçek çoklu-alan içerik bu göçle ilk kez ortaya çıkardı.
- **Yapılan düzeltme:** Tüm 4 dosyada `areaSlug = (...)[0]` → `areaSlugs = (...)` olarak değiştirildi,
  `areas` artık tüm alanları map'liyor.
- **Yeniden doğrulama:** Sayfa yeniden açıldı, `.area-pill` elemanları `["Hapishane", "Siyasi Tarih"]`
  olarak doğru render oldu. `astro build` + `check-links` tekrar çalıştırıldı, temiz.

## 11. Çoklu kaynaklı Basında kaydı

- **İçerik:** Cezaevlerinde emek sömürüsü: Bakanlık, mahkûmları 14 TL yevmiyeyle çalıştırıyor
- **URL:** `/basinda/cezaevlerinde-emek-somurusu-bakanlik-mahkumlari-14-tl-yevmiyeyle-calistiriyor/`
- **Neden seçildi:** Hem DW hem BirGün etiketli, kullanıcının "DW birincil, BirGün ikincil" kararını verdiği kayıt.
- **Kontrol edilenler:** Mecra rozeti (DW ↗, birincil), SourcesBlock'ta her iki kaynağın da listelenmesi.
- **Sonuç:** Temiz — "DW — ..." ve "BirGün — ..." ikisi de doğru sırada render oluyor.
- **Bulunan sorun:** Yok.

## 12. URL'siz mecraya ait kayıt

- **İçerik:** 4 Milyar Gelirli Bir KİT: Cezaevi Kampüsleri
- **URL:** `/basinda/4-milyar-gelirli-bir-kit-cezaevi-kampusleri/`
- **Neden seçildi:** Mecrası (Mezopotamya Ajansı) `mecralar.json`'da URL'siz 19 mecradan biri.
- **Kontrol edilenler:** Mecra rozetinin gerçek adla ama tıklanamaz (`<span>`, `href` yok) render olması.
- **Sonuç:** Temiz — tasarım niyetiyle birebir uyumlu.
- **Bulunan sorun:** Yok.

## 13. Dört video türünden birer örnek

| Tür | URL | Kontrol | Sonuç |
|---|---|---|---|
| Belgesel | `/videolar/kanli-pazar-belgeseli/` | play butonuna tıklanınca iframe `youtube.com/embed/k2ropmsnwWM` yükleniyor, süre "43 dk" | Temiz |
| Konferans/Panel | `/videolar/asulis-turkiye-hapishaneleri-paneli/` | tür etiketi "Konferans / Panel", süre "1 sa 35 dk" (95 dk doğru formatlanmış) | Temiz |
| Kısa video | `/videolar/aktivizm-nedir/` | tür "Kısa videolar", mecra "Sivil Düşün", süre "1 dk" (gerçek 27 sn, kurala göre yukarı yuvarlanmış) | Temiz |
| Söyleşi | `/videolar/acik-radyoda-omer-madra-ile-kanli-pazar/` | tür "Söyleşi", embed URL doğru, süre "32 dk" | Temiz |

- **Bulunan sorun:** Yok.

## 14. Üç kitap türünden birer örnek

| Tür | URL | Kontrol | Sonuç |
|---|---|---|---|
| Yazdıklarım | `/kitaplar/haklarim-basvuru-kilavuzu/` | yıl/yayınevi/sayfa doğru, "Yayınevi sayfası" linki, "Kitap hakkında" gerçek metin | Temiz |
| Editörlük | `/kitaplar/hapiste-saglik/` | aynı kontroller | 1 sorun bulundu, düzeltildi (bkz. aşağı) |
| Katkılar | — | **Gerçek veride bu türde 0 kayıt var** (şema 3 değer tanımlıyor: yazdıklarım/editörlük/katkılar, ama WP verisinde yalnızca ilk ikisi kullanılmış). Migrasyonun eksikliği değil, gerçek verinin özelliği. | — |

- **Bulunan sorun (editörlük örneğinde bulunup tüm koleksiyona genellendi):** 13/18 kitabın `description`
  alanı (ve bazılarında excerpt) WordPress'in Northeme teması demo içeriğinden kalma **Lorem Ipsum**
  metniydi ("Curabitur tincidunt, ante vel finibus tempor…"). İlk Lorem Ipsum tespiti yalnızca birkaç sabit
  ifadeyi ("lorem ipsum", "nullam" vb.) arıyordu, bu farklı varyantı yakalamıyordu.
- **Yapılan düzeltme:**
  1. `resolve-description.mjs`'teki `LOREM_IPSUM_RE`'ye `curabitur/tincidunt/vestibulum/suspendisse/pellentesque`
     eklendi; artık hem excerpt hem gövde-türetilmiş yol için kontrol ediliyor.
  2. Bu değişiklik sayesinde 13 kaydın 13'ü de aslında **gerçek gövde künye metnine** (Eser Adı/Yazar/
     Yayınevi/Sayfa Sayısı bloğu) düştü — WP'nin kendi gövdesinde gerçek içerik zaten vardı, sadece
     excerpt'teki Lorem Ipsum onu gölgeliyordu.
  3. Ayrıca, description hâlâ boş kalan nadir durumlar için (gövde de yoksa), gerçek doğrulanmış
     bibliyografik alanlardan (yazar/yayınevi/yıl/sayfa) dürüst bir künye cümlesi kuran bir yedek eklendi
     (uydurma cümle değil, zaten migrasyonda doğrulanmış alanların birleşimi) — pratikte hiçbir kayıtta
     gerekmedi, hepsi gerçek gövdeden çözüldü.
- **Ek bulgu (bu taramada ortaya çıktı):** "Türkiye'de Kadın Mahpus Olmak" kitabının gövdesindeki "Eser Adı:"
  satırı yanlışlıkla "Türkiye'de Ağırlaştırılmış Müebbet Hükümlüsü Mahpus Olmak" yazıyordu — WordPress'te
  künye şablonunun önceki kitaptan kopyalanıp başlığın güncellenmemesinden kaynaklanan gerçek bir
  yazım hatası (gövdenin geri kalanı, yazar, sayfa sayısı, konu, yayınevi linki doğruydu). `content-overrides.json`'a
  post_id=3995 için tek satırlık bir `bodyFindReplace` düzeltmesi eklendi.
- **Yeniden doğrulama:** 18 kitabın 18'i de yeniden üretildi, Lorem Ipsum taraması 0 sonuç verdi,
  "Kadın Mahpus Olmak" artık kendi başlığını gösteriyor. `astro build` + `check-links` tekrar çalıştırıldı, temiz.

## 15. Daha önce görselsiz olan üç yazı

| İçerik | URL | Görsel kaynağı | Sonuç |
|---|---|---|---|
| Gezi Direnişi ve Medya - 2 | `/yazilar/gezi-direnisi-ve-medya-2/` | Kullanıcının verdiği bianet ekran görüntüsü, kullanıcı kararıyla olduğu gibi kullanıldı | Temiz (bilinçli tasarım) |
| Kapatılmanın Patolojisi / Osmanlı'dan Günümüze Hapishanenin Tarihi | `/yazilar/kapatilmanin-patolojisi/` | Kullanıcının verdiği gerçek kitap kapağı, 528×714, native boyutta render oluyor | Temiz |
| AKP Türkiyesi'nde Mahpus Oranının Seyri | `/yazilar/1542-2/` | Kullanıcının verdiği gerçek infografik, 2308×1286, dosya geçerli, sunucu 200 döndürüyor | Temiz |

- **Bulunan sorun:** Yok. (Tarayıcı otomasyon aracı, sayfa navigasyonundan hemen sonra alınan JS
  `naturalWidth` kontrollerinde bazen `0` gösteriyor — 3 örnekte de dosya bütünlüğü ve sunucu yanıtıyla
  gerçek görüntülemenin doğru olduğu ayrıca doğrulandı; bu bir içerik sorunu değil, kontrol aracının
  zamanlama sınırlaması.)

## 16. `file:///C:/Users/...` dipnot sorunu bulunan dört yazının tamamı

| İçerik | URL |
|---|---|
| Mahpus sayısı "400 bin"i gördü mü? Bakanlık neden açıklamıyor? | `/yazilar/mahpus-sayisi-400-bini-gordu-mu-bakanlik-neden-aciklamiyor/` |
| Mülteci ve Mahpus Olmak / AB'de "Yabancılar" Dört Kat Fazla Hapsediliyor | `/yazilar/multeci-ve-mahpus-olmak-abde-yabancilar-dort-kat-fazla-hapsediliyor/` |
| Örtük Af ile Kaç Mahpus Tahliye Edildi? | `/yazilar/ortuk-af-ile-kac-mahpus-tahliye-edildi/` |
| Söyledikleri ve Söylemedikleriyle TÜİK-ÇİK İstatistikleri - 1 | `/yazilar/soyledikleri-ve-soylemedikleriyle-tuik-cik-istatistikleri-1/` |

- **Neden seçildi:** Word belgesinden yapıştırılmış, yazarın kendi bilgisayarına özel
  `file:///C:/Users/hsb/Downloads/....docx#_ftnN` dipnot linkleri (toplam 10+ oluşum/dosya) — hiçbir okuyucu
  için asla çalışmayacak, sahte işlevsellik vaat eden linkler.
- **Kontrol edilenler:** Her 4 dosyada `file:///` link sayısı, dipnot numaralarının (`[1]`, `[2]`...)
  metin olarak korunup korunmadığı, aynı satırdaki GERÇEK linklerin (ör. `[Bianet](https://...)`,
  görseller) yanlışlıkla silinip silinmediği.
- **Bulunan sorun (ilk düzeltme denemesinde yeni bir hata yaratıldı, ikinci turda düzeltildi):**
  1. İlk `stripDeadFileLinks()` implementasyonu açgözlü-olmayan `(.*?)` deseni kullanıyordu. `.`
     karakteri `]` ve `)` dahil HER karakteri eşlediği için, desen en yakın `](file:` yerine belgedeki
     **çok daha uzaktaki başka bir** `](file:` oluşumuna kadar genişleyip aradan geçtiği tüm gerçek
     linkleri (ör. `[Bianet](https://...)`, görsel markdown'ları, paragraf metinleri) yutuyordu. Bu,
     canlı veri üzerinde test edilirken (küçük bir izole test değil, TAM dosya üzerinde) yakalandı.
  2. Desen, gerçek link metninin her zaman `\[N\]` (kaçışlı köşeli parantezli dipnot numarası)
     formatında olduğu gözlemine dayanarak `\[(\\\[\d+\\\])\]\(file:\/\/\/[^)]*\)` olarak
     sıkılaştırıldı — artık yalnızca bu kesin deseni eşliyor, başka hiçbir linke dokunmuyor.
- **Yapılan düzeltme:** `content-to-markdown.mjs`'e kalıcı bir `stripDeadFileLinks()` adımı eklendi
  (migrasyon pipeline'ının bir parçası, tekil dosya yaması değil); tüm 171 kayıt yeniden üretildi.
- **Yeniden doğrulama:**
  - 4 dosyada `file:///` sayısı: 10+9+... → **0**.
  - Her 4 dosyada gerçek linklerin (Bianet vb.) korunduğu programatik olarak doğrulandı.
  - Toplam korpus boyutu karşılaştırması: yalnızca bu 4 dosya küçüldü (toplam 2682 karakter, silinen
    dead-link URL'lerinin toplam uzunluğuyla birebir eşleşiyor), başka hiçbir dosya etkilenmedi.
  - Tarayıcıda `/yazilar/multeci-ve-mahpus-olmak-abde-yabancilar-dort-kat-fazla-hapsediliyor/` açılıp
    `file:` linki sayısının 0 olduğu, Bianet linkinin çalıştığı doğrulandı.
  - `astro build` + `check-links` tekrar çalıştırıldı, temiz.

---

## Ayrı ele alınan: BOM slug düzeltmesi

Bu aşamadan önce, kullanıcı talebiyle ayrıca düzeltildi: Fransızca bir Basında kaydının
(`post_id=519`, "Le système carcéral en Turquie est au bord de la rupture") WordPress slug'ında görünmez
bir BOM karakteri `%ef%bb%bf` olarak sızmıştı. `content-overrides.json`'a `slugOverride` eklenip temiz
slug'a geçildi; eski URL'den yeniye `astro.config.mjs`'te bir `redirects` kaydı eklendi (statik build'de
meta-refresh + canonical + noindex ile çalışıyor — gerçek HTTP 301 için son barındırma platformunun kendi
redirect kuralı ayrıca gerekecek, bu notu 4D/4E raporlarında da belirttim).

## check-links'teki 15 "kırık link" hakkında

`check-links.mjs`, yalnızca Astro sayfa rotalarını "bilinen gerçek rota" sayıyor — `public/pdf/*.pdf` gibi
statik dosyaları tanımıyor. Bu yüzden 15 gerçek, çalışan PDF linkini "kırık" olarak işaretliyor. Bunlar
tek tek doğrulandı (dosyalar `public/pdf/`'te gerçekten var, sunucu 200 döndürüyor) — gerçek bir sorun
değil, script'in kendi bir eksikliği. İstersen ayrı bir görevde `check-links.mjs`'i `public/` altındaki
statik dosyaları da bilinen rota kümesine dahil edecek şekilde güncelleyebilirim.

## Bu aşamada değişen dosyalar

- `src/components/content/PreviewImage.astro` — küçük görsellerin büyütülmesini önleyen genişlik sınırı
- `src/components/content/YaziDetaySayfasi.astro`, `BasindaDetaySayfasi.astro`,
  `src/pages/videolar/[slug].astro`, `src/pages/kitaplar/[slug].astro` — çoklu alan rozeti düzeltmesi
- `scripts/migration/lib/content-to-markdown.mjs` — `stripDeadFileLinks()` eklendi (ve düzeltildi)
- `scripts/migration/lib/resolve-description.mjs` — Lorem Ipsum tespiti genişletildi (excerpt + gövde)
- `scripts/migrate-wordpress.mjs` — `stripDeadFileLinks`, `bodyFindReplace`, kitap açıklaması yedek mantığı
- `scripts/migration/content-overrides.json` — post 519 (BOM slug), post 3995 (Kadın Mahpus Olmak künye
  düzeltmesi) override'ları eklendi
- `astro.config.mjs` — eski BOM URL'den yeniye redirect
- `src/content/{yazilar,basinda,kitaplar}/*.md` — ilgili kayıtlar yeniden üretilip yerleştirildi
