/* Site images reused by the blog (English and Spanish posts). Kept apart from lib/blog-posts.ts so the Spanish
   post files can import them without an import cycle. */
import { STORE_PHOTO_URL, localPhoto } from './location';

export type BlogImage = { src: string; alt: string; width: number; height: number };

const A = '/assets/filesafe/ARD47WoZpqaZSQ9MSxLD/media';
const B = '/assets/filesafe/BljrSmLCnm4gF9LpsTRZ/media';
const L = '/assets/lcimg/image/f_webp/q_80/r_1200/u/filesafe';

/* site images reused for the blog (all already part of the site's assets; heavy originals are served as the WebP
   twins scripts/optimize-images.mjs writes next to them, same name + .webp) */
export const IMG = {
  /* the Rockwall store's own photos (lib/location.ts, served locally by scripts/rockwall-photos.mjs) */
  store: { src: localPhoto(STORE_PHOTO_URL), width: 640, height: 480 },
  /* the pillows category image on /pillows (the store's media library, 1200px WebP variant) */
  pillow: { src: `${L}/qR8peonBlnjGI3ZuLHQP/media/4780a344-1f73-47f5-801c-9a7e2cbb7c1e.png`, width: 1081, height: 1080 },
  /* the Dream Mapping station: a customer on the bed with the DREAM MAPPING screen (About Us, bases and sleep-test pages) */
  station: { src: `${B}/6a7577049a9c7792ea57899a.png.webp`, width: 1000, height: 667 },
  pressureMap: { src: `${A}/11c4f704-6266-4eea-8702-295bb6974c13.png.webp`, width: 1537, height: 1094 },
  sleeper: { src: `${A}/1871b85e-a9ee-4965-9e56-f7b289ce90fa.jpeg.webp`, width: 1920, height: 720 },
  specialists: { src: `${L}/ARD47WoZpqaZSQ9MSxLD/media/695fbfed-24ba-4132-b604-2e6042bbb83f.jpeg`, width: 1000, height: 525 },
  mappingVisit: { src: '/assets/filesafe/SUCPzRcq7b6NGJH7gv9A/media/679361e8c21e373058b2232d.jpeg.webp', width: 1000, height: 525 },
  bedroom: { src: `${L}/ARD47WoZpqaZSQ9MSxLD/media/697a3f631d0982c17e87ab11.png`, width: 1200, height: 1405 },
};
