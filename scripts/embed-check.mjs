/*
 * Runtime check of the third-party embeds and tags on the static export (out/), in a real browser (Edge/Chrome through
 * puppeteer-core): per page, how many <script> tags load form_embed.js, review-widget.js, gtm.js, gtag.js and the
 * Simpli.fi tag (each must be at most one), how many reviews-widget / form / calendar iframes are in the DOM and
 * visible, whether the Recent Reviews card shows, the dataLayer events, console errors, and whether a GA4 / GTM
 * collect request went out without any interaction (client brief, November 2026, B + C5).
 *   npm run build && node scripts/embed-check.mjs
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'out');
const BROWSER = process.env.BROWSER_PATH || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((p) => fs.existsSync(p));
if (!BROWSER) { console.error('no Chromium-based browser found; set BROWSER_PATH'); process.exit(1); }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.xml': 'application/xml' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = [url, `${url}.html`, path.posix.join(url, 'index.html')].map((p) => path.join(OUT, p)).find((p) => fs.existsSync(p) && fs.statSync(p).isFile()) || path.join(OUT, '404.html');
  res.writeHead(file.endsWith('404.html') ? 404 : 200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--no-first-run', '--disable-gpu', '--hide-scrollbars'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PAGES = process.argv.slice(2).filter((a) => a.startsWith('/'));
const routes = PAGES.length ? PAGES : ['/', '/es', '/about-us', '/es/about-us', '/contact-us', '/es/contact-us', '/booking', '/es/booking', '/mattresses', '/pillows'];
let problems = 0;
for (const route of routes) {
  for (const [kind, vp] of [['desktop', { width: 1366, height: 900 }], ['phone', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
    const page = await browser.newPage(); await page.setViewport(vp);
    const errors = []; const hits = { ga4: 0, gtm: 0, simplifi: 0, formEmbed: 0, reviewWidget: 0 };
    // console errors raised inside third-party frames (Cloudflare Turnstile inside the LeadConnector form, the widgets, the tag
    // vendors) are reported but are not the page's own
    const thirdParty = [];
    page.on('console', (m) => { if (m.type() !== 'error') return; const url = (m.location() && m.location().url) || ''; const line = `${m.text().slice(0, 120)} @ ${url.replace(/^https?:\/\//, '').slice(0, 60)}`; (/challenges\.cloudflare\.com|reputationhub\.site|snoozesleep\.com|leadconnectorhq\.com|googletagmanager|google-analytics|simpli\.fi/.test(url) ? thirdParty : errors).push(line); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${String(e.message || e).slice(0, 140)}`));
    hits.ownGa4 = 0;
    page.on('request', (r) => { const u = r.url(); if (/google-analytics\.com\/g\/collect|analytics\.google\.com\/g\/collect/.test(u)) { hits.ga4++; if (/tid=G-87QBE3D9Z9/.test(u)) hits.ownGa4++; } if (/googletagmanager\.com\/gtm\.js/.test(u)) hits.gtm++; if (/tag\.simpli\.fi\/sifitag/.test(u)) hits.simplifi++; if (/js\/form_embed\.js/.test(u)) hits.formEmbed++; if (/assets\/review-widget\.js/.test(u)) hits.reviewWidget++; });
    await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 90000 }).catch((e) => errors.push(`nav: ${e.message.slice(0, 80)}`));
    // scroll through the page so lazy iframes and lazyOnload scripts get their chance, then settle
    await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); });
    await sleep(2500);
    const dom = await page.evaluate(() => {
      const vis = (el) => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el); return r.width > 0 && r.height > 0 && st.display !== 'none' && st.visibility !== 'hidden'; };
      const tags = (re) => [...document.querySelectorAll('script[src]')].filter((s) => re.test(s.src)).length;
      const frames = (sel) => { const all = [...document.querySelectorAll(sel)]; return `${all.filter(vis).length}/${all.length}`; };
      // tags the GTM container injects at runtime (other properties' gtag.js, a chat loader) are reported, not counted against the page
      const own = (re) => [...document.querySelectorAll('script[src]')].filter((s) => re.test(s.src) && !s.hasAttribute('data-gtm-yt-inspected') && s.closest('#snz-app, head, body') && !s.src.includes('gtm.js') || false);
      const injectedGtag = [...document.querySelectorAll('script[src*="gtag/js?id="]')].map((s) => new URL(s.src).searchParams.get('id')).filter((v, i, a) => a.indexOf(v) === i);
      const chatTags = [...document.querySelectorAll('script[src*="widgets.leadconnectorhq.com"]')].map((s) => `${s.src.split('/').pop()}${s.getAttribute('data-widget-id') ? ' id=' + s.getAttribute('data-widget-id') : ' (no id)'}`);
      return {
        scripts: { formEmbed: tags(/js\/form_embed\.js/), reviewWidget: tags(/assets\/review-widget\.js/), gtm: tags(/googletagmanager\.com\/gtm\.js/), simplifi: tags(/sifitag\//) },
        gtagIds: injectedGtag, chatTags,
        frames: { reviews: frames('iframe.lc_reviews_widget'), form: frames('iframe[src*="widget/form/"]'), calendar: frames('iframe[src*="widget/booking/"]') },
        reviewCard: [...document.querySelectorAll('.snz-reviews')].filter(vis).length, readMoreHidden: [...document.querySelectorAll('.snz-reviews__more')].every((a) => a.hidden),
        h1: document.querySelectorAll('h1').length,
        dataLayer: Array.isArray(window.dataLayer) ? window.dataLayer.filter((e) => e && typeof e === 'object' && typeof e.event === 'string').map((e) => e.event).filter((v, i, a) => a.indexOf(v) === i).join(',') : '(none)',
      };
    });
    const bad = [];
    for (const [k, v] of Object.entries(dom.scripts)) if (v > 1) bad.push(`${k} script ×${v}`);
    if (hits.formEmbed > 1 || hits.reviewWidget > 1 || hits.gtm > 1 || hits.simplifi > 1) bad.push(`duplicate requests ${JSON.stringify(hits)}`);
    if (!hits.ownGa4) bad.push('no GA4 collect hit for G-87QBE3D9Z9');
    if (dom.gtagIds.filter((id) => id === 'G-87QBE3D9Z9').length > 1) bad.push('G-87QBE3D9Z9 loaded twice');
    if (errors.length) bad.push(`${errors.length} console error(s)`);
    if (bad.length) problems++;
    console.log(`${bad.length ? '✗' : '✓'} ${route} @${kind}: own scripts ${JSON.stringify(dom.scripts)} | iframes visible/total ${JSON.stringify(dom.frames)} | review card ${dom.reviewCard}${dom.readMoreHidden ? ' (read-more hidden)' : ''} | h1 ${dom.h1} | requests ${JSON.stringify(hits)} | dataLayer [${dom.dataLayer}]\n     gtag.js ids on the page (ours + the GTM container's): ${dom.gtagIds.join(', ')} | chat loaders (GTM container): ${dom.chatTags.join(' · ') || 'none'}${bad.length ? `\n     ${bad.join('; ')}` : ''}`);
    for (const e of errors.slice(0, 3)) console.log(`     console: ${e}`);
    if (thirdParty.length) console.log(`     third-party console errors (not the page's own): ${thirdParty.length} — e.g. ${thirdParty[0]}`);
    await page.close();
  }
}
await browser.close(); server.close();
console.log(problems ? `\nPROBLEMS on ${problems} page view(s)` : '\nOK: every tag and helper script once, embeds present');
process.exit(problems ? 1 : 0);
