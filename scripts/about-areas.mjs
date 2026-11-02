/*
 * The About page's service-area line (client brief, November 2026). The "Meet Your Sleep Coaches" section that carried
 * "Serving Rockwall, Heath, Rowlett, Royse City, Fate and Forney from …" was removed; the sentence now sits in the page's
 * intro block as a plain paragraph (no heading) under "This Isn't Your Typical Mattress Store." — the desktop and the
 * phone copy of that section, /about-us and /es/about-us, in the server markup and the hydration payload alike (the
 * builder runtime re-renders from the payload). Cities and address come from lib/location.ts. The paragraph carries the
 * heading's own first colour so it reads on that section's background; its size is the shared body copy
 * (overrides/global.css, .snz-area-line). Idempotent.  node scripts/about-areas.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const cheerio = require('cheerio');
const CHECK = process.argv.includes('--check');
const { LOCATION } = await import(new URL('../lib/location.ts', import.meta.url)); // Node 24 strips the types
const BS = String.fromCharCode(92);
const escapeJsonForScript = (json) => json.split('<').join(BS + 'u003C').split(String.fromCharCode(0x2028)).join(BS + 'u2028').split(String.fromCharCode(0x2029)).join(BS + 'u2029');
const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* the intro heading of the two section copies (desktop, phone): the same element ids in both languages */
const HEADINGS = ['heading-01n8JF6ZzT', 'heading-2UGgBxAtgo'];
const list = (cities, and) => `${cities.slice(0, -1).join(', ')} ${and} ${cities[cities.length - 1]}`;
const L = LOCATION;
const SENTENCE = {
  en: `Serving ${list(L.areaServed, 'and')} from ${L.street}, ${L.city}, ${L.region}.`,
  es: `Atendemos ${list(L.areaServed, 'y')} desde ${L.street}, ${L.city}, ${L.region}.`,
};
const LINE = /<p class="snz-area-line">[\s\S]*?<\/p>/g;

let changed = 0, problems = 0;
for (const [locale, file] of [['en', 'app/(en)/about-us/content.ts'], ['es', 'app/es/about-us/content.ts']]) {
  const abs = path.join(ROOT, file);
  const src = fs.readFileSync(abs, 'utf8');
  const bodyM = src.match(/export const BODY_HTML = ("[\s\S]*?");\r?\n/);
  if (!bodyM) { console.error(`${file}: BODY_HTML not found`); problems++; continue; }
  const $ = cheerio.load(JSON.parse(bodyM[1]), { decodeEntities: false }, false);
  const $payload = $('script#__NUXT_DATA__').first();
  const nodes = JSON.parse($payload.html());
  let done = 0;
  for (const id of HEADINGS) {
    const holder = $(`#${id} .text-output > div`).first();
    if (!holder.length) { console.error(`${file}: #${id} not found`); problems++; continue; }
    const base = (holder.html() || '').replace(LINE, '');
    const colour = (base.match(/<span style="(color:[^"]*)"/) || [])[1] || '';
    const line = `<p class="snz-area-line"><span${colour ? ` style="${colour}"` : ''}>${escHtml(SENTENCE[locale])}</span></p>`;
    holder.html(base + line);
    // the payload keeps the same HTML string for the element's text (shared by both copies when identical)
    let hit = 0;
    for (let i = 0; i < nodes.length; i++) if (typeof nodes[i] === 'string' && nodes[i].replace(LINE, '') === base) { nodes[i] = base + line; hit++; }
    if (!hit) { console.error(`${file}: payload string for #${id} not found`); problems++; continue; }
    done++;
  }
  $payload.html(escapeJsonForScript(JSON.stringify(nodes)));
  const next = src.replace(bodyM[1], () => JSON.stringify($.html()));
  if (next !== src) {
    if (CHECK) { console.error(`${file}: service-area line out of date`); problems++; continue; }
    fs.writeFileSync(abs, next); changed++;
  }
  console.log(`${file}: ${done} intro heading(s) carry "${SENTENCE[locale]}"`);
}
if (problems) process.exit(1);
console.log(changed ? `${changed} file(s) written` : 'up to date');
