/*
 * The reviews widget inside the "Some of Our Happy Customers" section (desktop + phone copies, both languages, every
 * generated page that carries it). The embed the pages were generated with belonged to the previous location's
 * sub-account, so it is rewritten from lib/integrations.json reviewsWidget:
 *   - ids set   → the client's embed (overrides/widgets/reviews.html): ONE iframe per section copy, class lc_reviews_widget,
 *                 lazy, title "Customer reviews" / "Reseñas de clientes"; its helper review-widget.js is loaded ONCE per page
 *                 through <ReviewWidgetScript /> (components/GhlScripts.tsx, lazyOnload), added to the route's page.tsx;
 *   - ids empty → a "Leave us a Google review" call to action (button hidden until ROCKWALL.gbpUrl exists), and the "Google
 *                 Verified Reviews" badge image's alt text is emptied (no reviews to verify yet).
 * The Recent Reviews card (scripts/recent-reviews.mjs) sits above the widget. Markup AND Nuxt payload, so hydration keeps
 * it. No Review / AggregateRating schema anywhere.
 *   node scripts/reviews-cta.mjs [--check]        — idempotent: the block sits between markers and is replaced on every run
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROCKWALL } from './relocate.mjs';
import { ensureComponent, removeComponent } from './page-patch.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const BS = String.fromCharCode(92);
const escapeJsonForScript = (json) => json.split('<').join(BS + 'u003C').split(String.fromCharCode(0x2028)).join(BS + 'u2028').split(String.fromCharCode(0x2029)).join(BS + 'u2029');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const INTEGRATIONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib/integrations.json'), 'utf8'));
const IDS = { locationId: String(INTEGRATIONS.reviewsWidget?.locationId || '').trim(), widgetId: String(INTEGRATIONS.reviewsWidget?.widgetId || '').trim() };
const WIDGET_MODE = Boolean(IDS.locationId && IDS.widgetId);
const TEMPLATE = fs.readFileSync(path.join(ROOT, 'overrides/widgets/reviews.html'), 'utf8').trim();
const TITLES = { en: 'Customer reviews', es: 'Reseñas de clientes' };

const START = '<!--snz-review-cta-->', END = '<!--/snz-review-cta-->';
// the embed as generated: an optional loader script (double-quoted attributes in the page markup, single-quoted in the payload) and the iframe
const WIDGET = /(?:<script type=["']text\/javascript["'] src=["']https:\/\/reputationhub\.site\/reputation\/assets\/review-widget\.js["'](?: async=["']["'])?><\/script>\s*)?<iframe[^>]*\blc_reviews_widget\b[^>]*>\s*<\/iframe>/g;
const COPY = {
  en: { text: 'Visited the store? Share your experience on Google.', button: 'Leave us a Google review' },
  es: { text: '¿Ya nos visitaste? Comparte tu experiencia en Google.', button: 'Déjanos una reseña en Google' },
};
const BADGE_ALTS = ['Google Verified Reviews badge with five stars', 'Insignia de reseñas verificadas de Google con cinco estrellas'];

function block(locale) {
  if (WIDGET_MODE) return START + TEMPLATE.replace(/\{\{locationId\}\}/g, IDS.locationId).replace(/\{\{widgetId\}\}/g, IDS.widgetId).replace(/\{\{title\}\}/g, TITLES[locale] || TITLES.en) + END;
  const c = COPY[locale] || COPY.en;
  const url = ROCKWALL.gbpUrl;
  const button = url
    ? `<a class="snz-review-cta__btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(c.button)}</a>`
    : `<a class="snz-review-cta__btn" hidden>${esc(c.button)}</a>`;
  return `${START}<div class="snz-review-cta"><p class="snz-review-cta__text">${esc(c.text)}</p>${button}</div>${END}`;
}
// the embed's own loader tag, wherever it sits and however its attributes are ordered (the page markup normalises them,
// the payload keeps the client's order): review-widget.js is loaded once per page by <ReviewWidgetScript /> instead
const LOADER = /<script[^>]*review-widget\.js[^>]*>\s*<\/script>\s*/g;
// a Recent Reviews card (scripts/recent-reviews.mjs) found inside the marker block is kept and moved in front of it
const CARD = /<!--snz-recent-reviews-->[\s\S]*?<!--\/snz-recent-reviews-->/;
function place(html, b) {
  const out = html.includes(START)
    ? html.replace(new RegExp(`${START}[\\s\\S]*?${END}`, 'g'), (block) => { const card = block.match(CARD); return (card ? card[0] : '') + b; })
    : html.replace(WIDGET, () => b);
  return out.replace(LOADER, '');
}
function badge(html) {
  if (WIDGET_MODE) return html; // the client's badge stays as generated when real reviews show
  let out = html;
  for (const alt of BADGE_ALTS) out = out.split(`alt="${alt}"`).join('alt=""').split(`alt='${alt}'`).join("alt=''");
  return out;
}

const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name === 'content.ts') files.push(p); } })(path.join(ROOT, 'app'));
let changed = 0, placed = 0, badges = 0, pages = 0;
for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/'); const locale = /^app\/es\//.test(rel) ? 'es' : 'en';
  const src = fs.readFileSync(f, 'utf8'); if (!/lc_reviews_widget|snz-review-cta|Google Verified Reviews badge|Insignia de reseñas verificadas/.test(src)) continue;
  const bodyM = src.match(/export const BODY_HTML = ("[\s\S]*");\s*$/); if (!bodyM) continue;
  let body = JSON.parse(bodyM[1]);
  const before = body;
  const b = block(locale);
  const pm = body.match(/(<script[^>]*id="__NUXT_DATA__"[^>]*>)([\s\S]*?)(<\/script>)/);
  const markup = pm ? body.replace(pm[0], '\u0000PAYLOAD\u0000') : body;
  const newMarkup = badge(place(markup, b));
  let newPayload = pm ? pm[0] : '';
  if (pm) {
    const nodes = JSON.parse(pm[2]); let touched = false;
    for (let i = 0; i < nodes.length; i++) {
      if (typeof nodes[i] !== 'string') continue;
      if (/lc_reviews_widget|snz-review-cta/.test(nodes[i])) { const v = badge(place(nodes[i], b)); if (v !== nodes[i]) { nodes[i] = v; touched = true; } }
      else if (!WIDGET_MODE && BADGE_ALTS.includes(nodes[i])) { nodes[i] = ''; touched = true; badges++; }
    }
    if (touched) newPayload = pm[1] + escapeJsonForScript(JSON.stringify(nodes)) + pm[3];
  }
  body = pm ? newMarkup.replace('\u0000PAYLOAD\u0000', () => newPayload) : newMarkup;
  const n = newMarkup.split(START).length - 1; placed += n;
  if (body !== before) { changed++; if (!CHECK) fs.writeFileSync(f, src.replace(bodyM[1], () => JSON.stringify(body))); console.log(`${rel}: ${n} ${WIDGET_MODE ? 'widget(s)' : 'CTA block(s)'}`); }
  // the helper script once per page, only where the widget is
  if (!CHECK && n) {
    const pageFile = path.join(path.dirname(f), 'page.tsx');
    const patched = WIDGET_MODE
      ? ensureComponent(pageFile, { name: 'ReviewWidgetScript', from: '@/components/GhlScripts', comment: 'review-widget.js once per page, after the widget iframes (components/GhlScripts.tsx)' })
      : removeComponent(pageFile, { name: 'ReviewWidgetScript', from: '@/components/GhlScripts' });
    if (patched) pages++;
  }
}
console.log(`${changed} pages ${CHECK ? 'would change' : 'changed'}, ${placed} ${WIDGET_MODE ? `widget iframes (${IDS.locationId} / ${IDS.widgetId}); ${pages} page.tsx patched with the helper script` : `CTA blocks, ${badges} badge alt(s) emptied; GBP URL ${ROCKWALL.gbpUrl ? 'set: button shown' : 'empty: button hidden (NEEDS CLIENT INPUT)'}`}`);
