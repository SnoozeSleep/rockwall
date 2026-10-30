import { LOCATION } from '@/lib/location';
import { SITE } from './site-config';
import type { Locale } from '@/lib/i18n';

/* Site-wide LocalBusiness schema, rendered by the footer exactly once on every route (both locales) — the one
   LocalBusiness record of the Rockwall store (SEO audit, October 2026 — section 5a). The builder's own copy that
   the GoHighLevel runtime injected into <head> after hydration is removed from every page payload by
   scripts/page-schema.mjs, so this block is the only one.
   @type: schema.org has no "MattressStore" type (the audit's wording; the term exists only as a Google Business
   Profile category), and an unknown type fails every validator, so the nearest valid Store subtype is used,
   FurnitureStore, together with LocalBusiness. Everything else comes from lib/location.ts: name, address, telephone,
   email, opening hours, priceRange, url, image, sameAs (Facebook, Instagram, and YouTube, TikTok and the Google
   Business Profile URL when the client supplies them — empty values are left out), hasMap and areaServed; geo only
   once the coordinates are supplied. No AggregateRating or Review markup, on purpose. */
const SITE_URL = 'https://rockwall.snoozemattresscompany.com';

export function LocalBusinessJsonLd({ locale = 'en' }: { locale?: Locale }) {
  const L = LOCATION;
  const sameAs = [L.social.facebook, L.social.instagram, L.social.youtube, L.social.tiktok, L.gbpUrl].filter(Boolean);
  const data = {
    '@context': 'https://schema.org',
    '@type': ['FurnitureStore', 'LocalBusiness'],
    '@id': `${SITE_URL}/#store`,
    name: L.name,
    legalName: L.legalName,
    url: locale === 'es' ? `${SITE_URL}/es` : `${SITE_URL}/`,
    image: [`${SITE_URL}${L.storefrontImage}`, `${SITE_URL}${SITE.logo}`],
    logo: `${SITE_URL}${SITE.logo}`,
    telephone: `+1 ${L.phone}`,
    email: L.email,
    priceRange: L.priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: L.street,
      addressLocality: L.city,
      addressRegion: L.region,
      postalCode: L.postalCode,
      addressCountry: L.country,
    },
    ...(L.geo ? { geo: { '@type': 'GeoCoordinates', latitude: L.geo.latitude, longitude: L.geo.longitude } } : {}),
    hasMap: L.gbpUrl || L.mapLink,
    sameAs,
    openingHoursSpecification: L.openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days.map((d) => `https://schema.org/${d}`),
      opens: h.opens,
      closes: h.closes,
    })),
    areaServed: L.areaServed.map((city) => ({ '@type': 'City', name: city, containedInPlace: { '@type': 'State', name: 'Texas' } })),
  };
  return (
    <script
      type="application/ld+json"
      // JSON inside a script element: escape "<" so no markup can terminate the block
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
