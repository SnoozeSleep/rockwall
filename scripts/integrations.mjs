/*
 * Contact form embeds inside the generated GoHighLevel pages. The LeadConnector opt-in form the builder placed on nine
 * pages (the contact page and the "get in touch" sections) belonged to the previous location's sub-account, so its embed is
 * rewritten from lib/integrations.json formId:
 *   - formId set   → the client's embed (overrides/widgets/form.html: every data-* attribute as supplied, title "Contact
 *                    form" / "Formulario de contacto", no height of its own — overrides/global.css reserves 744px until
 *                    form_embed.js sizes it); form_embed.js is loaded ONCE per page through <FormEmbedScript />
 *                    (components/GhlScripts.tsx), added to the route's page.tsx, even where the desktop and phone copies
 *                    both carry the form;
 *   - formId empty → a card with the store's phone number and e-mail where the form goes, and no request to the CRM.
 * Any other reference to an old form id (the form's field CSS ids in the page styles, the runtime's payload keys) becomes
 * the new id, or the literal placeholder ROCKWALL_FORM_ID while there is none. Markup AND Nuxt payload.
 *
 *   node scripts/integrations.mjs           — after changing lib/integrations.json formId (then `npm run build`)
 *   node scripts/integrations.mjs --check   — report only
 * Idempotent: the pending card sits between <!--snz-form-pending--> … <!--/snz-form-pending--> markers; an embed is
 * recognised by its iframe, so the script converts in both directions on every run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROCKWALL } from './relocate.mjs';
import { ensureComponent, removeComponent } from './page-patch.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib/integrations.json'), 'utf8'));
const FORM_ID = String(CONFIG.formId || '').trim();
const TEMPLATE = fs.readFileSync(path.join(ROOT, 'overrides/widgets/form.html'), 'utf8').trim();
const OLD_FORM_IDS = ['0BTnYKylVR6OcWJug3r8', '0BTnYKylVR6OcWJug3r8']; // the previous locations' forms (Rockwall, and the Rockwall clone it came from)
const PLACEHOLDER = 'ROCKWALL_FORM_ID';
const TITLES = { en: 'Contact form', es: 'Formulario de contacto' };
const BS = String.fromCharCode(92);
const escapeJsonForScript = (json) => json.split('<').join(BS + 'u003C').split(String.fromCharCode(0x2028)).join(BS + 'u2028').split(String.fromCharCode(0x2029)).join(BS + 'u2029');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const START = '<!--snz-form-pending-->', END = '<!--/snz-form-pending-->';
// the embed: the iframe (double-quoted attributes in the markup; the payload copy keeps the same quoting) and, as generated, a loader script after it
const EMBED = /<iframe[^>]*\bsrc=["']https:\/\/link\.snoozesleep\.com\/widget\/form\/[A-Za-z0-9_-]*["'][^>]*>\s*<\/iframe>\s*(?:<script src=["']https:\/\/link\.snoozesleep\.com\/js\/form_embed\.js["'](?: async=["']["'])?><\/script>\s*)?/g;
const COPY = {
  en: { text: 'Our contact form is on its way. In the meantime, call or email us:' },
  es: { text: 'Nuestro formulario de contacto está en camino. Mientras tanto, llámanos o escríbenos:' },
};

function embed(locale) {
  return TEMPLATE.replace(/\{\{formId\}\}/g, FORM_ID).replace(/\{\{formName\}\}/g, 'Optin').replace(/\{\{title\}\}/g, TITLES[locale] || TITLES.en) + '\n';
}
function pending(locale) {
  const c = COPY[locale] || COPY.en;
  return `${START}<div class="snz-form-pending"><p class="snz-form-pending__text">${esc(c.text)}</p><p class="snz-form-pending__links"><a href="tel:+1${ROCKWALL.phoneDigits}">${esc(ROCKWALL.phone)}</a><span aria-hidden="true"> · </span><a href="mailto:${esc(ROCKWALL.email)}">${esc(ROCKWALL.email)}</a></p></div>${END}`;
}
// the embed's own loader tag, wherever it sits and however its attributes are ordered: form_embed.js is loaded once per
// page by <FormEmbedScript /> instead
const LOADER = /<script[^>]*form_embed\.js[^>]*>\s*<\/script>\s*/g;
function place(html, locale) {
  const block = FORM_ID ? embed(locale) : pending(locale);
  let out = html;
  if (out.includes(START)) out = out.replace(new RegExp(`${START}[\\s\\S]*?${END}\\n?`, 'g'), () => block);
  out = out.replace(EMBED, () => block).replace(LOADER, '');
  for (const id of OLD_FORM_IDS) out = out.split(id).join(FORM_ID || PLACEHOLDER);
  if (FORM_ID) out = out.split(PLACEHOLDER).join(FORM_ID);
  return out;
}

const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name === 'content.ts') files.push(p); } })(path.join(ROOT, 'app'));
let changed = 0, embeds = 0, cards = 0, pages = 0;
for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/'); const locale = /^app\/es\//.test(rel) ? 'es' : 'en';
  const src = fs.readFileSync(f, 'utf8');
  if (!/widget\/form\/|snz-form-pending|ROCKWALL_FORM_ID|0BTnYKylVR6OcWJug3r8|0BTnYKylVR6OcWJug3r8/.test(src)) continue;
  const bodyM = src.match(/export const BODY_HTML = ("[\s\S]*");\s*$/); if (!bodyM) continue;
  let body = JSON.parse(bodyM[1]); const before = body;
  const pm = body.match(/(<script[^>]*id="__NUXT_DATA__"[^>]*>)([\s\S]*?)(<\/script>)/);
  const markup = pm ? body.replace(pm[0], '\u0000PAYLOAD\u0000') : body;
  const newMarkup = place(markup, locale);
  let newPayload = pm ? pm[0] : '';
  if (pm) {
    const nodes = JSON.parse(pm[2]); let touched = false;
    for (let i = 0; i < nodes.length; i++) if (typeof nodes[i] === 'string' && /widget\/form\/|snz-form-pending|ROCKWALL_FORM_ID|0BTnYKylVR6OcWJug3r8|0BTnYKylVR6OcWJug3r8/.test(nodes[i])) { const v = place(nodes[i], locale); if (v !== nodes[i]) { nodes[i] = v; touched = true; } }
    if (touched) newPayload = pm[1] + escapeJsonForScript(JSON.stringify(nodes)) + pm[3];
  }
  body = pm ? newMarkup.replace('\u0000PAYLOAD\u0000', () => newPayload) : newMarkup;
  const e = newMarkup.split('widget/form/').length - 1, c = newMarkup.split(START).length - 1; embeds += e; cards += c;
  // the whole module, HEAD_HTML included: the form's field CSS ids (#el_<formId>_first_name_0 …) in the page styles and the
  // runtime's payload keys ("$sschedule-gate:<formId>") carry the id outside any payload string
  let next = body !== before ? src.replace(bodyM[1], () => JSON.stringify(body)) : src;
  for (const id of OLD_FORM_IDS) next = next.split(id).join(FORM_ID || PLACEHOLDER);
  if (FORM_ID) next = next.split(PLACEHOLDER).join(FORM_ID);
  if (next !== src) { changed++; if (!CHECK) fs.writeFileSync(f, next); console.log(`${rel}: ${FORM_ID ? `${e} form embed(s)` : `${c} pending card(s)`}`); }
  // form_embed.js once per page, on every page that carries the form (in the markup or, where the builder renders the
  // element after hydration, in the payload only)
  if (!CHECK) {
    const pageFile = path.join(path.dirname(f), 'page.tsx');
    const patched = FORM_ID
      ? ensureComponent(pageFile, { name: 'FormEmbedScript', from: '@/components/GhlScripts', comment: 'form_embed.js once per page, after the form iframes (components/GhlScripts.tsx)' })
      : removeComponent(pageFile, { name: 'FormEmbedScript', from: '@/components/GhlScripts' });
    if (patched) pages++;
  }
}
console.log(`${changed} pages ${CHECK ? 'would change' : 'changed'}; formId ${FORM_ID ? `"${FORM_ID}": ${embeds} embeds; ${pages} page.tsx patched with the helper script` : `empty: ${cards} pending cards (NEEDS CLIENT INPUT: lib/integrations.json formId)`}`);
