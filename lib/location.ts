/* The store. Used by the top bar, the footer (address, map, social links), the contact page's details, the content
   pages' call-to-action line and the site-wide LocalBusiness JSON-LD. scripts/relocate.mjs (ROCKWALL) carries the same
   values for the generated GoHighLevel pages: change both together.
   Rockwall, TX location (client brief, October 31, 2026): "Snooze Mattress + Wellness", 919 E Interstate 30, Suite 101,
   Rockwall, TX 75032 · (469) 769-1300 · Mon–Sat 10 AM–7 PM, Sun 10 AM–6 PM · jadams@snoozemattresscompany.com.
   Values the client has not supplied yet are empty strings or null and marked NEEDS CLIENT INPUT; the components that
   read them render nothing for an empty value (no icon, no sameAs entry, no geo). */
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
  /* LocalBusiness schema image (components/LocalBusinessJsonLd.tsx). [ROCKWALL_STOREFRONT_PHOTO] NEEDS CLIENT INPUT:
     the previous location's storefront photo must not represent this store, so until a Rockwall photo arrives the site's Dream
     Mapping station photo stands in here and in the pages' location cards (scripts/relocate.mjs). */
  storefrontImage: '/assets/filesafe/BljrSmLCnm4gF9LpsTRZ/media/6a7577049a9c7792ea57899a.png.webp',
  priceRange: '$$',
  areaServed: ['Rockwall'],
  hours: {
    en: ['Mon–Sat 10 AM–7 PM', 'Sun 10 AM–6 PM'],
    es: ['Lun–Sáb 10 AM–7 PM', 'Dom 10 AM–6 PM'],
  },
  openingHours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '10:00', closes: '19:00' },
    { days: ['Sunday'], opens: '10:00', closes: '18:00' },
  ],
} as const;
