import { LOCATION, TEAM_PHOTO_URL, localPhoto } from '@/lib/location';
import type { Locale } from '@/lib/i18n';

/* "Meet Your Sleep Coaches" on /about-us and /es/about-us (clone brief, November 2026): the Rockwall store's team photo
   (its GoHighLevel media library, served locally by scripts/rockwall-photos.mjs) and the serving line — the cities the
   store serves, from lib/location.ts. No staff names or bios. Server-rendered after the builder's page, outside the
   GoHighLevel markup (like components/ContactDetails.tsx). Styles: overrides/global.css (.snz-areas, .snz-team). */
export const TEAM_PHOTO = localPhoto(TEAM_PHOTO_URL, 1200); // the 1200px WebP variant of lib/location.ts TEAM_PHOTO_URL
const list = (cities: readonly string[], and: string) => `${cities.slice(0, -1).join(', ')} ${and} ${cities[cities.length - 1]}`;
const COPY = {
  en: { eyebrow: 'Our team', title: 'Meet Your Sleep Coaches', serving: `Serving ${list(LOCATION.areaServed, 'and')} from ${LOCATION.street}, ${LOCATION.city}, ${LOCATION.region}.`, alt: 'Sleep Coaches at Snooze Mattress + Wellness in Rockwall' },
  es: { eyebrow: 'Nuestro equipo', title: 'Conoce a tus Sleep Coaches', serving: `Atendemos ${list(LOCATION.areaServed, 'y')} desde ${LOCATION.street}, ${LOCATION.city}, ${LOCATION.region}.`, alt: 'Sleep Coaches de Snooze Mattress + Wellness en Rockwall' },
};

export function AboutTeam({ locale }: { locale: Locale }) {
  const c = COPY[locale] || COPY.en;
  return (
    <section className="snz-areas snz-team" aria-labelledby="snz-team-title">
      <div className="snz-areas__inner">
        <p className="snz-areas__eyebrow">{c.eyebrow}</p>
        <h2 id="snz-team-title" className="snz-areas__title">{c.title}</h2>
        <p className="snz-areas__text">{c.serving}</p>
        <img className="snz-team__photo" src={TEAM_PHOTO} alt={c.alt} width={1200} height={900} loading="lazy" decoding="async" />
      </div>
    </section>
  );
}
