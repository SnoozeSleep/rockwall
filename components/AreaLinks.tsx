import { LOCATION } from '@/lib/location';
import { localizeHref, type Locale } from '@/lib/i18n';
import { ArrowRightIcon, Icon } from './icons';

/* "Shopping from Rowlett, Heath or Royse City?" — a short band at the end of the home page linking the service-area
   pages (lib/pages/area.ts). Server-rendered, so it reads with or without JavaScript. The three links are cards
   (map-pin badge, city, "View page"), each card one link; no drive times (clone brief, November 2026).
   Styles: overrides/global.css (.snz-areas, .snz-card). */
const COPY = {
  en: {
    eyebrow: 'Service area',
    title: 'Shopping from Rowlett, Heath or Royse City?',
    text: `Snooze Mattress + Wellness is in Rockwall at ${LOCATION.street}, and fits shoppers from across the I-30 corridor east of Dallas — Rockwall, Heath, Rowlett, Royse City, Fate and Forney — with a free five-minute Dream Mapping session. See what a visit from your city gets you:`,
    view: 'View page',
  },
  es: {
    eyebrow: 'Zona de servicio',
    title: '¿Vienes de Rowlett, Heath o Royse City?',
    text: `Snooze Mattress + Wellness está en Rockwall, en ${LOCATION.street}, y atiende a clientes de todo el corredor de la I-30 al este de Dallas — Rockwall, Heath, Rowlett, Royse City, Fate y Forney — con una sesión gratis de Dream Mapping de cinco minutos. Mira qué te da una visita desde tu ciudad:`,
    view: 'Ver página',
  },
};
const AREAS: Array<[city: string, href: string]> = [['Rowlett', '/mattress-store-rowlett'], ['Heath', '/mattress-store-heath'], ['Royse City', '/mattress-store-royse-city']];

export function AreaLinks({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  return (
    <section className="snz-areas" aria-labelledby="snz-areas-title">
      <div className="snz-areas__inner">
        <p className="snz-areas__eyebrow">{c.eyebrow}</p>
        <h2 id="snz-areas-title" className="snz-areas__title">{c.title}</h2>
        <p className="snz-areas__text">{c.text}</p>
        <ul className="snz-cards snz-areas__cards">
          {AREAS.map(([city, href]) => (
            <li key={href}>
              <a className="snz-card snz-card--link" href={localizeHref(href, locale)}>
                <span className="snz-badge"><Icon name="map-pin" /></span>
                <span className="snz-card__title">{city}</span>
                <span className="snz-card__more">{c.view} <ArrowRightIcon /></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
