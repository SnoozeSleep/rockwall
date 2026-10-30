/*
 * Reviews section for a new location (Rockwall, October 31, 2026). The LeadConnector reviews widget belonged to the
 * previous location's sub-account and this store has no reviews of its own yet, so inside the "Some of Our Happy Customers"
 * section (desktop + phone copies, both languages, every generated page that carries the widget) the widget embed —
 * its loader script and iframe — is replaced by a "Leave us a Google review" call to action. The button is rendered
 * with the store's Google Business Profile URL (scripts/relocate.mjs ROCKWALL.gbpUrl; lib/location.ts gbpUrl carries
 * the same value) and is `hidden` while that URL is still empty ([ROCKWALL_PLACE_ID] NEEDS CLIENT INPUT). The "Google
 * Verified Reviews" badge image in the same section is a claim about reviews the store does not have: its alt text
 * becomes empty (decorative) and overrides/global.css hides it. Markup AND Nuxt payload, so hydration keeps the block.
 *
 *   node scripts/reviews-cta.mjs           — after scripts/recent-reviews.mjs
 *   node scripts/reviews-cta.mjs --check   — report only
 * Idempotent: the block sits between <!--snz-review-cta--> … <!--/snz-review-cta--> markers and is replaced on every run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROCKWALL } from './relocate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const BS = String.fromCharCode(92);
const escapeJsonForScript = (json) => json.split('<').join(BS + 'u003C').split(String.fromCharCode(0x2028)).join(BS + 'u2028').split(String.fromCharCode(0x2029)).join(BS + 'u2029');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const START = '<!--snz-review-cta-->', END = '<!--/snz-review-cta-->';
// the widget embed: its loader script (double-quoted attributes in the page markup, single-quoted in the payload) followed by the iframe
const WIDGET = /(?:<script type=["']text\/javascript["'] src=["']https:\/\/reputationhub\.site\/reputation\/assets\/review-widget\.js["'](?: async=["']["'])?><\/script>\s*)?<iframe[^>]*\blc_reviews_widget\b[^>]*>\s*<\/iframe>/g;
const COPY = {
  en: { text: 'Visited the store? Share your experience on Google.', button: 'Leave us a Google review' },
  es: { text: '¿Ya nos visitaste? Comparte tu experiencia en Google.', button: 'Déjanos una reseña en Google' },
};
/* the badge's alt text (overrides.json imageAlt + es.extra.json) in the markup and as a payload string */
const BADGE_ALTS = ['Google Verified Reviews badge with five stars', 'Insignia de reseñas verificadas de Google con cinco estrellas'];

/* [ROCKWALL_REVIEWS_WIDGET] (lib/integrations.json): once the Rockwall reviews widget ids are supplied, the client's embed
   (overrides/widgets/reviews.html) takes the call to action's place, between the same markers */
const INTEGRATIONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib/integrations.json'), 'utf8'));
const REVIEWS_IDS = { locationId: String(INTEGRATIONS.reviewsWidget?.locationId || '').trim(), widgetId: String(INTEGRATIONS.reviewsWidget?.widgetId || '').trim() };
const REVIEWS_TEMPLATE = fs.readFileSync(path.join(ROOT, 'overrides/widgets/reviews.html'), 'utf8').trim();

function block(locale) {
  if (REVIEWS_IDS.locationId && REVIEWS_IDS.widgetId) return START + REVIEWS_TEMPLATE.replace(/\{\{locationId\}\}/g, REVIEWS_IDS.locationId).replace(/\{\{widgetId\}\}/g, REVIEWS_IDS.widgetId) + END;
  const c = COPY[locale] || COPY.en;
  const url = ROCKWALL.gbpUrl;
  const button = url
    ? `<a class="snz-review-cta__btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(c.button)}</a>`
    : `<a class="snz-review-cta__btn" hidden>${esc(c.button)}</a>`;
  return `${START}<div class="snz-review-cta"><p class="snz-review-cta__text">${esc(c.text)}</p>${button}</div>${END}`;
}
function place(html, b) {
  if (html.includes(START)) return html.replace(new RegExp(`${START}[\\s\\S]*?${END}`, 'g'), () => b);
  return html.replace(WIDGET, () => b);
}
function neutralizeBadge(html) {
  let out = html;
  for (const alt of BADGE_ALTS) out = out.split(`alt="${alt}"`).join('alt=""').split(`alt='${alt}'`).join("alt=''");
  return out;
}

const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name === 'content.ts') files.push(p); } })(path.join(ROOT, 'app'));
let changed = 0, placed = 0, badges = 0;
for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/'); const locale = /^app\/es\//.test(rel) ? 'es' : 'en';
  const src = fs.readFileSync(f, 'utf8'); if (!/lc_reviews_widget|snz-review-cta|Google Verified Reviews badge|Insignia de reseñas verificadas/.test(src)) continue;
  const bodyM = src.match(/export const BODY_HTML = ("[\s\S]*");\s*$/); if (!bodyM) continue;
  let body = JSON.parse(bodyM[1]);
  const before = body;
  const b = block(locale);
  const pm = body.match(/(<script[^>]*id="__NUXT_DATA__"[^>]*>)([\s\S]*?)(<\/script>)/);
  const markup = pm ? body.replace(pm[0], '\u0000PAYLOAD\u0000') : body;
  const newMarkup = neutralizeBadge(place(markup, b));
  let newPayload = pm ? pm[0] : '';
  if (pm) {
    const nodes = JSON.parse(pm[2]); let touched = false;
    for (let i = 0; i < nodes.length; i++) {
      if (typeof nodes[i] !== 'string') continue;
      if (/lc_reviews_widget|snz-review-cta/.test(nodes[i])) { const v = neutralizeBadge(place(nodes[i], b)); if (v !== nodes[i]) { nodes[i] = v; touched = true; } }
      else if (BADGE_ALTS.includes(nodes[i])) { nodes[i] = ''; touched = true; badges++; }
    }
    if (touched) newPayload = pm[1] + escapeJsonForScript(JSON.stringify(nodes)) + pm[3];
  }
  body = pm ? newMarkup.replace('\u0000PAYLOAD\u0000', () => newPayload) : newMarkup;
  const n = newMarkup.split(START).length - 1; placed += n;
  if (body !== before) { changed++; if (!CHECK) fs.writeFileSync(f, src.replace(bodyM[1], () => JSON.stringify(body))); console.log(`${rel}: ${n} block(s)`); }
}
console.log(`${changed} pages ${CHECK ? 'would change' : 'changed'}, ${placed} CTA blocks, ${badges} badge alt(s) emptied; GBP URL ${ROCKWALL.gbpUrl ? 'set: button shown' : 'empty: button hidden (NEEDS CLIENT INPUT)'}`);
