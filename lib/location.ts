/* The store. Used by the top bar, the footer (address, map, social links), the contact page's details, the content
   pages' call-to-action line and the site-wide LocalBusiness JSON-LD. scripts/relocate.mjs (ROCKWALL) carries the same
   values for the generated GoHighLevel pages: change both together.
   Rockwall, TX location (client brief, October 31, 2026): "Snooze Mattress + Wellness", 919 E Interstate 30, Suite 101,
   Rockwall, TX 75032 · (469) 769-1300 · Mon–Sat 10 AM–7 PM, Sun 10 AM–6 PM · jadams@snoozemattresscompany.com.
   Values the client has not supplied yet are empty strings or null and marked NEEDS CLIENT INPUT; the components that
   read them render nothing for an empty value (no icon, no sameAs entry, no geo). */
/* The store's own photos from its GoHighLevel media library (sub-account qR8peonBlnjGI3ZuLHQP; client brief, November
   2026). These CDN URLs are the source of truth. scripts/rockwall-photos.mjs downloads each one and writes the WebP twin
   and the responsive WebP variants that the pages serve from this origin (no third-party request on the page; the site
   is a static export with images.unoptimized, so there is no /_next/image step); localPhoto() maps a URL to that path. */
export const STORE_PHOTO_URL = 'https://assets.cdn.filesafe.space/qR8peonBlnjGI3ZuLHQP/media/6a8d8085d0d6a7f1adf28ec7.jpg';
export const TEAM_PHOTO_URL = 'https://assets.cdn.filesafe.space/qR8peonBlnjGI3ZuLHQP/media/6a8df824f9b062f8147fb083.jpg';
/** Desktop-only (≥768px) hero backgrounds per page (EN route; the /es twin uses the same): scripts/hero-images.mjs writes
    them into the pages; phones keep the shared hero background. */
export const HERO_PHOTO_URLS = {
  '/': 'https://assets.cdn.filesafe.space/qR8peonBlnjGI3ZuLHQP/media/6a8d7ddcd0d6a7f1adef5d34.png',
  '/about-us': 'https://assets.cdn.filesafe.space/qR8peonBlnjGI3ZuLHQP/media/6a8c965667bb7ac35184c016.png',
  '/mattress-financing': 'https://assets.cdn.filesafe.space/qR8peonBlnjGI3ZuLHQP/media/6a8d7b7ead59e6cfedce3c9d.png',
} as const;
/** Local path of a media-library photo: the WebP twin of the original, or the responsive WebP variant at `width` px */
export function localPhoto(url: string, width?: 320 | 640 | 768 | 900 | 1200): string {
  const m = url.match(/filesafe\.space\/([^/]+)\/media\/([^/?#]+)$/);
  if (!m) throw new Error(`not a media-library URL: ${url}`);
  return width ? `/assets/lcimg/image/f_webp/q_80/r_${width}/u/filesafe/${m[1]}/media/${m[2]}` : `/assets/filesafe/${m[1]}/media/${m[2]}.webp`;
}

export const LOCATION = {
  name: 'Snooze Mattress + Wellness',
  legalName: 'Snooze Mattress + Wellness', // the legal name is the display name (confirmed for the brand, October 22, 2026)
  street: '919 E Interstate 30, Suite 101',
  city: 'Rockwall',
  region: 'TX',
  postalCode: '75032',
  country: 'US',
  phone: '(469) 769-1300',
  phoneHref: 'tel:+14697691300',
  phoneIntl: '+1 469-769-1300',
  email: 'jadams@snoozemattresscompany.com',
  /* GeoCoordinates of the storefront: NEEDS CLIENT INPUT ([ROCKWALL_GEO], read off the Google Business Profile once the
     Place ID is supplied). null = the LocalBusiness schema carries no geo property. */
  geo: null as null | { latitude: number; longitude: number },
  social: {
    facebook: 'https://www.facebook.com/people/Snooze-Mattress-Wellness-Rockwall-TX/61582495686069/',
    instagram: 'https://www.instagram.com/rockwalltxsnooze/',
    youtube: '', // no Rockwall channel was supplied: '' = no footer icon, not in sameAs
    tiktok: '', // [ROCKWALL_TIKTOK] NEEDS CLIENT INPUT (or NONE): '' = no footer icon, not in sameAs
  },
  /* The store's Google Business Profile: [ROCKWALL_PLACE_ID] NEEDS CLIENT INPUT. Until then the map links are a Google
     Maps search for the exact address, and the "Leave us a Google review" button (scripts/reviews-cta.mjs) stays hidden. */
  placeId: '',
  gbpUrl: '',
  mapLink: 'https://www.google.com/maps/search/?api=1&query=919+E+Interstate+30+Suite+101+Rockwall+TX+75032',
  mapEmbed: 'https://www.google.com/maps?q=Snooze+Mattress+%2B+Wellness%2C+919+E+Interstate+30%2C+Suite+101%2C+Rockwall%2C+TX+75032&output=embed',
  /* LocalBusiness schema image (components/LocalBusinessJsonLd.tsx): the Rockwall storefront photo (STORE_PHOTO_URL,
     served locally; the same photo is in the pages' location cards and on the About page through scripts/relocate.mjs). */
  storefrontImage: localPhoto(STORE_PHOTO_URL),
  priceRange: '$$',
  /* the cities the store serves (schema areaServed, the About page's serving line, the footer's "Also serving" line):
     Rockwall and the I-30 corridor east of Dallas (clone brief, November 2026) */
  areaServed: ['Rockwall', 'Heath', 'Rowlett', 'Royse City', 'Fate', 'Forney'],
  hours: {
    en: ['Mon–Sat 10 AM–7 PM', 'Sun 10 AM–6 PM'],
    es: ['Lun–Sáb 10 AM–7 PM', 'Dom 10 AM–6 PM'],
  },
  openingHours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '10:00', closes: '19:00' },
    { days: ['Sunday'], opens: '10:00', closes: '18:00' },
  ],
} as const;
