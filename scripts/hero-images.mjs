/*
 * Desktop-only hero backgrounds (client brief, November 2026): the home, About Us and Financing heroes get the Rockwall
 * composites from lib/location.ts HERO_PHOTO_URLS at viewports of 768px and up; phones keep the shared hero background.
 * The builder renders each hero twice (a desktop-only and a mobile-only section copy, switched at 1024px) and paints the
 * background with per-breakpoint `.bg-section-<id> { background: url(…) }` rules in the page head. This script appends one
 * marked <style> block to each page's HEAD_HTML (EN and the /es twin):
 *     @media (min-width:768px) { .bg-section-<desktop>, .bg-section-<mobile> { background-image: url(<local WebP>) !important } }
 * so from 768px up whichever copy is on screen shows the new image, while placement, overlay, sizing and the text
 * treatment stay the builder's own (only the image changes). Below 768px nothing changes. The hero preload in the page's
 * client.tsx (the `(min-width: 768px)` entry; components/GhlPage.tsx adds fetchpriority=high) points at the new image
 * too, so the desktop LCP image starts downloading with the HTML. The images are served from this origin
 * (scripts/rockwall-photos.mjs writes the WebP twin of each PNG). Idempotent.  node scripts/hero-images.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const { HERO_PHOTO_URLS, localPhoto } = await import(new URL('../lib/location.ts', import.meta.url)); // Node 24 strips the types
const MARK = "<style data-snz='hero-image'>";

let changed = 0, checked = 0, problems = 0;
for (const [route, url] of Object.entries(HERO_PHOTO_URLS)) {
  const local = localPhoto(url);
  if (!fs.existsSync(path.join(ROOT, 'public', local))) { console.error(`${local} is missing: run node scripts/rockwall-photos.mjs first`); process.exit(1); }
  for (const dir of [path.join(ROOT, 'app', '(en)', route === '/' ? '' : route.slice(1)), path.join(ROOT, 'app', 'es', route === '/' ? '' : route.slice(1))]) {
    const contentFile = path.join(dir, 'content.ts'), clientFile = path.join(dir, 'client.tsx');
    const src = fs.readFileSync(contentFile, 'utf8');
    // the hero sections: data-snz-hero on the desktop-only and the mobile-only copy (quotes are escaped in the TS string)
    const ids = { desktop: null, mobile: null };
    for (const m of src.matchAll(/id=\\"(section-[A-Za-z0-9_-]+)\\"([^>]*?)data-snz-hero/g)) { if (/desktop-only/.test(m[2])) ids.desktop = m[1]; else if (/mobile-only/.test(m[2])) ids.mobile = m[1]; }
    if (!ids.desktop) { console.error(`${path.relative(ROOT, contentFile)}: no desktop hero section found`); problems++; continue; }
    const selectors = [ids.desktop, ids.mobile].filter(Boolean).map((id) => `.bg-${id}`).join(','); // the builder's background class is bg-<section id>
    const block = `${MARK}@media (min-width:768px){${selectors}{background-image:url(${local})!important}}</style>`;
    // append to HEAD_HTML (replace an earlier block of ours)
    const start = src.indexOf('export const HEAD_HTML = "'); const endM = start >= 0 ? src.slice(start).match(/";\r?\n/) : null; const lineEnd = endM ? start + endM.index : -1; // the files mix CRLF and LF
    if (start < 0 || lineEnd < 0) { console.error(`${path.relative(ROOT, contentFile)}: HEAD_HTML not found`); problems++; continue; }
    let head = src.slice(start, lineEnd);
    const old = head.indexOf(MARK);
    if (old >= 0) head = head.slice(0, old) + block + head.slice(head.indexOf('</style>', old) + '</style>'.length);
    else head = head + block;
    const next = src.slice(0, start) + head + src.slice(lineEnd);
    // the desktop preload entry in client.tsx
    const client = fs.readFileSync(clientFile, 'utf8');
    const nextClient = client.replace(/"href":"[^"]*","media":"\(min-width: 768px\)"/, `"href":"${local}","media":"(min-width: 768px)"`);
    if (!/\(min-width: 768px\)/.test(client)) { console.error(`${path.relative(ROOT, clientFile)}: no desktop hero preload entry`); problems++; }
    checked++;
    const rel = path.relative(ROOT, dir).replace(/\\/g, '/');
    if (next !== src || nextClient !== client) {
      if (CHECK) { console.error(`${rel}: hero image / preload out of date`); problems++; continue; }
      fs.writeFileSync(contentFile, next); fs.writeFileSync(clientFile, nextClient); changed++;
      console.log(`${rel}: ${ids.desktop}${ids.mobile ? ' + ' + ids.mobile : ''} → ${local} (≥768px); desktop preload updated`);
    }
  }
}
if (problems) process.exit(1);
console.log(changed ? `${changed} of ${checked} hero page(s) updated` : `${checked} hero page(s) up to date`);
