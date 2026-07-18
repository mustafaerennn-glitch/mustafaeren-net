import { readFileSync } from 'node:fs';
import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const localeSchema = z.enum(['tr', 'en', 'de', 'fr']);

// --- Merkezi referans koleksiyonları ---
const topics = defineCollection({
  loader: file('./src/data/topics.json'),
  schema: z.object({
    ad: z.string(),
    alan: z.enum(['hapishane', 'siyasi-tarih', 'goc', 'emek', 'diger']),
  }),
});

const mecralar = defineCollection({
  loader: file('./src/data/mecralar.json'),
  schema: z.object({
    ad: z.string(),
    // Opsiyonel: bazı mecralar (özellikle kapanmış TV/podcast kanalları) için gerçek bir web
    // adresi yok. Sahte/placeholder URL üretmek yerine alan boş bırakılıyor — MecraRozeti.astro
    // bu durumda tıklanamaz varyantı, ama mecranın gerçek adıyla gösterir (bkz. component).
    url: z.string().url().optional(),
    yayinEki: z.string(), // bulunma eki: "Bianet'te yayımlanan..." → "'te"
    iyelikEki: z.string(), // ilgi eki: "Bianet'in yaptığı..." → "'in"
  }),
});

// Astro'nun reference() Zod dönüşümü yalnızca ŞEKLİ doğruluyor (doğru koleksiyon adı) —
// hedef id'nin GERÇEKTEN var olup olmadığını kontrol ETMİYOR (sessizce undefined'a düşüyor).
// "Olmayan bir konuya/mecraya referans build-time'da hata verir" ilkesini (talimat) gerçekten
// sağlamak için topics.json/mecralar.json'ı burada senkron okuyup her referansı elle doğruluyoruz.
const topicsJson = JSON.parse(readFileSync(new URL('./data/topics.json', import.meta.url), 'utf-8')) as { id: string }[];
const mecralarJson = JSON.parse(readFileSync(new URL('./data/mecralar.json', import.meta.url), 'utf-8')) as { id: string }[];
const validTopicIds = new Set(topicsJson.map((t) => t.id));
const validMecraIds = new Set(mecralarJson.map((m) => m.id));

const topicsRefSchema = z.array(reference('topics')).min(1).superRefine((refs, ctx) => {
  for (const ref of refs) {
    if (!validTopicIds.has(ref.id)) {
      ctx.addIssue({ code: 'custom', message: `Bilinmeyen topic id: "${ref.id}" — src/data/topics.json içinde tanımlı değil.` });
    }
  }
});

// reference('mecralar') iki yerde (zorunlu: Basında; opsiyonel: Yazı/Video) aynı doğrulamayla
// kullanılıyor — overload yerine iki ayrı sabit, TS çıkarımını basit tutmak için.
const mecraRefRequired = reference('mecralar').superRefine((ref, ctx) => {
  if (!validMecraIds.has(ref.id)) {
    ctx.addIssue({ code: 'custom', message: `Bilinmeyen mecra id: "${ref.id}" — src/data/mecralar.json içinde tanımlı değil.` });
  }
});
const mecraRefOptional = mecraRefRequired.optional();

// site içi göreli yol (/pdf/...) VEYA mutlak URL kabul eden ortak yardımcı şema
const linkSchema = z.string().refine(
  (v) => v.startsWith('/') || URL.canParse(v),
  'Geçerli bir site içi yol veya mutlak URL olmalı.',
);

const ortakAlanlar = {
  title: z.string(),
  lang: localeSchema,
  description: z.string(), // index kart açıklaması + meta description kaynağı
  topics: topicsRefSchema,
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(), // yoksa description kullanılır
};

const yazilar = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/yazilar' }),
  schema: ({ image }) =>
    z.object({
      ...ortakAlanlar,
      // YALNIZCA ana dil (TR) girdisinde doldurulur; çeviri girdilerinde boş kalır (tek yönlü)
      translations: z.array(reference('yazilar')).optional(),
      publishDate: z.coerce.date(), // tam tarih (gün dahil)
      mecra: mecraRefOptional,
      // mecra yoksa: UI'da gri "Mustafaeren.net" rozeti gösterilir (bkz. mockup)
      featuredImage: image(), // ZORUNLU (Yazılar'ın standart alanı, opsiyonel değil)
      featuredImageAlt: z.string(), // dekoratifse bilinçli olarak boş string kabul edilir
      pdf: linkSchema.optional(),
      editorNote: z.string().optional(), // nadir/koşullu — arşiv/çeviri notu
    }),
});

const basinda = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/basinda' }),
  schema: ({ image }) =>
    z.object({
      ...ortakAlanlar,
      translations: z.array(reference('basinda')).optional(),
      publishDate: z.coerce.date(),
      mecra: mecraRefRequired, // ZORUNLU — Basında'nın tamamı mecralı
      featuredImage: image(), // ZORUNLU
      featuredImageAlt: z.string(),
      editorNote: z.string().optional(),
      sources: z
        .array(
          z.object({
            mecra: mecraRefRequired,
            tur: z.enum(['birincil', 'ikincil']),
          }),
        )
        .optional(), // SADECE birden fazla kaynak olduğunda kullanılır
      pdf: linkSchema.optional(),
      // NOT: içerik-türü (Haber/Söyleşi/Podcast) alanı YOK — bilinçli karar
    }),
});

const videolar = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/videolar' }),
  schema: ({ image }) =>
    z.object({
      ...ortakAlanlar,
      translations: z.array(reference('videolar')).optional(),
      publishDate: z.coerce.date(),
      videoTuru: z.enum(['söyleşi', 'belgesel', 'konferans-panel', 'kısa-video']),
      embedUrl: z.string().url(), // ayrı alan — "blind channel-id" kuralı YOK
      mecra: mecraRefOptional,
      durationMinutes: z.number().int().positive(), // "38 dk" gibi metin DEĞİL — UI dile göre formatlar
      thumbnail: image(), // index kart ızgarası için (128×72 sabit boyut, bkz. mockup)
      thumbnailAlt: z.string(),
    }),
});

const kitaplar = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/kitaplar' }),
  schema: ({ image }) =>
    z.object({
      ...ortakAlanlar,
      translations: z.array(reference('kitaplar')).optional(),
      year: z.number(), // SADECE YIL — kitaplar gün-bazlı tarihlenmiyor, bilinçli karar
      kitapTuru: z.enum(['yazdıklarım', 'editörlük', 'katkılar']),
      // Kitabın GERÇEKTEN yayımlandığı dil — `lang` bu sayfanın dili (çeviri tanıtım
      // sayfalarında `lang` ile farklı olabilir, örn. TR yayımlanmış bir kitabın EN tanıtım
      // sayfası `lang: en` + `yayinDili: tr` taşır). TR-only kitaplarda boş bırakılır
      // (lang zaten gerçek yayın dilini temsil eder), yalnızca çeviri sayfalarında zorunlu.
      yayinDili: localeSchema.optional(),
      yayinevi: z.string(),
      sayfaSayisi: z.number(),
      kapak: image(), // object-fit: contain ile gösterilecek, kırpma YOK
      kapakAlt: z.string(),
      yayineviUrl: z.string().url().optional(),
      seri: z.string().optional(), // örn. "TCPS Kitaplığı" — badge olarak gösterilir, ayrı kategori DEĞİL
      pdf: linkSchema.optional(),
      // İSTİSNAİ alan: bu kitap kendi `lang`'ı dışında hangi dillerin Kitaplar
      // listesinde (Tümü + tür sekmeleri) de bir kart olarak görünsün. Yalnızca
      // gerçekten ayrı yayımlanmış (aynı eserin farklı dilde tam metni olan,
      // "tanıtım sayfası" değil) çeviriler için, tek tek işaretlenerek kullanılır —
      // varsayılan davranış (çeviriler yalnızca kendi `lang` sekmesinde görünür) budur.
      digerDillerdeGoster: z.array(localeSchema).optional(),
    }),
});

export const collections = { topics, mecralar, yazilar, basinda, videolar, kitaplar };
