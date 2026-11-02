#!/usr/bin/env node
/**
 * Location audit for the Rockwall site (October 31, 2026): old-location leftovers (McAllen, Brownsville) and the McAllen
 * integration ids over the source tree and every built route, Rockwall NAP consistency on every built route, and the
 * SEO invariants the clone brief asks for (titles end "| Snooze Mattress" and are ≤60 characters, descriptions ≤155,
 * one <h1> per page, alt text on every image, canonical on the Rockwall domain, en-US / es-US / x-default hreflang,
 * LocalBusiness JSON-LD exactly once, BreadcrumbList on every page but the home and thank-you pages, no about:blank
 * iframe, no link to /optin-page, no "Englander", the reviews call to action where the old widget was).
 *   npm run build && node scripts/audit-location.mjs          # source tree + out/ (the static export)
 *   node scripts/audit-location.mjs --source-only              # before a build
 * Exit code 1 when a leftover or an inconsistency is found. Findings are grouped so the integration ids (replaced in the
 * integrations section of the brief) read apart from the location copy.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');
const SOURCE_ONLY = process.argv.includes('--source-only');

const NEW = {
  street: '919 E Interstate 30, Suite 101',
  cityZip: 'Rockwall, TX 75032',
  phone: '(469) 769-1300',
  tel: 'tel:+14697691300',
  email: 'jadams@snoozemattresscompany.com',
  fb: 'https://www.facebook.com/people/Snooze-Mattress-Wellness-Rockwall-TX/61582495686069/',
  ig: 'https://www.instagram.com/rockwalltxsnooze/',
  mapsQ: '919+E+Interstate+30',
  hoursEn: ['Mon–Sat 10 AM–7 PM', 'Sun 10 AM–6 PM'],
  hoursEs: ['Lun–Sáb 10 AM–7 PM', 'Dom 10 AM–6 PM'],
  domain: 'https://rockwall.snoozemattresscompany.com',
};

/* Leftover patterns; `ok` returns true when the hit is expected in that context. */
const TOOLING = /^scripts\/(relocate|audit-location|integrations|reviews-cta)\.mjs$|^README\.md$|^overrides\/i18n\//; // the mapping and the scripts that rewrite the old ids (they must name them), this audit, the McAllen build history, the translation memory of the clone
const LEFTOVERS = [
  // ---- location copy
  { group: 'location', name: 'McAllen', re: /mcallen/gi, ok: (ctx, file) => TOOLING.test(file) },
  { group: 'location', name: 'old phone (956) 586-5646', re: /956[-. ]?586[-. ]?5646|9565865646/g, ok: (ctx, file) => TOOLING.test(file) },
  { group: 'location', name: 'old address 7913 N 10th St / 78504', re: /7913\s*\+?\s*N(?:orth)?\s*\+?\s*10th|78504/gi, ok: (ctx, file) => TOOLING.test(file) },
  { group: 'location', name: 'old e-mail / socials', re: /northmcallen@|snoozemcallen|SnoozeMcAllen|61575812121380/gi, ok: (ctx, file) => TOOLING.test(file) },
  { group: 'location', name: 'old Google Place ID', re: /ChIJBYBxOXChZYYR48f71GAS7YY/g, ok: (ctx, file) => TOOLING.test(file) },
  { group: 'location', name: 'old domain', re: /mcallen\.snoozemattresscompany\.com/gi, ok: (ctx, file) => TOOLING.test(file) },
  { group: 'location', name: 'Rio Grande Valley / South Texas copy', re: /Rio Grande|Río Grande|the Valley|del Valle|South Texas|sur de Texas|Winter Texan|quincea|Edinburg|Pharr|Harlingen|Monterrey|North 10th|Mission or Pharr|Edinburg, Mission/g, ok: (ctx, file) => TOOLING.test(file) },
  { group: 'location', name: 'McAllen reviewers / staff', re: /Xandria|Karina R\.|\bPablo\b|\bElias\b/g, ok: (ctx, file) => TOOLING.test(file) },
  { group: 'location', name: 'drive-time copy', re: /minute drive|minutos en auto/g, ok: (ctx, file) => TOOLING.test(file) },
  { group: 'content', name: 'claims switched off (10° cooler, 85%) / "Snooze Coaches"', re: /Snooze Coaches|around 85%|85% of mattresses|85% de los colchones|85% de nuestros|10° cooler|10 degrees Cooler|10 grados|10° más fresco|Of Options Eliminated|De Opciones Eliminadas|Sleep up to (?:<|\\\\?u003C)|Duerme hasta (?:<|\\\\?u003C)/g, ok: (ctx, file) => TOOLING.test(file) || /^scripts\//.test(file) },
  { group: 'location', name: 'McAllen storefront / hero composites', re: /684480ff2c95c570cfc22e24|699c969010bc9c1e4d659063|69a601e75a52f4e92a27dcf5|69a1cbdf917b4b217201b5ff/g, ok: (ctx, file) => TOOLING.test(file) || /overrides\/overrides\.json$|conversion-report|asset-map|ghl-offline-shim\.js|lib\/ghl-shim\.ts/.test(file) },
  // ---- Brownsville (the clone the McAllen site was generated from)
  { group: 'location', name: 'Brownsville', re: /brownsville/gi, ok: (ctx, file) => /^scripts\/|^README|^overrides\/i18n\//.test(file) },
  { group: 'location', name: 'Brownsville phone / street / zip', re: /303[-. ]?3666|9563033666|306-3666|3831\s*\+?\s*Frontage|78520/g, ok: (ctx, file) => TOOLING.test(file) || /unsplash\.com\/photo-1597852075012/.test(ctx) },
  // ---- content that must not carry over
  { group: 'content', name: 'Englander', re: /Englander/g, ok: (ctx, file) => /^scripts\/|^README|^overrides\/i18n\//.test(file) },
  { group: 'content', name: 'optin-page (only the redirect rules may name it)', re: /optin-page/g, ok: (ctx, file) => /^vercel\.json$|^scripts\/|^README|^overrides\/i18n\//.test(file) },
  // ---- McAllen integrations (replaced by the Rockwall placeholders in lib/integrations.json)
  { group: 'integrations', name: 'McAllen GoHighLevel location id (outside asset URLs)', re: /ARD47WoZpqaZSQ9MSxLD(?!\/media)/g, ok: (ctx, file) => TOOLING.test(file) || /overrides\/overrides\.json$|conversion-report|asset-map/.test(file) },
  { group: 'integrations', name: 'McAllen chat widgets', re: /6ada7129c5fa6117307c554f|6ada73894325b023027e7371/g, ok: (ctx, file) => TOOLING.test(file) },
  { group: 'integrations', name: 'McAllen quiz webhook', re: /00b3cdec-7a6f-4184-95ec-81210f1e7bc8/g, ok: (ctx, file) => TOOLING.test(file) },
  { group: 'integrations', name: 'McAllen GA4 / Simpli.fi', re: /G-9R1JGVBRBR|G-TS1RXQVPYT|b781856a/g, ok: (ctx, file) => TOOLING.test(file) },
  { group: 'integrations', name: 'McAllen form / calendar / reviews widget ids', re: /0BTnYKylVR6OcWJug3r8|lrAns7Z8j3vEJW3DC0Yr|67f5847f79c4ab793baf0087/g, ok: (ctx, file) => TOOLING.test(file) || /overrides\/overrides\.json$/.test(file) },
  { group: 'integrations', name: 'tel: not E.164', re: /(?<![a-z-])tel:(?!\+14697691300)[^"'\\\s<>]+/g, ok: (ctx, file) => /^scripts\/|^README|^public\//.test(file) || /tel:\/mailto:|tel:\$\{/.test(ctx) }, // public/: the quiz and events scripts build or test tel: links in code
];

const SKIP = new Set(['node_modules', '.next', '.git', 'verify-out', 'public', '.vercel', 'out']);
function walk(dir, out = []) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { if (SKIP.has(e.name)) continue; const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, out); else if (/\.(ts|tsx|mjs|js|json|html|css|md)$/.test(e.name) && !/package-lock|tsbuildinfo|asset-map|conversion-report/.test(e.name)) out.push(p); } return out; }
function walkHtml(dir, out = []) { if (!fs.existsSync(dir)) return out; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walkHtml(p, out); else if (e.name.endsWith('.html')) out.push(p); } return out; }
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

let problems = 0; const byGroup = {};
const DICT = /overrides\/i18n\/es(\.part-\d+|\.extra)\.json$/;
function scan(files, label) {
  console.log(`\n=== ${label}: ${files.length} file(s) ===`);
  const found = {};
  for (const f of files) {
    const r = rel(f);
    const s = DICT.test(r) ? Object.values(JSON.parse(fs.readFileSync(f, 'utf8'))).join('\n') : fs.readFileSync(f, 'utf8');
    for (const L of LEFTOVERS) {
      const re = new RegExp(L.re.source, L.re.flags); let m;
      while ((m = re.exec(s))) { const ctx = s.slice(Math.max(0, m.index - 70), m.index + m[0].length + 70).replace(/\s+/g, ' '); if (L.ok(ctx, r)) continue; (found[L.name] ??= { group: L.group, hits: [] }).hits.push(`${r}: …${ctx}…`); }
    }
  }
  for (const [name, { group, hits }] of Object.entries(found)) { problems += hits.length; byGroup[group] = (byGroup[group] || 0) + hits.length; console.log(`  ✗ [${group}] ${name}: ${hits.length} hit(s)`); for (const h of hits.slice(0, 4)) console.log(`      ${h.slice(0, 220)}`); if (hits.length > 4) console.log(`      … ${hits.length - 4} more`); }
  if (!Object.keys(found).length) console.log('  ✓ no unintended leftovers');
}

// ---- hand-written page metadata lengths (the generated pages are checked by scripts/seo-metadata.mjs and, built, below)
function sourceMeta() {
  console.log('\n=== hand-written titles (≤60, "| Snooze Mattress") and descriptions (≤155) ===');
  let bad = 0;
  const check = (where, kind, v) => { if (v.includes('${')) return; const lim = kind === 'title' ? 60 : 155; const end = kind === 'title' && !/\| Snooze Mattress$/.test(v); if (v.length > lim || end) { bad++; console.log(`  ✗ ${where} ${kind} (${v.length})${end ? ' does not end "| Snooze Mattress"' : ''}: ${v}`); } };
  for (const f of fs.readdirSync(path.join(ROOT, 'lib/pages')).filter((f) => f.endsWith('.ts') && f !== 'types.ts')) {
    const s = fs.readFileSync(path.join(ROOT, 'lib/pages', f), 'utf8');
    for (const m of s.matchAll(/^\s+(title|description): ('(?:[^'\\]|\\.)*'|`[^`]*`),?$/gm)) check(`lib/pages/${f}`, m[1], m[2].slice(1, -1).replace(/\\'/g, "'"));
  }
  const i18n = fs.readFileSync(path.join(ROOT, 'lib/i18n.ts'), 'utf8');
  for (const m of i18n.matchAll(/(indexMetaTitle|indexMetaDesc): '((?:[^'\\]|\\.)*)'/g)) check('lib/i18n.ts blog', m[1].includes('Title') ? 'title' : 'description', m[2]);
  const quiz = fs.readFileSync(path.join(ROOT, 'components/SleepQuiz.tsx'), 'utf8');
  for (const m of quiz.matchAll(/^\s+(title|description): '((?:[^'\\]|\\.)*)',$/gm)) check('components/SleepQuiz.tsx', m[1], m[2]);
  if (!bad) console.log('  ✓ all within limits'); problems += bad;
}

scan(walk(ROOT).concat([path.join(ROOT, 'public', 'sleep-fit-quiz.js'), path.join(ROOT, 'public', 'snz-events.js'), path.join(ROOT, 'public', 'ghl-offline-shim.js'), path.join(ROOT, 'public', 'ghl-stub.html')].filter(fs.existsSync)), 'source tree');
sourceMeta();

if (!SOURCE_ONLY) {
  const html = walkHtml(OUT).filter((f) => !/\/404\.html$|\/ghl-stub\.html$|\/ghl-stub\//.test(rel(f)));
  scan(html, 'built routes (out/)');

  console.log('\n=== Rockwall data and SEO invariants per built route ===');
  const count = (s, needle) => s.split(needle).length - 1;
  const rows = []; let bad = 0;
  for (const f of html) {
    const s = fs.readFileSync(f, 'utf8'); const r = rel(f).replace(/^out\//, '/').replace(/\.html$/, '').replace(/^\/index$/, '/');
    const es = r === '/es' || r.startsWith('/es/');
    const thanks = /\/thank\/you$/.test(r);
    const ld = [...s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } });
    const flat = ld.flatMap((d) => (d && d['@graph'] ? d['@graph'] : [d])).filter(Boolean);
    const stores = flat.filter((d) => Array.isArray(d['@type']) && d['@type'].includes('LocalBusiness'));
    const store = stores[0];
    const ldOk = stores.length === 1 && store.address?.streetAddress === NEW.street && store.address?.addressLocality === 'Rockwall' && store.address?.postalCode === '75032' && /^\+1 \(?469\)? ?769-1300$/.test(store.telephone || '') && store.email === NEW.email && Array.isArray(store.sameAs) && store.sameAs.includes(NEW.fb) && store.sameAs.includes(NEW.ig) && Array.isArray(store.openingHoursSpecification) && store.openingHoursSpecification.length === 2 && store.openingHoursSpecification[1].opens === '10:00' && String(store['@id']).startsWith(NEW.domain) && !('aggregateRating' in store) && !('review' in store);
    const types = new Set(flat.map((d) => (Array.isArray(d['@type']) ? d['@type'].join('+') : d['@type'])));
    const decode = (t) => t.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const title = decode((s.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
    const desc = decode((s.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
    // the Sleep Fit Quiz draws its screens (and its <h1>) with its own script, so the served HTML has no heading by design
    const h1 = /\/sleep-quiz$/.test(r) ? 1 : count(s, '<h1');
    const imgs = [...s.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
    const noAlt = imgs.filter((t) => /\bsrc=/.test(t) && !/\balt=/.test(t)).length; // an <img> without src is a template placeholder, not an image
    const hreflang = ['en-US', 'es-US', 'x-default'].every((l) => new RegExp(`hreflang="${l}"`, 'i').test(s)); // Next writes the attribute as hrefLang
    const row = {
      route: r, address: count(s, NEW.street), cityZip: count(s, NEW.cityZip), phone: count(s, NEW.phone), tel: count(s, NEW.tel), fb: count(s, NEW.fb), ig: count(s, `href="${NEW.ig}"`),
      hours: (es ? NEW.hoursEs : NEW.hoursEn).every((h) => s.includes(h)), maps: count(s, NEW.mapsQ), jsonld: ldOk, breadcrumb: types.has('BreadcrumbList'),
      canonical: (s.match(/rel="canonical" href="([^"]+)"/) || [])[1] || '', title, titleLen: title.length, descLen: desc.length, h1, noAlt, hreflang,
      aboutBlank: /src="about:blank"/.test(s), optin: /href="[^"]*\/optin-page/.test(s), reviewsCta: count(s, 'snz-review-cta__btn') + count(s, 'lc_reviews_widget'),
      // parse-time script tags only: the hydration payload and the React flight data quote the same URLs inside JSON strings (\"…\")
      formEmbedScripts: (s.match(/<script[^>]+src="https:\/\/link\.snoozesleep\.com\/js\/form_embed\.js"/g) || []).length, reviewScripts: (s.match(/<script[^>]+src="https:\/\/reputationhub\.site\/reputation\/assets\/review-widget\.js"/g) || []).length, gtmLoaders: count(s, 'googletagmanager.com/gtm.js'), ga4Loaders: (s.match(/<script[^>]+src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=/g) || []).length,
    };
    rows.push(row);
    const why = [];
    if (!row.address || !row.phone || !row.tel || !row.fb || !row.ig || !row.hours || !row.maps) why.push('missing Rockwall data');
    if (!row.jsonld) why.push(`LocalBusiness JSON-LD (${stores.length} found)`);
    if (!row.canonical.startsWith(NEW.domain)) why.push('canonical ' + row.canonical);
    if (!thanks && (row.titleLen > 60 || !/\| Snooze Mattress$/.test(title))) why.push(`title (${row.titleLen}) "${title}"`);
    if (row.descLen > 155) why.push(`description ${row.descLen}`);
    if (row.h1 !== 1) why.push(`${row.h1} h1`);
    if (row.noAlt) why.push(`${row.noAlt} img without alt`);
    if (!row.hreflang) why.push('hreflang');
    if (!row.breadcrumb && r !== '/' && r !== '/es' && !thanks) why.push('no BreadcrumbList');
    if (row.aboutBlank) why.push('about:blank iframe');
    if (row.optin) why.push('link to /optin-page');
    if (row.formEmbedScripts > 1 || row.reviewScripts > 1 || row.gtmLoaders > 1 || row.ga4Loaders > 1) why.push(`scripts more than once (form_embed ${row.formEmbedScripts}, review-widget ${row.reviewScripts}, gtm ${row.gtmLoaders}, gtag ${row.ga4Loaders})`);
    if (why.length) { bad++; console.log(`  ✗ ${r}: ${why.join('; ')}`); }
  }
  problems += bad;
  console.log(`  routes checked: ${rows.length}; routes with problems: ${bad}; reviews CTA on ${rows.filter((x) => x.reviewsCta).length} route(s)`);
  console.log(`  schema types seen: ${[...new Set(rows.flatMap(() => []))].join('')}` + [...new Set(html.flatMap((f) => { const s = fs.readFileSync(f, 'utf8'); return [...s.matchAll(/"@type":"([A-Za-z]+)"/g)].map((m) => m[1]); }))].sort().join(', '));

  console.log('\n=== EN / ES pairs: the same amount of location data on both sides ===');
  let pairs = 0, mism = 0;
  for (const en of rows.filter((x) => !(x.route === '/es' || x.route.startsWith('/es/')))) {
    const esRoute = en.route === '/' ? '/es' : `/es${en.route}`;
    const e = rows.find((x) => x.route === esRoute); if (!e) continue; pairs++;
    const diff = ['address', 'phone', 'tel', 'maps', 'reviewsCta'].filter((k) => en[k] !== e[k]);
    if (diff.length) { mism++; problems++; console.log(`  ✗ ${en.route} vs ${esRoute}: ${diff.map((k) => `${k} ${en[k]}/${e[k]}`).join(', ')}`); }
  }
  console.log(`  pairs: ${pairs}, mismatches: ${mism}`);

  console.log('\n=== embeds in built routes ===');
  const w = { calendar: /widget\/booking\/([A-Za-z0-9]*)/g, form: /widget\/form\/([A-Za-z0-9]*)/g, reviews: /review_widget\/([A-Za-z0-9]+)\?widgetId=([a-f0-9]+)/g, chat: /data-widget-id["']?[:=]\s*["']([a-f0-9]*)/g, gtm: /googletagmanager\.com\/(?:gtm|ns)[^"']*id=([A-Z0-9-]+)/g, ga4: /gtag\/js\?id=([A-Z0-9-]+)/g };
  for (const [k, re] of Object.entries(w)) { const ids = new Map(); for (const f of html) { const s = fs.readFileSync(f, 'utf8'); for (const m of s.matchAll(re)) { const id = m.slice(1).join('/') || '(empty)'; (ids.get(id) || ids.set(id, new Set()).get(id)).add(1); } } for (const [id, pages] of ids) console.log(`  ${k}: ${id} on ${pages.size ? 'some' : 'no'} route(s)`); if (!ids.size) console.log(`  ${k}: none`); }
}

console.log(`\n${problems ? `PROBLEMS: ${problems} (${Object.entries(byGroup).map(([g, n]) => `${g} ${n}`).join(', ') || 'route checks'})` : 'CLEAN: no leftovers, Rockwall data consistent on every route'}`);
process.exit(problems ? 1 : 0);
