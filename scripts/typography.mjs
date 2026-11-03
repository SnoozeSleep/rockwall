/*
 * Shared typography on the builder pages, SCOPED (client brief, November 2026, re-applied after the revert of 7130686).
 * Only the light-background content blocks listed in LIGHT get the wrapper class `content-light`; the shared classes are
 * added inside those blocks only, and every rule in overrides/global.css's "Typography system (scoped)" block requires a
 * `.content-light` ancestor. Dark or image sections (hero, trust strip, Dream Mapping, Payment Plans, 365-Night, "Sleep
 * Better Now", quiz, guarantee, reviews), the brands logos and the location cards are never wrapped. Text colour and
 * alignment stay the builder's own: the shared rules set size, weight, line-height and spacing, nothing else.
 *   snz-h2-wrap   a heading element (h1–h4) — --center when the builder centres it (the 22ch box is then centred too)
 *   snz-lead-wrap a text element that introduces a list (a bullet list follows, or it ends with ":")
 *   snz-body-wrap any other text element
 *   snz-list-wrap a builder bullet list (the check-icon list)
 *   snz-cta-wrap  a builder button (only in blocks whose `cta` flag is set)
 *   snz-two-col   the wrapped row itself when it is one picture column + one text column
 * The ids are the builder's element ids, the same in English and Spanish. Idempotent.  node scripts/typography.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const cheerio = require('cheerio');
const CHECK = process.argv.includes('--check');

/* the light content blocks per page (desktop copy, phone copy) */
const LIGHT = {
  'mattress-financing': [
    { what: 'Why Finance a Mattress — heading + lead-in', ids: ['row-DdnPioC35E', 'row-M2K7xRxwTk'], cta: true },
    { what: 'Why Finance a Mattress — image + lists + CTA', ids: ['row-v406PLZT4C', 'row-foBhvNq_N6'], cta: true },
    { what: 'Traditional Mattress Financing (Synchrony & Wells Fargo) card', ids: ['row-SuUJ6qLz3Q', 'row-LeBOidQVb0'], cta: true },
    { what: 'How to Apply — heading + subline (the step cards are their own component)', ids: ['row-Lvi7xg6AI1', 'row--HGMqsPSE6'], cta: false },
    { what: 'FAQs — heading + subline (not the location cards, not the quiz card)', ids: ['row-_Xakxtkhjo', 'row-8LwnN1JzMw'], cta: false },
  ],
  'about-us': [
    { what: 'How to Apply — heading + subline (the step cards are their own component)', ids: ['row-E8gt8XwOID6', 'row-X9n_NDMM5N'], cta: false },
    { what: 'FAQs — heading + subline (not the location cards, not the quiz card)', ids: ['row-f3TsNjyxgt', 'row-uqH0tNyPJY'], cta: false },
  ],
};
const OURS = ['content-light', 'snz-h2-wrap', 'snz-h2-wrap--center', 'snz-lead-wrap', 'snz-body-wrap', 'snz-list-wrap', 'snz-cta-wrap', 'snz-two-col', 'snz-two-col--image-right'];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** the declarations the page's own CSS gives an element (rules naming `.heading-ID` or `.cheading-ID`), in source order */
function declsFor(head, id) {
  if (!id) return [];
  const re = new RegExp(`(?:^|[\\s,>])\\.c?${esc(id)}(?![\\w-])`);
  const out = [];
  for (const m of head.matchAll(/([^{}]+)\{([^{}]*)\}/g)) if (re.test(m[1]) && !/[\s>+~]\s*(?:a|li|ul|ol|u|s)\b|:hover|::?(?:before|after)/.test(m[1].split(',').find((sel) => re.test(sel)) || '')) out.push(m[2]);
  return out;
}
const lastValue = (decls, prop) => { let v = null; for (const d of decls) for (const m of d.matchAll(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'g'))) v = m[1].trim(); return v; };
const centered = (head, id) => /^center/i.test(lastValue(declsFor(head, id), 'text-align') || '');

let changed = 0, problems = 0;
const report = [];
for (const [slug, blocks] of Object.entries(LIGHT)) {
  for (const dir of [path.join(ROOT, 'app', '(en)', slug), path.join(ROOT, 'app', 'es', slug)]) {
    const file = path.join(dir, 'content.ts');
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const src = fs.readFileSync(file, 'utf8');
    const headM = src.match(/export const HEAD_HTML = ("[\s\S]*?");\r?\n/); const bodyM = src.match(/export const BODY_HTML = ("[\s\S]*?");\r?\n/);
    if (!headM || !bodyM) { console.error(`${rel}: HEAD_HTML / BODY_HTML not found`); problems++; continue; }
    const head = JSON.parse(headM[1]);
    const $ = cheerio.load(JSON.parse(bodyM[1]), { decodeEntities: false }, false);
    for (const c of OURS) $(`.${c}`).removeClass(c); // start clean: idempotent
    const t = { blocks: 0, h2: 0, lead: 0, body: 0, lists: 0, buttons: 0, twoCol: 0 };
    const text = (el) => $(el).text().replace(/\s+/g, ' ').trim();
    const nextIsList = (el) => { const n = $(el).nextAll('[class*="c-"]').first(); return n.length > 0 && n.hasClass('c-bullet-list'); };
    for (const b of blocks) {
      for (const id of b.ids) {
        const box = $(`#${id}`);
        if (!box.length) { console.error(`${rel}: #${id} (${b.what}) not found`); problems++; continue; }
        if (box.closest('[data-snz-hero]').length) { console.error(`${rel}: #${id} sits in a hero`); problems++; continue; }
        box.addClass('content-light'); t.blocks++;
        box.find('.c-heading, .c-sub-heading, .c-paragraph').each((_, el) => {
          const $el = $(el);
          if ($el.hasClass('c-heading') && $el.find('h1, h2, h3, h4').length) { $el.addClass('snz-h2-wrap'); if (centered(head, $el.attr('id'))) $el.addClass('snz-h2-wrap--center'); t.h2++; return; }
          if (!text(el)) return;
          if (nextIsList(el) || /:\s*$/.test(text(el))) { $el.addClass('snz-lead-wrap'); t.lead++; } else { $el.addClass('snz-body-wrap'); t.body++; }
        });
        box.find('.c-bullet-list').each((_, el) => { $(el).addClass('snz-list-wrap'); t.lists++; });
        if (b.cta) box.find('.c-button').each((_, el) => { $(el).addClass('snz-cta-wrap'); t.buttons++; });
        // the wrapped row itself: one picture column + one text column
        const cols = box.children('.inner').children('.c-column');
        if (box.hasClass('c-row') && cols.length === 2) {
          const isMedia = (col) => { const inner = $(col).children('.inner'); const kids = (inner.length ? inner : $(col)).children().filter((_, k) => /\bc-/.test($(k).attr('class') || '')); return kids.length > 0 && kids.toArray().every((k) => $(k).hasClass('c-image')); };
          const media = [isMedia(cols[0]), isMedia(cols[1])];
          if (media[0] !== media[1]) { box.addClass('snz-two-col'); if (media[1]) box.addClass('snz-two-col--image-right'); t.twoCol++; }
        }
      }
    }
    report.push(`${rel}: ${t.blocks} blocks · headings ${t.h2} · lead-ins ${t.lead} · body lines ${t.body} · lists ${t.lists} · buttons ${t.buttons} · two-column rows ${t.twoCol}`);
    const next = src.replace(bodyM[1], () => JSON.stringify($.html()));
    if (next !== src) { if (CHECK) { console.error(`${rel}: typography wrappers out of date`); problems++; continue; } fs.writeFileSync(file, next); changed++; }
  }
}
for (const r of report) console.log(r);
if (problems) process.exit(1);
console.log(changed ? `${changed} file(s) written` : 'up to date');
