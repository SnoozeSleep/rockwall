/*
 * Host redirects in vercel.json (client brief, November 2026: the *.vercel.app host was broken because the old
 * `"source": "/:path*"` host rule redirected every asset — CSS chunks, fonts, images, favicon, robots.txt — to the custom
 * domain while that domain was not attached yet).
 *
 * This site is a static export (next.config.ts `output: 'export'`): there is no middleware and no request-time environment,
 * and Vercel reads vercel.json from the repository before the build runs, so the redirect cannot be switched on by an
 * environment variable at request time. It is switched on by generating the file and committing it:
 *
 *   node scripts/vercel-config.mjs                 -> no host redirect: the deployment serves every host it is reached on
 *   NEXT_PUBLIC_SITE_URL=https://rockwall.snoozemattresscompany.com node scripts/vercel-config.mjs
 *                                                  -> page requests on *.vercel.app and on www.<host> 308 to that origin
 *   node scripts/vercel-config.mjs --check         -> exit 1 when vercel.json disagrees with NEXT_PUBLIC_SITE_URL
 *
 * Only PAGE requests redirect. The matcher excludes /_next/*, /api/*, /assets/*, /images/*, /fonts/*, /ghl-stub/*,
 * favicon*, robots.txt, sitemap*.xml and any path with a file extension, so assets are always served from the host that
 * was asked for. http -> https is Vercel's own behaviour on every domain. Everything else in vercel.json (slug redirects,
 * rewrites, cache headers) is left exactly as it is. Set NEXT_PUBLIC_SITE_URL in the Vercel project (so canonicals, sitemap,
 * robots and JSON-LD use the domain: lib/site-url.ts) at the same time as you commit the generated file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'vercel.json');
const CHECK = process.argv.includes('--check');

/** Page paths only: everything the browser fetches as a sub-resource is excluded, as is any path with a file extension. */
export const PAGE_PATHS = '/:path((?!_next/|api/|assets/|images/|fonts/|ghl-stub/|favicon|robots[.]txt|sitemap|.*[.][A-Za-z0-9]{1,8}$).*)';

export function siteFromEnv() {
  const v = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (!v) return null;
  let u;
  try { u = new URL(v); } catch { throw new Error(`NEXT_PUBLIC_SITE_URL is not a URL: ${v}`); }
  if (u.protocol !== 'https:' || u.pathname !== '/' || u.search || u.hash) throw new Error(`NEXT_PUBLIC_SITE_URL must be a bare https origin, got ${v}`);
  if (/\.vercel\.app$/.test(u.host) || /^www\./.test(u.host)) throw new Error(`NEXT_PUBLIC_SITE_URL must be the custom (non-www) domain, got ${u.host}`);
  return { origin: `https://${u.host}`, host: u.host };
}

/** The host rules for a site origin: *.vercel.app -> site, www.<host> -> site; page paths only. */
export function hostRules(site) {
  if (!site) return [];
  const escaped = site.host.replace(/\./g, '[.]');
  return [
    { source: PAGE_PATHS, has: [{ type: 'host', value: '(?<host>.*)[.]vercel[.]app' }], destination: `${site.origin}/:path`, permanent: true },
    { source: PAGE_PATHS, has: [{ type: 'host', value: `www[.]${escaped}` }], destination: `${site.origin}/:path`, permanent: true },
  ];
}

const isHostRule = (r) => Array.isArray(r.has) && r.has.some((h) => h && h.type === 'host');
const oneLine = (o) => JSON.stringify(o, null, 1).replace(/\n\s*/g, ' ');

/** vercel.json text in the repository's style: one redirect / rewrite per line, headers expanded. */
function render(config) {
  const out = ['{'];
  const keys = Object.keys(config);
  keys.forEach((k, i) => {
    const comma = i < keys.length - 1 ? ',' : '';
    const v = config[k];
    if (k === 'redirects' || k === 'rewrites') {
      out.push(`  "${k}": [`);
      v.forEach((r, j) => out.push(`    ${oneLine(r)}${j < v.length - 1 ? ',' : ''}`));
      out.push(`  ]${comma}`);
    } else if (k === 'headers') {
      out.push(`  "${k}": [`);
      v.forEach((h, j) => {
        out.push('    {');
        out.push(`      "source": ${JSON.stringify(h.source)},`);
        if (h.has) out.push(`      "has": ${oneLine(h.has)},`);
        out.push(`      "headers": ${oneLine(h.headers)}`);
        out.push(`    }${j < v.length - 1 ? ',' : ''}`);
      });
      out.push(`  ]${comma}`);
    } else {
      out.push(`  "${k}": ${JSON.stringify(v)}${comma}`);
    }
  });
  out.push('}');
  return out.join('\n') + '\n';
}

const site = siteFromEnv();
const config = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const current = (config.redirects || []).filter(isHostRule);
const wanted = hostRules(site);
const same = JSON.stringify(current) === JSON.stringify(wanted);

if (CHECK) {
  if (same) { console.log(`vercel.json host redirects: ${wanted.length ? `page requests on *.vercel.app and www. -> ${site.origin}` : 'none (no NEXT_PUBLIC_SITE_URL)'} — in sync`); process.exit(0); }
  console.error(`vercel.json host redirects are out of sync with NEXT_PUBLIC_SITE_URL (${site ? site.origin : 'unset'}): run \`node scripts/vercel-config.mjs\` and commit vercel.json`);
  console.error(`  in vercel.json: ${current.length ? current.map((r) => `${r.has[0].value} -> ${r.destination}`).join('; ') : 'no host rule'}`);
  process.exit(1);
}

config.redirects = [...wanted, ...(config.redirects || []).filter((r) => !isHostRule(r))];
const text = render(config);
if (fs.readFileSync(FILE, 'utf8') !== text) { fs.writeFileSync(FILE, text); console.log(`vercel.json written: ${wanted.length ? `host redirects -> ${site.origin} (page paths only)` : 'no host redirect'}`); }
else console.log('vercel.json unchanged');
// prove the matcher on the paths that matter whenever host rules are present
if (wanted.length) {
  const re = new RegExp('^(?:/((?!_next/|api/|assets/|images/|fonts/|ghl-stub/|favicon|robots[.]txt|sitemap|.*[.][A-Za-z0-9]{1,8}$).*))$');
  for (const p of ['/', '/about-us', '/es/booking', '/_next/static/css/a.css', '/assets/gfonts/a.woff2', '/favicon.ico', '/robots.txt', '/sitemap.xml', '/snz-events.js', '/ghl-stub/api/x'])
    console.log(`  ${p.padEnd(28)} ${re.test(p) ? '308 -> ' + site.origin + p : 'served as is'}`);
}
