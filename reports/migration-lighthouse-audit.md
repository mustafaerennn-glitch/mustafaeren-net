# Aşama 5 — Lighthouse Denetimi

**Tarih:** 2026-07-16
**Ortam:** `astro build` (prod derleme) + `astro preview`, gerçek 171 içerikle.

## Sonuçlar

| Sayfa | Performans | Erişilebilirlik | Best Practices | SEO |
|---|---|---|---|---|
| Ana sayfa `/` | 100 | 100 | 100 | 100 |
| Alan Hub `/alanlar/hapishane/` | 100 | 100 | 100 | 100 |
| Yazılar index `/yazilar/` | 100 | 100 | 100 | 100 |
| Yazı (EN, en uzun) `/en/yazilar/death-fasts-.../` | 100 | 100 | 100 | 100 |
| Yazı (18 görselli) `/yazilar/yargilanmamis-bir-katliam-kanli-pazar/` | **100** (önce 76) | 100 | 96 | 100 |
| Basında (spot-heading bulgusu) `/basinda/cezaevlerinde-emek-somurusu-.../` | 100 | **100** (önce 97) | 96 | 100 |
| Video `/videolar/kanli-pazar-belgeseli/` | 100 | 100 | 100 | 100 |
| Kitap `/kitaplar/hapiste-saglik/` | 100 | 100 | 100 | 100 |

## Bulunan ve düzeltilen sorunlar

### 1. Gövde-içi görseller canlı eski WordPress sitesine bağımlıydı (performans)

**Bulgu:** Migrasyon yalnızca öne çıkan görseli (`featuredImage`/`thumbnail`/`kapak`) indirip
optimize ediyordu. Makale gövdesindeki `![alt](https://mustafaeren.net/wp-content/uploads/...)`
formatındaki **122 görsel (75 makalede)** hiç işlenmemiş, doğrudan eski siteden hotlink
ediliyordu — optimize edilmemiş, bazıları ~1MB PNG.

**Etki:** En görselli makalede (18 görsel) toplam sayfa ağırlığı **6,7 MB**, LCP **7,3 saniye**
(Lighthouse Performans skoru 76).

**Yapılan düzeltme:** `content-to-markdown.mjs`'e `extractInlineOwnSiteImages()` ve
`rewriteInlineImages()` eklendi; `migrate-wordpress.mjs`'in üretim adımında Yazı/Basında
gövdelerindeki tüm kendi-site görselleri indirilip WebP'ye çevrilip `_images/` klasörüne
yerleştirildi, gövde metni yerel yollara güncellendi. Aynı mantıkla, gövdede makalenin kendi
PDF'ine olan düz metin linkleri de (zaten `pdf` alanı için indirilen kopyaya) yeniden
yönlendirildi.

**Sonuç:** 122 görselin 122'si de indirildi. Aynı makalede: sayfa ağırlığı **215 KB**'a
(-97%), LCP **0,8 saniye**'ye (-89%) düştü, Performans skoru **100** oldu.

**Kapsam dışı bırakılan (bilinçli):** Aynı makalede ikinci bir öz-barındırılan PDF linki
(`tbmm-alt-komisyon-gorusler.md`) eski siteye işaret etmeye devam ediyor — şema yalnızca tek bir
`pdf` alanı destekliyor, bu ikinci link performansı etkilemiyor (yalnızca bir metin linki,
önceden yüklenmiyor), bu yüzden ayrı bir şema değişikliği gerektirecek bu düzeltme ileri bir
göreve bırakıldı.

### 2. Başlık hiyerarşisi ihlali (erişilebilirlik)

**Bulgu:** 3 Basında kaydında gövde, H1'den sonra doğrudan H5 ile başlıyordu — WCAG başlık
sıralaması ihlali. Kaynağı incelendiğinde üç farklı gerçek neden bulundu:
- 1 kayıtta: kaynak haber sitesinin (BirGün) kendi "spot" (lead paragraf) CSS sınıfı
  (`<h5 class="detail__spot">`) kopyala-yapıştırla WP'ye taşınmış — gerçek bir başlık değil.
- 1 kayıtta: mecra/tarih alıntı satırı (`<h5><strong><a>Mecra</a> - tarih</strong></h5>`)
  yanlışlıkla başlık olarak girilmiş.
- 1 kayıtta: gerçek bir alt başlık ("Hak temelli yaklaşım" vb.) vardı ama H5'ten başlıyordu.

**Yapılan düzeltme:** `content-to-markdown.mjs`'e üç fonksiyon eklendi:
`unwrapSpotHeadings()` (CSS sınıfına göre spot paragrafları düz kalın metne çevirir),
`unwrapCitationHeadings()` (mecra/tarih alıntı satırlarını başlıktan çıkarır),
`normalizeHeadingLevels()` (korpus genelinde, her gövdede kullanılan en sığ başlık seviyesini
H2'ye kaydırır — göreli iç içelik korunarak). Bu üçüncü fonksiyon genel bir düzeltme; yalnızca
bu 3 dosyayı değil, gelecekte benzer bir kayıt eklenirse onu da otomatik doğru seviyelendirir.

**Sonuç:** 3 kaydın 3'ünde de başlık hiyerarşisi düzeldi. Erişilebilirlik skoru 97 → 100.

### 3. Best Practices'teki kalan 96 puan (düzeltilmedi, bilinçli)

`image-size-responsive` denetimi, üçüncü taraf bir görseli (BirGün'ün kendi CDN'indeki alıntı
fotoğrafı, `static.birgun.net`) düşük çözünürlüklü buluyor. Bu bizim barındırdığımız/kontrol
ettiğimiz bir görsel değil — orijinal kaynağa atıf yaparken onun kendi görselini kullanmak
doğru bir editoryal davranış, yeniden barındırıp "optimize etmek" hem kapsam dışı hem de
atıf ilkesine aykırı olurdu. Dokunulmadı.

## Doğrulama

`astro check` (0 hata) + `astro build` (244 sayfa, 0 hata) + `npm run check-links` (0 gerçek
kırık link, 0 locale-hardcode ihlali) her düzeltmeden sonra tekrar çalıştırıldı.
