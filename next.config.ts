import type { NextConfig } from 'next';

/* The site's public origin, decided once per build and handed to every bundle as NEXT_PUBLIC_SITE_URL (lib/site-url.ts
   reads it): the explicit NEXT_PUBLIC_SITE_URL when the project sets one (do that only once the custom domain is attached
   and resolving), otherwise the deployment's own host from Vercel's system variables (the *.vercel.app production alias,
   or the preview host), otherwise localhost for a local build. The custom domain is hardcoded nowhere. */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  'http://localhost:3000'
).replace(/\/+$/, '');

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_SITE_URL: SITE_URL },
  // Every route is prerendered, so the site ships as plain static files (out/): no server functions, no ISR cache
  // (each page view from Vercel's prerender cache counted as an ISR read and as origin transfer), smaller
  // deployments. Redirects, rewrites and cache headers live in vercel.json, which Vercel applies to static output.
  output: 'export',
  // the page's own CSS (global.css, the Poppins faces, component modules: ~15 KB) is written into the HTML instead
  // of three render-blocking stylesheet requests
  experimental: { inlineCss: true },
  // next/image (footer logo, blog images) serves the local files as they are; nothing is optimized per request (a static
  // export has no /_next/image). The store's media-library host is listed so a next/image with one of its URLs is
  // accepted should the site ever run with the optimizer; today those photos are served from this origin
  // (lib/location.ts localPhoto, scripts/rockwall-photos.mjs).
  images: { unoptimized: true, remotePatterns: [{ protocol: 'https', hostname: 'assets.cdn.filesafe.space' }] },
};

export default nextConfig;
