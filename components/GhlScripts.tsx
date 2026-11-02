import Script from 'next/script';

/* The two LeadConnector helper scripts, each loaded exactly ONCE per page through next/script (one id each, so a page that
   carries several embeds — the contact page's desktop and phone form copies, a form and a calendar — still loads each
   script once), after the iframes exist in the markup (client brief, November 2026, C1 / C5).
   - form_embed.js sizes the opt-in form and the booking calendar iframes to their content; afterInteractive, so the
     frames get their height as soon as the page is interactive (components/BookingPage.tsx's height guard relies on it).
   - review-widget.js is the reviews widget's helper; lazyOnload, as the brief asks.
   The generated pages get these through their page.tsx (scripts/integrations.mjs and scripts/reviews-cta.mjs add the
   component where the embed is); the hand-written pages render them directly. */
export function FormEmbedScript() {
  return <Script id="ghl-form-embed" src="https://link.snoozesleep.com/js/form_embed.js" strategy="afterInteractive" />;
}

export function ReviewWidgetScript() {
  return <Script id="ghl-review-widget" src="https://reputationhub.site/reputation/assets/review-widget.js" strategy="lazyOnload" />;
}
