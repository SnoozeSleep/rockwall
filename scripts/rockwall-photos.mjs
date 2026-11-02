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
const PHOTOS = [
  { file: '6a8d8085d0d6a7f1adf28ec7.jpg', what: 'storefront (location cards, LocalBusiness image, About page)' },
  { file: '6a8df824f9b062f8147fb083.jpg', what: 'team (home About section, About page "Meet Your Sleep Coaches")' },
];
const WIDTHS = [320, 640, 768, 900, 1200];
const MEDIA = path.join(ROOT, 'public', 'assets', 'filesafe', ACCOUNT, 'media');
fs.mkdirSync(MEDIA, { recursive: true });

for (const p of PHOTOS) {
  const src = path.join(MEDIA, p.file);
  if (!fs.existsSync(src)) {
    const res = await fetch(`https://assets.cdn.filesafe.space/${ACCOUNT}/media/${p.file}`);
    if (!res.ok) throw new Error(`${p.file}: ${res.status}`);
    fs.writeFileSync(src, Buffer.from(await res.arrayBuffer()));
  }
  const meta = await sharp(src).metadata();
  const twin = `${src}.webp`;
  if (!fs.existsSync(twin)) await sharp(src).rotate().webp({ quality: 82 }).toFile(twin);
  for (const w of WIDTHS) {
    const dir = path.join(ROOT, 'public', 'assets', 'lcimg', 'image', 'f_webp', 'q_80', `r_${w}`, 'u', 'filesafe', ACCOUNT, 'media');
    fs.mkdirSync(dir, { recursive: true });
    const out = path.join(dir, p.file);
    if (!fs.existsSync(out)) await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
  }
  console.log(`${p.file}: ${meta.width}x${meta.height} — ${p.what}; twin + ${WIDTHS.length} variants`);
}
