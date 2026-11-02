/*
 * Adds or removes a React component in a generated route's page.tsx (after <PageClient />), the way scripts/page-schema.mjs
 * places <PageSchema>. Used by scripts/integrations.mjs (FormEmbedScript on the pages that carry the opt-in form) and
 * scripts/reviews-cta.mjs (ReviewWidgetScript on the pages that carry the reviews widget). Idempotent.
 */
import fs from 'node:fs';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** ensures `import { name } from 'from'` and `<name />` (with an optional comment line above) are in the page */
export function ensureComponent(pageFile, { name, from, comment }) {
  if (!fs.existsSync(pageFile)) return false;
  let s = fs.readFileSync(pageFile, 'utf8'); const before = s;
  const imp = `import { ${name} } from '${from}';`;
  const jsx = `<${name} />`;
  if (!s.includes(imp)) s = s.replace("import PageClient from './client';", `import PageClient from './client';\n${imp}`);
  if (!s.includes(jsx)) {
    const line = `${comment ? `      {/* ${comment} */}\n` : ''}      ${jsx}`;
    if (/return <PageClient \/>;/.test(s)) s = s.replace('return <PageClient />;', `return (\n    <>\n      <PageClient />\n${line}\n    </>\n  );`);
    else if (/<PageClient \/>[ \t]*\r?\n/.test(s)) s = s.replace(/(<PageClient \/>[ \t]*\r?\n)/, (m) => `${m}${line}\n`);
    else s = s.replace(/(\r?\n)([ \t]*<\/>[ \t]*\r?\n[ \t]*\);)/, (m, nl, close) => `${nl}${line}${nl}${close}`); // before the fragment's closing tag
    if (!s.includes(jsx)) throw new Error(`${pageFile}: could not place ${jsx}`);
  }
  if (s !== before) fs.writeFileSync(pageFile, s);
  return s !== before;
}

/** removes the component's import, its JSX line and a comment line directly above it */
export function removeComponent(pageFile, { name, from }) {
  if (!fs.existsSync(pageFile)) return false;
  let s = fs.readFileSync(pageFile, 'utf8'); const before = s;
  s = s.replace(new RegExp(`import \\{ ${esc(name)} \\} from '${esc(from)}';\\r?\\n`), '');
  s = s.replace(new RegExp(`(?:      \\{/\\*[^\\n]*\\*/\\}\\r?\\n)?      <${esc(name)} />\\r?\\n`), '');
  if (s !== before) fs.writeFileSync(pageFile, s);
  return s !== before;
}
