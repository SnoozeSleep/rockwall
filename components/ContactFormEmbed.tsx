import { INTEGRATIONS } from '@/lib/integrations';
import { LOCATION } from '@/lib/location';
import { ui, type Locale } from '@/lib/i18n';
import { FormEmbedScript } from './GhlScripts';

/* The opt-in form on /about-us and /es/about-us (client brief, November 2026, C3): the client's LeadConnector "Optin" form
   embed with every data-* attribute as supplied, under the footer's "Get In Touch With Us" heading and the contact page's
   own subheading; form_embed.js is loaded once per page (components/GhlScripts.tsx) and sizes the frame, which reserves
   744px until then (overrides/global.css). While the form id is empty (lib/integrations.json) the card shows the phone
   number and e-mail instead. Server-rendered after the builder's page, like components/AboutTeam.tsx. */
const COPY = {
  en: { text: 'Have Questions? Reach Out And Our Team Will Get Back To You Shortly.', frame: 'Contact form', pending: 'Our contact form is on its way. In the meantime, call or email us:' },
  es: { text: '¿Tienes preguntas? Escríbenos y nuestro equipo te responderá muy pronto.', frame: 'Formulario de contacto', pending: 'Nuestro formulario de contacto está en camino. Mientras tanto, llámanos o escríbenos:' },
};

export function ContactFormEmbed({ locale }: { locale: Locale }) {
  const c = COPY[locale] || COPY.en;
  const id = INTEGRATIONS.formId;
  return (
    <section className="snz-areas snz-form" aria-labelledby="snz-form-title">
      <div className="snz-areas__inner">
        <h2 id="snz-form-title" className="snz-areas__title">{ui(locale).footer.contact}</h2>
        <p className="snz-areas__text">{c.text}</p>
        {id ? (
          <>
            <iframe
              className="snz-form__frame"
              src={`https://link.snoozesleep.com/widget/form/${id}`}
              style={{ width: '100%', border: 'none', borderRadius: 3 }}
              id={`inline-${id}`}
              data-layout="{'id':'INLINE'}"
              data-trigger-type="alwaysShow"
              data-trigger-value=""
              data-activation-type="alwaysActivated"
              data-activation-value=""
              data-deactivation-type="neverDeactivate"
              data-deactivation-value=""
              data-form-name="Optin"
              data-height="744"
              data-layout-iframe-id={`inline-${id}`}
              data-form-id={id}
              data-cookie-consent="true"
              data-cookie-consent-provider="auto"
              title={c.frame}
            />
            <FormEmbedScript />
          </>
        ) : (
          <div className="snz-form-pending">
            <p className="snz-form-pending__text">{c.pending}</p>
            <p className="snz-form-pending__links"><a href={LOCATION.phoneHref}>{LOCATION.phone}</a><span aria-hidden="true"> · </span><a href={`mailto:${LOCATION.email}`}>{LOCATION.email}</a></p>
          </div>
        )}
      </div>
    </section>
  );
}
