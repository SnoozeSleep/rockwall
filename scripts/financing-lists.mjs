/*
 * /mattress-financing (EN + ES), "Why Finance a Mattress in Rockwall?" (client brief, November 2026): the two check-icon
 * lists ("They want better sleep immediately…" and "Back and joint support…") read in regular weight, normal style. The
 * builder wrapped every item's text in <em> with <strong> runs; those tags are unwrapped, the spans inside them (font,
 * colour) are kept. Desktop and phone copy of the section (row-v406PLZT4C, row-foBhvNq_N6), server markup and hydration
 * payload alike (the builder runtime re-renders from the payload). Only list items whose text is one of the section's
 * items are touched. Idempotent.  node scripts/financing-lists.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const cheerio = require('cheerio');
const CHECK = process.argv.includes('--check');
const BS = String.fromCharCode(92);
const escapeJsonForScript = (json) => json.split('<').join(BS + 'u003C').split(String.fromCharCode(0x2028)).join(BS + 'u2028').split(String.fromCharCode(0x2029)).join(BS + 'u2029');

/* the section's two copies (desktop, phone): the same row ids in both languages */
const ROWS = ['row-v406PLZT4C', 'row-foBhvNq_N6'];
const LI = /<li>((?:(?!<\/li>)[\s\S])*)<\/li>/g;
const EMPHASIS = /<\/?(?:em|i|strong|b)>/g;
const text = (html) => html.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim();

let changed = 0, problems = 0;
for (const file of ['app/(en)/mattress-financing/content.ts', 'app/es/mattress-financing/content.ts']) {
  const abs = path.join(ROOT, file);
  const src = fs.readFileSync(abs, 'utf8');
  const bodyM = src.match(/export const BODY_HTML = ("[\s\S]*?");\r?\n/);
  if (!bodyM) { console.error(`${file}: BODY_HTML not found`); problems++; continue; }
  const body = JSON.parse(bodyM[1]);
  // the section's item texts (read only; the markup itself is edited as a string so nothing else is re-serialised)
  const $ = cheerio.load(body, { decodeEntities: false }, false);
  const items = new Set();
  for (const id of ROWS) $(`#${id} li`).each((_, li) => { items.add(text($(li).html() || '')); });
  if (!items.size) { console.error(`${file}: no list items in ${ROWS.join(', ')}`); problems++; continue; }
  const plain = (html, count) => html.replace(LI, (m, inner) => {
    if (!items.has(text(inner)) || !EMPHASIS.test(inner)) return m;
    EMPHASIS.lastIndex = 0; count.n++;
    return `<li>${inner.replace(EMPHASIS, '')}</li>`;
  });
  const pm = body.match(/(<script[^>]*id="__NUXT_DATA__"[^>]*>)([\s\S]*?)(<\/script>)/);
  if (!pm) { console.error(`${file}: hydration payload not found`); problems++; continue; }
  const markupHits = { n: 0 }, payloadHits = { n: 0 };
  const markup = plain(body.replace(pm[0], '\u0000PAYLOAD\u0000'), markupHits);
  const nodes = JSON.parse(pm[2]);
  for (let i = 0; i < nodes.length; i++) if (typeof nodes[i] === 'string' && nodes[i].includes('<li>')) nodes[i] = plain(nodes[i], payloadHits);
  const payload = payloadHits.n ? pm[1] + escapeJsonForScript(JSON.stringify(nodes)) + pm[3] : pm[0];
  const next = src.replace(bodyM[1], () => JSON.stringify(markup.replace('\u0000PAYLOAD\u0000', () => payload)));
  if (next !== src) {
    if (CHECK) { console.error(`${file}: ${markupHits.n} list item(s) still carry <em>/<strong>`); problems++; continue; }
    fs.writeFileSync(abs, next); changed++;
  }
  console.log(`${file}: ${items.size} item texts; unwrapped ${markupHits.n} item(s) in the markup, ${payloadHits.n} in the payload`);
}
if (problems) process.exit(1);
console.log(changed ? `${changed} file(s) written` : 'up to date');
