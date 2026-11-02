/*
 * Icon-font glyphs -> SVG masks (client brief, November 2026: "SVG icons load, no icon-font dependency").
 * The builder's CSS draws the icon in CTA buttons (phone, arrow, book, location), the FAQ chevrons, the financing
 * sub-heading mark and the old mobile-nav glyphs as Font Awesome 5 codepoints in ::before rules
 * (content:""; font-family:"Font Awesome 5 Free"): when that font does not load the visitor sees a tofu box.
 *   1. scans every generated page (app/**／content.ts) for those rules (selector + codepoint + face),
 *   2. takes each glyph's outline from the Font Awesome Free fonts the pages already ship
 *      (public/assets/lcstatic/funnel/fontawesome/webfonts/*.woff — Font Awesome Free, CC BY 4.0) into
 *      overrides/icons/fa-glyphs.json (opentype.js, a dev dependency; runs only for codepoints missing from the JSON),
 *   3. writes a CSS block into overrides/global.css (between the snz-icon-svg markers) that overrides every such rule:
 *      the pseudo-element becomes a 1em box filled with currentColor through an SVG mask of the same glyph, so the icon
 *      font is never requested and nothing depends on it. The builder's own colour on the pseudo-element still applies.
 * Idempotent.  node scripts/icon-svg.mjs [--check]   (npm run icons:svg)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const CSS_FILE = path.join(ROOT, 'overrides', 'global.css');
const GLYPHS_FILE = path.join(ROOT, 'overrides', 'icons', 'fa-glyphs.json');
const FONT_DIR = path.join(ROOT, 'public', 'assets', 'lcstatic', 'funnel', 'fontawesome', 'webfonts');
const FACES = { solid: 'fa-solid-900.woff', regular: 'fa-regular-400.woff', brands: 'fa-brands-400.woff' };
const START = '/* ---- snz-icon-svg:start';
const END = '/* ---- snz-icon-svg:end ---- */';

/* ---- 1. the builder's icon-font rules ---- */
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name === 'content.ts') files.push(p); } })(path.join(ROOT, 'app'));
const RULE = /([^{}]+)\{([^{}]*)\}/g; // CSS blocks inside the page's style text (quotes are escaped as \" in the TS source)
const FA = /font-family:\s*\\?"Font Awesome 5 (Free|Brands)\\?"/;
const GLYPH = /content:\s*\\?"([-])\\?"/;
const uses = new Map(); // "face:cp" -> Set of selectors (pseudo-element included)
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(RULE)) {
    const decl = m[2];
    if (!FA.test(decl)) continue;
    const g = decl.match(GLYPH); if (!g) continue;
    const face = /Brands/.test(decl) ? 'brands' : /font-weight:\s*(400|normal)\b/.test(decl) ? 'regular' : 'solid';
    const key = `${face}:${g[1].codePointAt(0).toString(16)}`;
    for (const raw of m[1].split(',')) {
      // the capture runs from the previous block: drop a leading <style> tag, literal \n sequences and whitespace
      const sel = raw.replace(/^[\s\S]*<style[^>]*>/, '').replace(/\\[nrt]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!sel || /^@/.test(sel)) continue;
      if (!uses.has(key)) uses.set(key, new Set());
      uses.get(key).add(sel);
    }
  }
}
if (!uses.size) { console.log('no icon-font rules found in app/**/content.ts'); process.exit(0); }

/* ---- 2. glyph outlines ---- */
fs.mkdirSync(path.dirname(GLYPHS_FILE), { recursive: true });
const glyphs = fs.existsSync(GLYPHS_FILE) ? JSON.parse(fs.readFileSync(GLYPHS_FILE, 'utf8')) : {};
const missing = [...uses.keys()].filter((k) => !glyphs[k]);
if (missing.length) {
  if (CHECK) { console.error(`glyph outlines missing for ${missing.join(', ')}: run node scripts/icon-svg.mjs`); process.exit(1); }
  let opentype;
  try { opentype = createRequire(import.meta.url)('opentype.js'); } catch { console.error('opentype.js is needed to extract glyph outlines: npm i -D opentype.js'); process.exit(1); }
  const fonts = {};
  for (const key of missing) {
    const [face, hex] = key.split(':');
    fonts[face] = fonts[face] || opentype.loadSync(path.join(FONT_DIR, FACES[face]));
    const font = fonts[face];
    const glyph = font.charToGlyph(String.fromCodePoint(parseInt(hex, 16)));
    if (!glyph || glyph.index === 0) { console.error(`U+${hex.toUpperCase()} is not in ${FACES[face]}`); process.exit(1); }
    // drawn at one em per unitsPerEm with the baseline at the ascender: canvas coordinates (y down), like the font renders
    const p = glyph.getPath(0, font.ascender, font.unitsPerEm);
    glyphs[key] = { name: glyph.name, face, adv: Math.round(glyph.advanceWidth), em: font.unitsPerEm, d: p.toPathData(1) };
  }
  const sorted = Object.fromEntries(Object.keys(glyphs).sort().map((k) => [k, glyphs[k]]));
  fs.writeFileSync(GLYPHS_FILE, JSON.stringify(sorted, null, 1) + '\n');
  console.log(`extracted ${missing.length} glyph outline(s) into overrides/icons/fa-glyphs.json: ${missing.map((k) => glyphs[k].name).join(', ')}`);
}

/* ---- 3. the override block ---- */
const dataUri = (g) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${g.adv} ${g.em}'><path d='${g.d}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/%20/g, ' ').replace(/%2C/g, ',').replace(/%3D/g, '=').replace(/%3A/g, ':').replace(/%2F/g, '/').replace(/%27/g, "'")}")`;
};
const lines = [
  `${START} — generated by scripts/icon-svg.mjs (npm run icons:svg); do not edit by hand ----`,
  '   The builder draws these icons with Font Awesome 5 codepoints in ::before rules; each becomes a 1em box filled with',
  '   currentColor through an SVG mask of the same glyph (Font Awesome Free, fontawesome.com/license/free, CC BY 4.0), so no',
  '   icon font is requested and nothing depends on one. The builder\'s own colour on the pseudo-element still applies. ---- */',
];
const keys = [...uses.keys()].sort((a, b) => glyphs[a].name.localeCompare(glyphs[b].name));
for (const key of keys) {
  const g = glyphs[key];
  const sels = [...uses.get(key)].sort().map((s) => `html ${s}`);
  lines.push(`/* ${g.name} (U+${key.split(':')[1].toUpperCase()}, ${g.face}): ${sels.length} selector(s) */`);
  lines.push(`${sels.join(',\n')} { --snz-fa: ${dataUri(g)}; content: "" !important; font-family: inherit !important; display: inline-block; width: 1em; height: 1em; vertical-align: -0.125em; background-color: currentColor; -webkit-mask: var(--snz-fa) center / contain no-repeat; mask: var(--snz-fa) center / contain no-repeat; }`);
}
lines.push(END);
const block = lines.join('\n');

let css = fs.readFileSync(CSS_FILE, 'utf8');
const nl = css.includes('\r\n') ? '\r\n' : '\n';
const s = css.indexOf(START), e = css.indexOf(END);
const next = s >= 0 && e > s ? css.slice(0, s) + block.replace(/\n/g, nl) + css.slice(e + END.length) : css.replace(/\s*$/, '') + nl + nl + block.replace(/\n/g, nl) + nl;
const selectors = keys.reduce((n, k) => n + uses.get(k).size, 0);
if (next === css) { console.log(`overrides/global.css icon block up to date: ${keys.length} glyph(s), ${selectors} selector(s)`); process.exit(0); }
if (CHECK) { console.error('overrides/global.css icon block is stale: run node scripts/icon-svg.mjs'); process.exit(1); }
fs.writeFileSync(CSS_FILE, next);
console.log(`overrides/global.css: icon block written — ${keys.length} glyph(s) (${keys.map((k) => glyphs[k].name).join(', ')}), ${selectors} selector(s), ${Math.round(block.length / 1024)} KB`);
