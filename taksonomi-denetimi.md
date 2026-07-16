# Taksonomi Denetimi — Faz 0 Sonuçları

## Finalize edilmiş vocabulary (konu sayfası tasarımıyla birlikte netleşti — bkz. `konu-sayfasi-tasarimi.md`)

- **İçerik türü**: Yazı, Video, Kitap, Söyleşi/Basında
- **Konu**: aşağıdaki kanonik liste
- **Alan**: konuları gruplayan üst katman — bkz. "Alan katmanı" bölümü (yeni, aşağıda)
- **Mecra**: Bianet, BirGün, İMC TV, Cumhuriyet vb. — içeriğin yayınlandığı/gerçekleştiği yer, ayrı bir alan (`mecra`), konu taksonomisine karışmaz
- **Proje**: Kanlı Pazar, ileride Kayyum Arşivi — bağımsız sitesi olan üretimler

**"Koleksiyon" kategorisi kaldırıldı.** TCPS Kitaplığı gibi editoryal seriler ayrı bir taksonomi katmanı değil, sadece kitap metadata'sında bir alan (`seri: TCPS Kitaplığı`). Site mimarisine (navigasyon, konu sayfaları, filtreler) girmiyor — sadece kitap kartlarında ve biyografide görünüyor.

**Tasarım ilkesi**: Sadece uzun vadede büyüyecek şeyler mimaride görünür bir yer kazanır.

---

## Alan katmanı (yeni — nav dropdown ve ana sayfa grupları için)

Kanonik konu listesi (~30 konu) doğrudan navigasyona/ana sayfaya koyulamayacak kadar kalabalık. Bunun için 4 ana alan + 1 sepet alan tanımlandı. Bu, konuların üstüne binen bir **gruplama/etiketleme katmanı** — konuların kendisini, URL'lerini ya da sayfa yapısını değiştirmiyor.

### Tasarım ilkesi: veri modelinde hiyerarşi var, URL'de yok

- Her konu sayfası düz kalır: `/konu/{slug}/` — hiç değişmiyor, nest olmuyor
- Alan ataması tek bir merkezi eşleme dosyasında (`topics.json` benzeri) tutulur: her konu kaydı bir `alan` alanı taşır
- Nav dropdown, ana sayfadaki "Araştırma alanları" kartları, ve alan hub sayfaları (`/konu/hapishane/` gibi) bu tek dosyadan otomatik türer — hiçbiri elle senkronize edilmez
- Yeni konu eklendiğinde veya bir konunun alanı değiştiğinde (örn. "İnsan Hakları" örneğindeki gibi belirsiz bir atama yanlış çıkarsa) tek yapılan şey bu dosyada bir satır değiştirmek — hiçbir URL kırılmaz, hiçbir yönlendirme haritası gerekmez
- Gerekçe: alan ataması URL'e gömülü olsaydı (`/konu/hapishane/kuyu-tipi/` gibi), ileride bir konuyu başka bir alana taşımak URL değişikliği + 301 yönlendirme + SEO kaybı demek olurdu. Tek kaynaklı metadata yaklaşımı bu riski tamamen ortadan kaldırıyor.

### 4 ana alan + 1 sepet

| Alan | İçerdiği kanonik konular |
|---|---|
| **Hapishane** | Hapishane, Mahpus (+ hasta/işçi/öğrenci/çocuk/kadın/yabancı-azınlık/LGBTİ/engelli-yaşlı/siyasi mahpuslar), D/F/S/Y Tipi Hapishaneler, Kuyu Tipi Hapishane, Yüksek Güvenlikli Hapishaneler, Kampüs Hapishaneleri, Tecrit/İzolasyon, Tek Tip Elbise, Çıplak Arama/Kelepçeli Muayene, Disiplin Cezaları, Ceza İnfaz İstatistikleri, Af/Örtük Af, Kriminalizasyon, Toplu Hapsetme, **Ölüm Oruçları** (hapishanedeki direniş biçimi olarak), Kritik Hapishane Çalışmaları |
| **Siyasi Tarih** | Kanlı Pazar, Gezi, 16 Şubat 1969/6. Filo, **Hukuk/Adalet Sistemi** (tarihsel/siyasi bağlamdaki yazılar) |
| **Göç** | Göç, **İnsan Hakları** (doğrudan yazılmamış, göç veya hapishane bağlamında geçiyor — bu atama Faz 3 XML export'unda gerçek etiket kullanımına göre doğrulanacak/düzeltilebilir) |
| **Emek** | Emek/İşçi Hakları (İşçi Mahpuslar ayrıca Hapishane altında kendi konusu olarak duruyor) |
| **Diğer** | Alanların hiçbirine net oturmayan tek-seferlik konular — örn. Yapay Zeka Kullanımı ve Etik. İleride benzer kategori-dışı yazılar için sepet görevi görür. |

**Not**: TCPS Kitaplığı (seri, metadata düzeyinde) ve Kanlı Pazar/Kayyum Arşivi (proje, ayrı bir taksonomi katmanı) bu alan sistemine dahil değil — onlar zaten kendi mekanizmalarıyla (seri alanı, proje kartı) çözülüyor.

### Yeni ilke: Alan adı, kendi altındaki hiçbir Konu ile aynı olamaz

Bir alan (örn. Hapishane, Göç) zaten o alana giren her şeyin ortak zeminini tanımlıyor. Bu yüzden aynı isimde bir Konu, o alanın altında ayrıca var olamaz — varsa bu, etiketleme eksikliğinin işaretidir, yeni bir taksonomi katmanı değil.

Şu an bu ilkeyi ihlal eden iki yer tespit edildi:

- **"Hapishane"** — hem alan adı hem de aşağıdaki kanonik konu listesinde ayrı bir konu (78/32 civarı içerik). Faz 3'te XML export'ta çözülecek: bu etiketi taşıyan her içeriğin başka (daha spesifik: Tecrit, Mahpus, D Tipi vb.) bir konu etiketi olup olmadığına bakılacak — varsa genel "Hapishane" etiketi düşürülecek, gerçekten hiçbir alt konuya oturmayan kapsayıcı içerik kalırsa alan adından farklı bir isimle (örn. "Genel Hapishane Yazıları") ayrı bir konu olarak tutulacak.
- **"Göç"** — aynı sorun, aşağıdaki "Göç / uluslararası" bölümünde ayrı bir konu olarak listelenmiş. Alan adı olarak kalacak, ama altında ayrı bir "Göç" konusu olamaz; yerine Mültecilik, Avrupa'da Göç, Göç Politikaları gibi daha spesifik konular gelmeli — kesin liste Faz 3'teki gerçek etiket kullanımına bakılarak çıkarılacak.

### Alan üyeliği içerikte değil, konuda yaşar (veri modeli)

İçeriğin metadata'sında yalnızca `topics: []` tutulur — ayrıca bir `alan` alanı **yazılmaz**. Bir içerik hangi Alan Hub Sayfası'nda görüneceğini, taşıdığı `topics`'in bu dosyadaki (`topics.json` benzeri) konu→alan eşlemesinden build-time'da türetilerek elde eder.

Bunun doğal sonucu: bir içerik birden fazla konuya sahipse ve bu konular farklı alanlara aitse (örn. bir yazı hem `tecrit` [→Hapishane] hem `insan-haklari` [→Göç] taşıyorsa), o içerik **otomatik olarak her iki Alan Hub Sayfası'nda da** görünür. "Birincil alan" diye ayrı bir işaretleme yok — konu birden fazla alana ödünç verilmiyor, alan zaten konunun bir türevi olduğu için çoklu görünüm tutarlı kabul ediliyor.

### Doğrulanacak açık nokta

"İnsan Hakları" konusunun Göç altına atanması bir varsayım — gerçek WordPress export'unda bu etiketi taşıyan yazıların içeriğine bakılınca Hapishane bağlamında daha ağırlıklı çıkarsa, tek satırlık bir düzeltmeyle taşınabilir (yukarıdaki ilke gereği URL etkilenmez).

---

374 etiket + 12 kategori tarandı. Sonuç üç katmana ayrılıyor: **kanonik konular** (statik sitede `/konu/` sayfalarına dönüşecek), **dışlanan etiketler** (kişi/kaynak/çöp — konu değil), ve **kategoriler** (tip/dil ayrımı için kullanılacak, konu değil).

---

## 1. Kategoriler → `tip` ve `dil` alanlarına eşlenecek

| Kategori | İçerik | Yeni alan |
|---|---|---|
| Yazılar (65) | Ana yazı havuzu | `tip: yazı` |
| Söyleşiler (38) | Sizinle ilgili/sizden alınan içerik (basında) | `tip: basında` |
| English (20) | | `dil: en` |
| Deutsch (8) | | `dil: de` |
| Français (5) | | `dil: fr` |
| Videolarr + 4 varyantı, Kitaplar, Uncategorized | İçi boş / kalıntı kategori adları — gerçek video (23) ve kitap (19) içeriği ayrı custom post type'larda duruyor, bu kategoriler dışlanıyor | **Hariç tut** |

**Not**: Yazılar (65) + Söyleşiler (38) + yabancı dil kategorileri (33) toplamı 136 ediyor ama bu distinct içerik sayısı değil — yabancı dilli postların bir kısmı muhtemelen Yazılar/Söyleşiler'in çevirisi olarak aynı içeriğe ikinci bir kategori olarak eklenmiş. Gerçek distinct yazı sayısı (WordPress'in toplam gösterdiği 130 rakamına da tam oturmuyor) Faz 3'teki XML export'ta her post'un `dil` ve kategori kombinasyonu görülünce netleşecek.

---

## 2. Kanonik konu listesi (önerilen)

Aşağıdaki gruplar, birbirinin varyantı olan etiketleri (yazım farkı, tekil/çoğul, dil çevirisi, eski/yeni isimlendirme) tek bir kanonik başlıkta topluyor. Sayılar kaba `count` toplamı değil, en yüksek görülen tekil değer — gerçek sayı XML export'unda netleşecek.

### Hapishane / ceza infaz sistemi (çekirdek küme)
- **Hapishane** ⚠️ *alan adıyla çakışıyor, bkz. "Yeni ilke" bölümü — Faz 3'te ya spesifik konulara dağıtılacak ya da yeniden adlandırılacak* ← Hapishane (78), Cezaevi (70), Prison (33), Türkiye Hapishaneleri (83), Turkey's Prisons (34), Gefängnis (4), Hapishanelerin Tarihi, Osmanlı Hapishaneleri, Hapishane Mimarisi
- **Mahpus** ← Mahpus (23), Mahpuslar, Mahpus Hakları, Mahpus Hakları El Kitabı, Mahpus Emeği
- **Hasta Mahpuslar** ← Hasta mahpus (8), Hasta Mahpuslar (4), Mahpusun Sağlık Hakkı
- **İşçi Mahpuslar** ← işçi mahpus (2), işçi mahpuslar (4), İşçi Mahpuslar (dup. slug)
- **Öğrenci Mahpuslar** ← öğrenci mahpuslar, Öğrenci Mahpuslar (2 farklı slug), Mahpusun Öğrenim Hakkı, Tutuklu Öğrenciler
- **Çocuk Mahpuslar** ← Çocuk Mahpuslar (5)
- **Kadın Mahpuslar** ← kadın mahpuslar
- **Yabancı/Azınlık Mahpuslar** ← Azınlık Mahpuslar, Yabancı Mahpuslar, Foreign-National Prisoners, Roman Mahpuslar
- **LGBTİ Mahpuslar** ← LGBTİ, LGBTİ Hapishanesi, LGBTİ Mahpus (6), LGBTİ mahpuslar, LGBTI Prisoners, Pembe Oda
- **Engelli/Yaşlı Mahpuslar** ← Engelli Mahpuslar, Disabled Prisoners, Elderly Prisoners, Yaşlı Mahpuslar, Özel İhtiyaçları Olan Mahpuslar (+El Kitabı), Prisoners with Special Needs
- **Siyasi Mahpuslar** ← Siyasi Mahpus, Political Prisoners, Politische Gefangene, Adli Mahpus (karşıt kavram, aynı kümede tutulabilir)
- **Kampüs Hapishaneleri** ← Kampüs Hapishane, Campus Prisons, Campusgefängnisse
- **D/F/S/Y Tipi Hapishaneler** ← her biri kendi kanonik başlığında: D Tipi, F Tipi, S Tipi, Y Tipi (+ Türkçe/İngilizce uzun adları ve çevirileri)
- **Kuyu Tipi Hapishane** ← Kuyu Tipi Hapishane
- **Yüksek Güvenlikli Hapishaneler** ← Yüksek Güvenlikli Kapalı Ceza İnfaz Kurumu, High-Security Prisons, Hochsicherheitsgefängnisse, maximum security prison
- **Tecrit / İzolasyon** ← Tecrit, İzolasyon, Isolation, Isolationshaft, Solitary Confinement
- **Tek Tip Elbise** ← Tek Tip Elbise
- **Çıplak Arama / Kelepçeli Muayene** ← ayrı ayrı korunabilir (farklı ihlal türleri)
- **Disiplin Cezaları** ← Disiplin Cezaları
- **Ceza İnfaz İstatistikleri** ← Ceza İnfaz Kurumu İstatistikleri (7), Adli İstatistikler, TÜİK, Turkstat Crime Statistics, Avrupa Konseyi Yıllık Ceza İstatistikleri, Mahpus Sayısı
- **Af / Örtük Af** ← Af, Örtük Af, Amnestie, Amnesty, Covert Amnesty, Selective Amnesty
- **Kriminalizasyon** ← Kriminalizasyon, Kriminalisierung, Criminalization, Crimmigration
- **Toplu Hapsetme** ← Mass Incarceration, Prison Expansion, Prison System, Incarceration, Imprisonment

### Ölüm Oruçları / Direniş
- **Ölüm Oruçları** ← Ölüm Orucu, Death Fasts, Açlık Grevi, Hunger Strikes, Hayata Dönüş
- **Kutsal İnsan / Yaşamın Kutsallığı** ← Kutsal İnsan, Sancity of Life (opsiyonel alt-konu)

### Siyasi tarih
- **Kanlı Pazar** ← Kanlı Pazar (10) — proje sayfasına da bağlanacak
- **Gezi** ← Gezi Ayaklanması, Gezi Direnişi, Gezi Olayları (üçü aynı yazı grubu, tek etikete indirilecek)
- **16 Şubat 1969 / 6. Filo** ← ayrı bir tarihsel olay konusu

### Emek / hukuk
- **Emek / İşçi Hakları** ← (İşçi Mahpuslar'dan ayrı, genel emek konusu varsa)
- **Hukuk / Adalet Sistemi** ← Rule of Law, Rechtsstaat, Justice System, Sosyal Hukuk, Güncel Hukuk

### Göç / uluslararası
- **Göç** ⚠️ *alan adıyla çakışıyor, bkz. "Yeni ilke" bölümü — Faz 3'te Mültecilik / Avrupa'da Göç / Göç Politikaları gibi spesifik konulara ayrılacak* ← Migration, Einwanderung, Mülteciler, Refugees, Asylum Seekers
- **İnsan Hakları** ← Human Rights, Human Rights in Turkey, Menschenrechte

### Diğer akademik/editoryal
- **TCPS Kitaplığı** ← TCPS (7), TCPS Kitaplığı (15) — biyografi sayfasına bağlı, ana sayfada öne çıkmayacak
- **Kritik Hapishane Çalışmaları** ← Critical Prison Studies, Kritische Gefängnisforschung

---

## 3. Dışlanan etiketler (konu DEĞİL — göçe farklı biçimde taşınacak)

**Kişi adları** (söyleşi yaptığı/onunla söyleşi yapılan kişiler — konu sayfası değil, ileride "kişiye göre ara" için ayrı `kisi` alanı olabilir):
Ayşegül Algan, Berivan Korkut, Ayşe Hür, Beyza Kural, Cengiz Aktar, Ahmet Külsoy, Namık Kemal Dinç, Zafer Kıraç, İdil Aydınoğlu, ve ~60 benzer isim daha.

**Medya/kaynak adları** (nerede yayınlandığı — `kaynak` alanı, "Basında" arşivinde filtre olarak kullanılabilir):
Bianet (45), CİSST (40 — hem kaynak hem kurum, dikkat), Prison (33 — İngilizce genel terim), TÜİK, İMC TV, BirGün, Cumhuriyet, CNN Türk, ANF, Açık Radyo, Al Jazeera Türk, Akit, ANKA Haber Ajansı, Deutsche Welle, DW, Reuters, Milliyet, Hürriyet, NTV, vb.

**Kendi adı**: Mustafa Eren (161) — öz-etiket, göçe dahil edilmeyecek.

**Tema kalıntısı / çöp etiketler** (count:0, ilgisiz): Justin Bieber, Metallica, Muse, Ramones, Limp Bizkit, Paul McCartney, Lil Wane, lipsum, Design, Illustration, Typography, Tag 1/2/3, Text, Corporate Identity, Clint English.

---

## Sonraki adım

Bu liste **taslak** — kesin kanonik isimler, hangi konuların ayrı `/konu/` sayfası hak ettiği, ve yukarıdaki alan atamalarının (özellikle İnsan Hakları) doğruluğu, Faz 4'te gerçek XML export elimize geçtiğinde, her etiketin gerçekten hangi yazılara atandığını görerek netleştirilecek. Şimdiden büyük resmi görmüş olduk — asıl emek gerektiren kısım (374 etiketi elle kanonikleştirme + alan katmanı) bitti sayılır.
