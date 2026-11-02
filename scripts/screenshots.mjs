/*
 * Screenshots of the static export (out/) for the review of a build: desktop (1366×900) and phone (390×844) views of the
 * home, About, booking and contact pages, the desktop "Our Products" dropdown (at the top of the page and with the
 * shrunk sticky header after scrolling) and the open mobile drawer. Serves out/ itself (clean URLs like Vercel), drives
 * a local Edge/Chrome through puppeteer-core, writes PNGs to verify-out/screenshots/.
 *   npm run build && node scripts/screenshots.mjs [--full]      (--full adds full-page captures of the four pages)
 *   BROWSER_PATH=… to point at another Chromium-based browser.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');
const SHOTS = path.join(ROOT, 'verify-out', 'screenshots');
const FULL = process.argv.includes('--full');
const BROWSER = process.env.BROWSER_PATH || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
if (!BROWSER) { console.error('no Chromium-based browser found; set BROWSER_PATH'); process.exit(1); }
if (!fs.existsSync(path.join(OUT, 'index.html'))) { console.error('out/ is missing: run `npm run build` first'); process.exit(1); }
fs.mkdirSync(SHOTS, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.xml': 'application/xml', '.ico': 'image/x-icon', '.gif': 'image/gif' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const candidates = [url, `${url}.html`, path.posix.join(url, 'index.html')].map((p) => path.join(OUT, p));
  const file = candidates.find((p) => fs.existsSync(p) && fs.statSync(p).isFile()) || path.join(OUT, '404.html');
  res.writeHead(file.endsWith('404.html') ? 404 : 200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--no-first-run', '--disable-gpu', '--hide-scrollbars', '--lang=en-US'] });
const DESKTOP = { width: 1366, height: 900, deviceScaleFactor: 1 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const written = [];

async function open(route, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 90000 }).catch((e) => console.log('nav', route, e.message));
  await sleep(1800); // the page loader fades (300 ms cap), reveal animations settle, the hero fonts swap
  return page;
}
async function shot(page, name, opts = {}) {
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, ...opts });
  written.push(path.relative(ROOT, file).replace(/\\/g, '/'));
}

const PAGES = [['home', '/'], ['about', '/about-us'], ['financing', '/mattress-financing'], ['booking', '/booking'], ['contact-us', '/contact-us'], ['blog', '/blog'], ['post-dream-mapping', '/blog/what-is-dream-mapping-rockwall']];
for (const [name, route] of PAGES) {
  for (const [kind, vp] of [['desktop', DESKTOP], ['mobile', PHONE]]) {
    const page = await open(route, vp);
    await shot(page, `${name}-${kind}`);
    if (FULL) await shot(page, `${name}-${kind}-full`, { fullPage: true });
    await page.close();
  }
}

/* desktop dropdown: "Our Products" opened at the top of the page, then again with the shrunk sticky header */
{
  const page = await open('/', DESKTOP);
  const openMenu = async () => {
    const btn = await page.$('header button[aria-controls][aria-expanded]:not([aria-label^="Open menu"]):not([aria-label^="Close menu"])');
    if (!btn) throw new Error('no dropdown trigger found');
    await btn.click(); await sleep(500);
  };
  await openMenu(); await shot(page, 'nav-dropdown-top');
  await page.keyboard.press('Escape'); await sleep(300);
  await page.evaluate(() => window.scrollTo({ top: 420, behavior: 'instant' })); await sleep(700);
  await openMenu(); await shot(page, 'nav-dropdown-scrolled');
  await page.close();
}

/* mobile drawer: the menu button opens the off-canvas menu */
{
  const page = await open('/', PHONE);
  const burger = await page.$('header button[aria-label="Open menu"]');
  if (!burger) throw new Error('no menu button found');
  await burger.click(); await sleep(700);
  await shot(page, 'mobile-drawer');
  await page.close();
}

/* sections the brief asks to see: the reviews section (card + widget), the About page's team photo and form, the contact
   form, the booking calendar and the footer — the visible copy of each, scrolled into view, desktop and phone */
const SECTIONS = [
  ['/', '.pm-section', 'dream-mapping-steps'],
  ['/', 'img[src*="6a8d8085d0d6a7f1adf28ec7"]', 'location-card'],
  ['/', '.snz-reviews', 'reviews-section'],
  ['/', 'img[src*="6a8df824f9b062f8147fb083"]', 'home-team'],
  ['/about-us', '#snz-team-title', 'about-team'],
  ['/about-us', 'iframe[src*="widget/form/"]', 'about-form'],
  ['/contact-us', 'iframe[src*="widget/form/"]', 'contact-form'],
  ['/booking', 'iframe[src*="widget/booking/"], [class*="pending"]', 'booking-calendar'],
  ['/', 'footer', 'footer'],
];
for (const [route, selector, name] of SECTIONS) {
  for (const [kind, vp] of [['desktop', DESKTOP], ['mobile', PHONE]]) {
    const page = await open(route, vp);
    await sleep(2500); // embeds size themselves and the page's own scripts settle (they reset the scroll position while running)
    const found = await page.evaluate((sel) => {
      const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none'; };
      const el = [...document.querySelectorAll(sel)].find(vis) || [...document.querySelectorAll(sel)].find((e) => e.closest('.bg-col, .c-column') && vis(e.closest('.c-column'))); if (!el) return false;
      const box = el.closest('.c-section, section, footer') || el; const y = box.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: Math.max(0, y), behavior: 'instant' }); return true;
    }, selector);
    if (!found) console.log(`  (${name} @${kind}: nothing visible for ${selector})`);
    await sleep(900);
    await shot(page, `${name}-${kind}`);
    await page.close();
  }
}

await browser.close();
server.close();
console.log(`${written.length} screenshots:`); for (const w of written) console.log('  ' + w);
