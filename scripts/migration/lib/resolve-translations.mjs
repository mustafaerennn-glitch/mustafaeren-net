// translation-map.json'u işleyip TR/orijinal <-> yabancı-dil çeviri ilişkisini kurar.
// Kural (onaylı plan, en riskli dosya): her grupta tam olarak 1 ana dil + 0..n çeviri olmalı,
// aynı dilde iki kardeş olamaz, bir çeviri birden fazla gruba bağlı olamaz. İhlal varsa script
// DURUR (sessizce geçmez).

/**
 * @param {object} translationMap - translation-map.json'un parse edilmiş hali
 * @returns {{ mainPostIds: Set<string>, translationToMain: Map<string, string>,
 *             mainToTranslations: Map<string, {postId: string, lang: string}[]>,
 *             errors: string[] }}
 */
export function buildTranslationIndex(translationMap) {
  const errors = [];
  const mainPostIds = new Set();
  const translationToMain = new Map();
  const mainToTranslations = new Map();
  const seenPostIds = new Set();

  for (const group of translationMap.groups) {
    const mainId = group.tr.postId;
    if (seenPostIds.has(mainId)) {
      errors.push(`translation-map.json: post_id=${mainId} birden fazla grupta ana dil olarak geçiyor`);
    }
    seenPostIds.add(mainId);
    mainPostIds.add(mainId);

    const langsInGroup = new Set();
    const translations = [];
    for (const t of group.ceviriler) {
      if (seenPostIds.has(t.postId)) {
        errors.push(`translation-map.json: post_id=${t.postId} birden fazla grupta geçiyor (çakışma)`);
        continue;
      }
      seenPostIds.add(t.postId);
      if (langsInGroup.has(t.lang)) {
        errors.push(`translation-map.json: "${group.tr.title}" grubunda "${t.lang}" dilinden birden fazla kardeş var`);
        continue;
      }
      langsInGroup.add(t.lang);
      translationToMain.set(t.postId, mainId);
      translations.push({ postId: t.postId, lang: t.lang });
    }
    mainToTranslations.set(mainId, translations);
  }

  return { mainPostIds, translationToMain, mainToTranslations, errors };
}

/**
 * @param {string} postId
 * @param {ReturnType<typeof buildTranslationIndex>} index
 * @param {Map<string, string>} slugByPostId
 * @returns {{ translations: string[] | undefined, warnings: string[], errors: string[] }}
 */
export function resolveTranslations(postId, index, slugByPostId) {
  const warnings = [];
  const errors = [];

  const group = index.mainToTranslations.get(postId);
  if (!group || group.length === 0) {
    return { translations: undefined, warnings, errors };
  }

  const translations = [];
  for (const t of group) {
    const targetSlug = slugByPostId.get(t.postId);
    if (!targetSlug) {
      errors.push(`Çeviri hedefi post_id=${t.postId} için slug üretilemedi (ana=${postId})`);
      continue;
    }
    translations.push(targetSlug);
  }

  return { translations: translations.length ? translations : undefined, warnings, errors };
}
