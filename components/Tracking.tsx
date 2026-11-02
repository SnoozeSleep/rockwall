'use client';
/* Tracking tags for every page (both languages), rendered once by both root layouts (and by the converter's layout
   template), high in <head>, all loading at parse time, in this order:
     1. Google Tag Manager (the standard inline loader; it injects an async gtm.js) — the container shared with the
        other stores
     2. Google tag (gtag.js) + its config, once per GA4 measurement id (the client's snippet carried the block twice;
        it is installed ONCE)
     3. Simpli.fi (async)
   plus the GTM noscript iframe as the first element we render in <body> (Next.js itself emits an empty <div hidden>
   before it). Nothing waits for an interaction, the load event or consent (a previous performance pass deferred the tags
   until the first interaction and GA4 stopped recording visitors who bounced). Site events (phone_click,
   directions_click, booking_confirmation, optin_submit, quiz events) go to the same dataLayer from public/snz-events.js
   and public/sleep-fit-quiz.js.

   The ids live in lib/integrations.json (client brief, November 2026); an empty value leaves that tag out, and with no
   id at all this component renders nothing.

   Why this is a client component: React 19 treats every `<script async src>` as a hoistable resource and moves it
   ahead of the rest of <head>, which would put the gtag.js loaders before the inline config / GTM snippets. A script
   that has an onLoad handler is rendered in place instead, so each async loader carries a no-op onLoad (it adds nothing
   to the HTML) and the order in view-source is exactly the snippets' order.

   Hydration safety: tags fired by a GTM container (CallRail number swapping and others) insert elements into <body>
   while a long page is still streaming. components/GhlPage.tsx keeps the server-rendered page markup and puts it back
   if React ever has to re-render the tree after such an insertion, so the page never comes back blank. */
import { Fragment } from 'react';
import { INTEGRATIONS } from '@/lib/integrations';

const keep = () => {};
const { gtmId, ga4Ids, simplifiId } = INTEGRATIONS;

/* The standard snippets, with the id filled in. */
const gtagConfig = (id: string) => `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${id}');
`;
const gtmSnippet = (id: string) => `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`;
const gtmNoscript = (id: string) => `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}"
height="0" width="0" style="display:none;visibility:hidden"></iframe>`;

/** <head> tags, in the order above; nothing while no id is configured. */
export function TrackingHead() {
  if (!gtmId && !ga4Ids.length && !simplifiId) return null;
  return (
    <>
      {gtmId || ga4Ids.length ? <link rel="preconnect" href="https://www.googletagmanager.com" /> : null}
      {simplifiId ? <link rel="dns-prefetch" href="https://tag.simpli.fi" /> : null}
      {gtmId ? (
        <>
          {/* Google Tag Manager */}
          <script dangerouslySetInnerHTML={{ __html: gtmSnippet(gtmId) }} />
          {/* End Google Tag Manager */}
        </>
      ) : null}
      {ga4Ids.map((id) => (
        <Fragment key={id}>
          {/* Google tag (gtag.js) */}
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`} onLoad={keep} />
          <script dangerouslySetInnerHTML={{ __html: gtagConfig(id) }} />
        </Fragment>
      ))}
      {simplifiId ? <script async src={`https://tag.simpli.fi/sifitag/${simplifiId}`} onLoad={keep} /> : null}
    </>
  );
}

/** Google Tag Manager (noscript), immediately after <body>; nothing while no container is configured. */
export function TrackingBody() {
  return gtmId ? <noscript dangerouslySetInnerHTML={{ __html: gtmNoscript(gtmId) }} /> : null;
}
