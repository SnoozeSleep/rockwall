#!/usr/bin/env node
/**
 * The Rockwall store's own photos (its GoHighLevel media library, sub-account qR8peonBlnjGI3ZuLHQP), served the way the
 * converter serves every other client image: the original under public/assets/filesafe/<account>/media/<file>, a WebP
 * twin next to it (<file>.webp, what the pages reference for heavy originals) and the responsive variants under
 * public/assets/lcimg/image/f_webp/q_80/r_<width>/u/filesafe/<account>/media/<file> (WebP content, the original's
 * name, like the images.leadconnectorhq.com proxy). scripts/relocate.mjs maps the previous location's photos to these.
 *   node scripts/rockwall-photos.mjs          (downloads what is missing, then writes the twins and variants; idempotent)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ACCOUNT = 'qR8peonBlnjGI3ZuLHQP';
// the URLs live in lib/location.ts (STORE_PHOTO_URL, TEAM_PHOTO_URL, HERO_PHOTO_URLS); Node 24 imports the TypeScript module directly
const { STORE_PHOTO_URL, TEAM_PHOTO_URL, HERO_PHOTO_URLS } = await import(new URL('../lib/location.ts', import.meta.url));
const fileOf = (url) => { const m = url.match(/filesafe\.space\/([^/]+)\/media\/([^/?#]+)$/); if (!m || m[1] !== ACCOUNT) throw new Error(`not a ${ACCOUNT} media-library URL: ${url}`); return m[2]; };
const PHOTOS = [
  { file: fileOf(STORE_PHOTO_URL), what: 'storefront (location cards, LocalBusiness image, About page)' },
  { file: fileOf(TEAM_PHOTO_URL), what: 'team (home About section, About page "Meet Your Sleep Coaches")' },
  // the hero PNGs are ~2 MB each and nothing references the originals: they are cached outside public/ (verify-out/, not
  // committed) and only their WebP twin and variants are written into the site
  ...Object.entries(HERO_PHOTO_URLS).map(([route, url]) => ({ file: fileOf(url), what: `${route} desktop hero background (≥768px; scripts/hero-images.mjs)`, original: false })),
];
const CACHE = path.join(ROOT, 'verify-out', 'photos');
const WIDTHS = [320, 640, 768, 900, 1200];
const MEDIA = path.join(ROOT, 'public', 'assets', 'filesafe', ACCOUNT, 'media');
fs.mkdirSync(MEDIA, { recursive: true });

for (const p of PHOTOS) {
  const src = path.join(p.original === false ? CACHE : MEDIA, p.file);
  if (p.original === false) { fs.mkdirSync(CACHE, { recursive: true }); const stray = path.join(MEDIA, p.file); if (fs.existsSync(stray)) fs.unlinkSync(stray); }
  if (!fs.existsSync(src)) {
    const res = await fetch(`https://assets.cdn.filesafe.space/${ACCOUNT}/media/${p.file}`);
    if (!res.ok) throw new Error(`${p.file}: ${res.status}`);
    fs.writeFileSync(src, Buffer.from(await res.arrayBuffer()));
  }
  const meta = await sharp(src).metadata();
  const twin = path.join(MEDIA, `${p.file}.webp`); // always next to where the original would be served from
  if (!fs.existsSync(twin)) await sharp(src).rotate().webp({ quality: 82 }).toFile(twin);
  for (const w of WIDTHS) {
    const dir = path.join(ROOT, 'public', 'assets', 'lcimg', 'image', 'f_webp', 'q_80', `r_${w}`, 'u', 'filesafe', ACCOUNT, 'media');
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, p.file);
    if (!fs.existsSync(out)) await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
  }
  console.log(`${p.file}: ${meta.width}x${meta.height} — ${p.what}; twin + ${WIDTHS.length} variants`);
}
