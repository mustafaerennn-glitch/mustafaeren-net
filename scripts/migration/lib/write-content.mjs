// Frontmatter nesnesini + Markdown gövdesini deterministik bir .md dosyasına yazar.
// js-yaml varsayılan olarak nesne anahtar sırasını korur (sortKeys vermiyoruz) — bu yüzden
// build-frontmatter.mjs'deki alan sırası çıktıya birebir yansır.
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { dump } from 'js-yaml';

/**
 * @param {string} destDir - ör. .tmp/migration-output/yazilar
 * @param {string} slug
 * @param {object} frontmatter
 * @param {string} markdownBody
 * @returns {string} yazılan dosyanın tam yolu
 */
export function writeContentFile(destDir, slug, frontmatter, markdownBody) {
  mkdirSync(destDir, { recursive: true });
  const yamlBlock = dump(frontmatter, { lineWidth: -1, noRefs: true });
  const content = `---\n${yamlBlock}---\n\n${markdownBody}\n`;
  const outPath = path.join(destDir, `${slug}.md`);
  writeFileSync(outPath, content);
  return outPath;
}
