/*
 * Lighthouse (mobile) on the static export, served locally: performance / accessibility / best-practices / SEO scores and
 * the LCP, CLS and TBT figures for the pages the brief names (client brief, November 2026, D.k).
 *   npm run build && node scripts/lighthouse.mjs [/ /mattresses /booking]
 * Needs a Chromium-based browser (Edge or Chrome; BROWSER_PATH to override) and downloads the lighthouse CLI through npx.
 * Results: verify-out/lighthouse/<route>.json and a table on stdout.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');
const DEST = path.join(ROOT, 'verify-out', 'lighthouse');
fs.mkdirSync(DEST, { recursive: true });
const BROWSER = process.env.BROWSER_PATH || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.xml': 'application/xml' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = [url, `${url}.html`, path.posix.join(url, 'index.html')].map((p) => path.join(OUT, p)).find((p) => fs.existsSync(p) && fs.statSync(p).isFile()) || path.join(OUT, '404.html');
  res.writeHead(file.endsWith('404.html') ? 404 : 200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'public, max-age=31536000' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const routes = process.argv.slice(2).filter((a) => a.startsWith('/'));
const list = routes.length ? routes : ['/', '/mattresses', '/booking'];
const rows = [];
for (const route of list) {
  const name = route === '/' ? 'home' : route.slice(1).replace(/\//g, '_');
  const json = path.join(DEST, `${name}.json`);
  // one quoted command line: npx is a .cmd on Windows (needs a shell) and the chrome flags carry spaces
  const cmd = ['npx -y lighthouse@12', JSON.stringify(BASE + route), '--quiet', '--form-factor=mobile', '--screenEmulation.mobile', '--screenEmulation.width=412', '--screenEmulation.height=823', '--screenEmulation.deviceScaleFactor=1.75', '--throttling-method=simulate', '--only-categories=performance,accessibility,best-practices,seo', '--output=json', `--output-path=${JSON.stringify(json)}`, '--chrome-flags="--headless=new --no-first-run --disable-gpu"'].join(' ');
  const r = spawnSync(cmd, { env: { ...process.env, CHROME_PATH: BROWSER }, encoding: 'utf8', shell: true, timeout: 300000 });
  if (!fs.existsSync(json)) { console.log(`${route}: lighthouse failed\n${(r.stderr || r.stdout || '').slice(-600)}`); continue; }
  const lh = JSON.parse(fs.readFileSync(json, 'utf8'));
  const c = lh.categories, a = lh.audits;
  const pct = (k) => Math.round((c[k]?.score ?? 0) * 100);
  rows.push({ route, perf: pct('performance'), a11y: pct('accessibility'), bp: pct('best-practices'), seo: pct('seo'), lcp: a['largest-contentful-paint']?.displayValue, cls: a['cumulative-layout-shift']?.displayValue, tbt: a['total-blocking-time']?.displayValue, fcp: a['first-contentful-paint']?.displayValue, lcpEl: (a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.snippet || '').slice(0, 90) });
}
server.close();
console.log('\nroute            perf  a11y  best  seo   LCP      FCP      CLS     TBT');
for (const r of rows) console.log(`${r.route.padEnd(16)} ${String(r.perf).padEnd(5)} ${String(r.a11y).padEnd(5)} ${String(r.bp).padEnd(5)} ${String(r.seo).padEnd(5)} ${String(r.lcp).padEnd(8)} ${String(r.fcp).padEnd(8)} ${String(r.cls).padEnd(7)} ${r.tbt}\n                 LCP element: ${r.lcpEl}`);
fs.writeFileSync(path.join(DEST, 'summary.json'), JSON.stringify(rows, null, 2));
