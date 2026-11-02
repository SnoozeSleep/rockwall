/* The site's public origin, resolved ONCE at build time (static export: there is no request to read a host from).
   Order (next.config.ts computes it and exposes it as NEXT_PUBLIC_SITE_URL to every bundle, server and client alike,
   so server-rendered markup and the hydrated client agree):
     1. NEXT_PUBLIC_SITE_URL          — set it in the Vercel project (Settings → Environment Variables) once the custom
                                        domain is attached and resolving, e.g. https://rockwall.snoozemattresscompany.com
     2. VERCEL_PROJECT_PRODUCTION_URL — the deployment's own production host (the *.vercel.app alias until a domain is
                                        attached): Vercel sets it on every build (system environment variables)
     3. VERCEL_URL                    — the deployment host (preview deployments)
     4. http://localhost:3000         — a local build without any of the above
   The custom domain is written nowhere else: canonicals, hreflang, Open Graph, sitemap, robots, JSON-LD, the quiz's
   results link and the generated pages' self-links (the __SITE_URL__ / __SITE_HOST__ tokens, see fillSiteTokens) all
   derive from this value. */
const raw = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/** Origin without a trailing slash, e.g. https://rockwall.snoozemattresscompany.com */
export const SITE_URL = raw.replace(/\/+$/, '');
/** Host only, e.g. rockwall.snoozemattresscompany.com */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');
/** For Next metadata: the base every relative canonical / alternate / Open Graph URL resolves against */
export const METADATA_BASE = new URL(SITE_URL);
/** Absolute URL of a site path; the home page is the bare origin (the canonical form used by the sitemap too) */
export const absUrl = (path: string) => (path === '/' || path === '' ? SITE_URL : `${SITE_URL}${path}`);

/* The generated builder pages (app/**／content.ts, scripts.ts) carry their own absolute self-links — the footer logo link,
   the Terms page's link to the Privacy Policy, the funnel's domain field in the hydration payload. scripts/relocate.mjs
   writes them as tokens; the page renderer (components/GhlPage.tsx) fills them in, markup and payload alike. */
export const SITE_URL_TOKEN = '__SITE_URL__';
export const SITE_HOST_TOKEN = '__SITE_HOST__';
export const fillSiteTokens = (s: string) => (s.includes('__SITE_') ? s.split(SITE_URL_TOKEN).join(SITE_URL).split(SITE_HOST_TOKEN).join(SITE_HOST) : s);
