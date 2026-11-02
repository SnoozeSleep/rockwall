/*
 * The shared typography system on the builder pages (client brief, November 2026): /mattress-financing and /about-us,
 * English and Spanish. The builder gave every heading, line and button its own sizes, paddings and breakpoint overrides;
 * this script tags the elements that follow the site's section patterns with the wrapper classes that
 * overrides/global.css styles from the one scale (see the "Typography system" block there):
 *   snz-section   every section that is not a hero (section padding)
 *   snz-h2-wrap   a heading element (h1–h4) that titles a section — not a card title inside a row of three or more
 *                 columns; --light when the builder paints it white; --center when the builder centres it
 *   snz-lead-wrap a sub-heading / paragraph that introduces a list (followed by a bullet list, or ending with ":")
 *   snz-body-wrap any other sub-heading / paragraph / p-only heading in those sections (body copy)
 *   snz-list-wrap every builder bullet list (the check-icon list)
 *   snz-cta-wrap  every builder button outside heroes and card rows (the two-line call-to-action button)
 *   snz-two-col   a row of exactly two columns with an image on one side and text on the other (--image-right keeps
 *                 the builder's order when the picture is the second column)
 * Heroes (data-snz-hero), the location cards and other three-column card rows are left alone. Markup only: the classes
 * are attributes on wrappers, which hydration keeps (like data-snz-hero). Idempotent.  node scripts/typography.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const cheerio = require('cheerio');
const CHECK = process.argv.includes('--check');
const PAGES = ['mattress-financing', 'about-us'];
const OURS = ['snz-section', 'snz-h2-wrap', 'snz-h2-wrap--light', 'snz-h2-wrap--center', 'snz-lead-wrap', 'snz-body-wrap', 'snz-text-wrap--light', 'snz-list-wrap', 'snz-cta-wrap', 'snz-two-col', 'snz-two-col--image-right'];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** the declarations the page's own CSS gives an element: every rule whose selector names `.heading-ID` or `.cheading-ID`
    (the builder writes colour and alignment on the c-prefixed class), in source order */
function declsFor(head, id) {
  if (!id) return [];
  const re = new RegExp(`(?:^|[\\s,>])\\.c?${esc(id)}(?![\\w-])`);
  const out = [];
  for (const m of head.matchAll(/([^{}]+)\{([^{}]*)\}/g)) if (re.test(m[1]) && !/[\s>+~]\s*(?:a|li|ul|ol|u|s)\b|:hover|::?(?:before|after)/.test(m[1].split(',').find((sel) => re.test(sel)) || '')) out.push(m[2]);
  return out;
}
const lastValue = (decls, prop) => { let v = null; for (const d of decls) for (const m of d.matchAll(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'g'))) v = m[1].trim(); return v; };
/** does the page paint this element white? (the last `color` it declares for the element) */
const paintedWhite = (head, id) => /^(?:var\(--white\)|#fff(?:fff)?|white|rgb\(255,\s*255,\s*255\))/i.test(lastValue(declsFor(head, id), 'color') || '');
const centered = (head, id) => /^center/i.test(lastValue(declsFor(head, id), 'text-align') || '');

let changed = 0, problems = 0;
const totals = { sections: 0, h2: 0, lead: 0, body: 0, lists: 0, buttons: 0, twoCol: 0, skippedCards: 0 };
for (const slug of PAGES) {
  for (const dir of [path.join(ROOT, 'app', '(en)', slug), path.join(ROOT, 'app', 'es', slug)]) {
    const file = path.join(dir, 'content.ts');
    const src = fs.readFileSync(file, 'utf8');
    const headM = src.match(/export const HEAD_HTML = ("[\s\S]*?");\r?\n/); const bodyM = src.match(/export const BODY_HTML = ("[\s\S]*?");\r?\n/);
    if (!headM || !bodyM) { console.error(`${path.relative(ROOT, file)}: HEAD_HTML / BODY_HTML not found`); problems++; continue; }
    const head = JSON.parse(headM[1]); const body = JSON.parse(bodyM[1]);
    const $ = cheerio.load(body, { decodeEntities: false }, false);
    // start clean so the run is idempotent
    for (const c of OURS) $(`.${c}`).removeClass(c);

    const isHero = (el) => $(el).closest('[data-snz-hero]').length > 0;
    const cardRow = (el) => { const row = $(el).closest('.c-row'); return row.length > 0 && row.children('.inner').children('.c-column').length >= 3; };
    /* card columns: a picture plus one or two short text elements and nothing else (the About feature cards, the
       location cards, the financing partners), repeated at least three times in a section. On phones the builder
       stacks each card as its own one-column row, so the three-column test above does not see them. */
    const elementKids = (col) => { const inner = $(col).children('.inner'); return (inner.length ? inner : $(col)).children().filter((_, k) => /\bc-/.test($(k).attr('class') || '')).toArray(); };
    const isCardColumn = (col) => { const kids = elementKids(col); const imgs = kids.filter((k) => $(k).hasClass('c-image')).length; const texts = kids.filter((k) => $(k).is('.c-heading, .c-sub-heading, .c-paragraph')).length; return imgs >= 1 && texts >= 1 && texts <= 2 && imgs + texts === kids.length; };
    const cardCols = new Set();
    $('.c-section').each((_, s) => { const cols = $(s).find('.c-column').toArray().filter(isCardColumn); if (cols.length >= 3) for (const c of cols) cardCols.add(c); });
    const inCard = (el) => { const col = $(el).closest('.c-column')[0]; return !!col && cardCols.has(col); };
    const hasHeading = (el) => $(el).find('h1, h2, h3, h4').length > 0;
    const text = (el) => $(el).text().replace(/\s+/g, ' ').trim();
    const nextElementIsList = (el) => { const n = $(el).nextAll('.c-wrapper, [class*="c-"]').first(); return n.length > 0 && n.hasClass('c-bullet-list'); };
    const idOf = (el) => $(el).attr('id') || '';

    $('.c-section').each((_, s) => { if (isHero(s)) return; $(s).addClass('snz-section'); totals.sections++; });

    $('.c-heading, .c-sub-heading, .c-paragraph').each((_, el) => {
      if (isHero(el)) return;
      if (cardRow(el) || inCard(el)) { totals.skippedCards++; return; }
      const $el = $(el); const id = idOf(el); const light = paintedWhite(head, id);
      if ($el.hasClass('c-heading') && hasHeading(el)) {
        $el.addClass('snz-h2-wrap'); if (light) $el.addClass('snz-h2-wrap--light'); if (centered(head, id)) $el.addClass('snz-h2-wrap--center'); totals.h2++; return;
      }
      if (!text(el)) return;
      if (nextElementIsList(el) || /:\s*$/.test(text(el))) { $el.addClass('snz-lead-wrap'); totals.lead++; } else { $el.addClass('snz-body-wrap'); totals.body++; }
      if (light) $el.addClass('snz-text-wrap--light');
    });

    $('.c-bullet-list').each((_, el) => { if (isHero(el)) return; $(el).addClass('snz-list-wrap'); totals.lists++; });
    $('.c-button').each((_, el) => { if (isHero(el) || cardRow(el) || inCard(el)) return; $(el).addClass('snz-cta-wrap'); totals.buttons++; });

    $('.c-row').each((_, row) => {
      if (isHero(row)) return;
      const cols = $(row).children('.inner').children('.c-column');
      if (cols.length !== 2) return;
      // a column's elements sit inside its .inner wrapper; a media column holds nothing but pictures
      const isMedia = (col) => { const inner = $(col).children('.inner'); const kids = (inner.length ? inner : $(col)).children().filter((_, k) => /\bc-/.test($(k).attr('class') || '')); return kids.length > 0 && kids.toArray().every((k) => $(k).hasClass('c-image')); };
      const media = [isMedia(cols[0]), isMedia(cols[1])];
      if (media[0] === media[1]) return; // both pictures or no picture: not the image + text pattern
      $(row).addClass('snz-two-col'); if (media[1]) $(row).addClass('snz-two-col--image-right'); totals.twoCol++;
    });

    const next = src.replace(bodyM[1], () => JSON.stringify($.html()));
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    if (next !== src) { if (CHECK) { console.error(`${rel}: typography classes out of date`); problems++; continue; } fs.writeFileSync(file, next); changed++; console.log(`${rel}: tagged`); }
  }
}
console.log(`sections ${totals.sections}, headings ${totals.h2}, lead-ins ${totals.lead}, body lines ${totals.body}, lists ${totals.lists}, buttons ${totals.buttons}, two-column rows ${totals.twoCol}; skipped inside card rows: ${totals.skippedCards}`);
if (problems) process.exit(1);
console.log(changed ? `${changed} file(s) written` : 'up to date');
