// Bir içeriğin WordPress etiketlerinden Astro `topics` listesini üretir.
import { tags, postId } from './wxr.mjs';

/**
 * @param {object} item
 * @param {Record<string, string|null>} tagTopicMap - etiket adı -> topic id ya da null
 * @param {Set<string>} validTopicIds - topics.json'daki gerçek id'ler (bütünlük kontrolü)
 * @param {object} contentOverrides - post_id -> { extraTopics?: string[] }
 * @returns {{ topics: string[], warnings: string[], errors: string[] }}
 */
export function resolveTopics(item, tagTopicMap, validTopicIds, contentOverrides) {
  const warnings = [];
  const errors = [];
  const id = postId(item);
  const itemTags = tags(item);

  const fromTags = new Set();
  for (const tag of itemTags) {
    if (!(tag in tagTopicMap)) {
      errors.push(`Bilinmeyen etiket "${tag}" tag-topic-map.json'da yok (post_id=${id})`);
      continue;
    }
    const topicId = tagTopicMap[tag];
    if (topicId === null) continue;
    if (!validTopicIds.has(topicId)) {
      errors.push(`tag-topic-map.json "${tag}" -> "${topicId}" topics.json'da bulunamıyor (post_id=${id})`);
      continue;
    }
    fromTags.add(topicId);
  }

  const extraTopics = contentOverrides[id]?.extraTopics ?? [];
  for (const topicId of extraTopics) {
    if (!validTopicIds.has(topicId)) {
      errors.push(`content-overrides.json extraTopics "${topicId}" topics.json'da bulunamıyor (post_id=${id})`);
      continue;
    }
    fromTags.add(topicId);
  }

  const topics = [...fromTags];
  if (topics.length === 0) {
    warnings.push(`Hiç topic bulunamadı (post_id=${id}) — content-overrides.json'a extraTopics eklenmeli`);
  }

  return { topics, warnings, errors };
}
