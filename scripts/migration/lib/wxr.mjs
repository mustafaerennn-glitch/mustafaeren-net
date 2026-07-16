// WordPress eXtended RSS (WXR) dosyasını ayrıştırıp kullanışlı bir şekle sokan yardımcılar.
import { readFileSync } from 'node:fs';
import { XMLParser } from 'fast-xml-parser';

// WXR'de her metin alanı CDATA içinde geliyor — fast-xml-parser bunu {__cdata: "..."} yapıyor.
export function cdata(value) {
  if (value && typeof value === 'object' && '__cdata' in value) return value.__cdata;
  return value ?? '';
}

export function parseWxr(xmlPath) {
  const xml = readFileSync(xmlPath, 'utf-8').replace(/^﻿/, '').trimStart();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    cdataPropName: '__cdata',
    isArray: (name) => ['item', 'category', 'wp:postmeta', 'wp:comment'].includes(name),
  });
  const doc = parser.parse(xml);
  return doc.rss.channel.item;
}

export function postType(item) {
  return cdata(item['wp:post_type']);
}

export function status(item) {
  return cdata(item['wp:status']);
}

export function postId(item) {
  return String(item['wp:post_id']);
}

export function title(item) {
  return cdata(item.title);
}

export function slug(item) {
  return cdata(item['wp:post_name']);
}

export function postDate(item) {
  // GMT değil, sitenin görünen yerel saati (talimat: wp:post_date esas alınır).
  return cdata(item['wp:post_date']);
}

export function bodyHtml(item) {
  return cdata(item['content:encoded']);
}

export function link(item) {
  return cdata(item.link);
}

export function postParent(item) {
  return item['wp:post_parent'] != null ? String(item['wp:post_parent']) : undefined;
}

export function attachmentUrl(item) {
  return cdata(item['wp:attachment_url']);
}

export function categories(item) {
  const cats = item.category;
  if (!cats) return [];
  const arr = Array.isArray(cats) ? cats : [cats];
  return arr.map((c) => ({
    domain: c['@_domain'],
    nicename: c['@_nicename'],
    name: cdata(c),
  }));
}

export function tags(item) {
  return categories(item)
    .filter((c) => c.domain === 'post_tag')
    .map((c) => c.name);
}

export function categoryNicenames(item) {
  return categories(item)
    .filter((c) => c.domain === 'category')
    .map((c) => c.nicename);
}

export function postmeta(item) {
  const pm = item['wp:postmeta'];
  if (!pm) return {};
  const arr = Array.isArray(pm) ? pm : [pm];
  const out = {};
  for (const m of arr) {
    const key = cdata(m['wp:meta_key']);
    const value = cdata(m['wp:meta_value']);
    out[key] = value;
  }
  return out;
}

/** post_id -> item lookup haritası */
export function indexById(items) {
  const map = new Map();
  for (const item of items) map.set(postId(item), item);
  return map;
}

/** attachment post_id -> { url, alt } lookup haritası */
export function indexAttachments(items) {
  const map = new Map();
  for (const item of items) {
    if (postType(item) !== 'attachment') continue;
    const meta = postmeta(item);
    map.set(postId(item), {
      url: attachmentUrl(item),
      alt: meta['_wp_attachment_image_alt'] || '',
      parentId: postParent(item),
    });
  }
  return map;
}
