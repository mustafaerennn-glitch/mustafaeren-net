// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Site haritasında görünmesi anlamsız yardımcı sayfalar — arama sonuç sayfaları (tekil içerik
// taşımıyor) ve iletişim formu teşekkür sayfaları (form gönderiminden sonra ulaşılan, arama
// trafiği için hedeflenmemiş "dead-end" sayfalar).
const SITEMAP_HARIC_DESENLERI = [/\/ara\//, /\/search\//, /\/suche\//, /\/recherche\//, /\/tesekkur\//, /\/thank-you\//, /\/dank\//, /\/merci\//];

// https://astro.build/config
export default defineConfig({
  site: 'https://mustafaeren.net',
  integrations: [
    sitemap({
      filter: (page) => !SITEMAP_HARIC_DESENLERI.some((desen) => desen.test(page)),
    }),
  ],
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en', 'de', 'fr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  redirects: {
    // WordPress'ten gelen post_name'de görünmez bir BOM karakteri vardı (%ef%bb%bf olarak
    // sızmış), slug temizlendi (bkz. content-overrides.json post_id=519). Statik build'de bu
    // gerçek bir HTTP 301 üretmez (adapter/SSR yok) — meta-refresh + JS yönlendirmesi olur.
    // Gerçek 301 için son barındırma platformunun kendi redirect kuralı (Netlify _redirects,
    // Vercel vercel.json vb.) ayrıca eklenmeli.
    '/fr/basinda/le-systeme-carceral-en-turquie-est-au-bord-de-la-rupture%ef%bb%bf':
      '/fr/basinda/le-systeme-carceral-en-turquie-est-au-bord-de-la-rupture',
  },
});
