/* Blog entries shown in the site navigation (header dropdown + mobile drawer). Kept tiny on purpose:
   the header is a client component and must not pull the full article content into every page.
   Hrefs are English paths; the header localizes them (/es/...) for the Spanish site.
   Rockwall site (October 31, 2026): no articles yet (lib/blog-posts.ts), so both lists are empty and the header renders
   "Blog" as a plain link to the index instead of a dropdown. Add entries here when posts are published. */
import type { Locale } from './i18n';

export const BLOG_INDEX = { label: 'All articles', href: '/blog' };

/* Posts whose slug differs per language: English slug -> Spanish slug. lib/i18n.ts alternateHref() uses it so the
   EN | ES switcher lands on the right article; components/blog/pages.tsx and app/sitemap.ts take the same pairing
   from BlogPost.altSlug. */
export const BLOG_SLUG_ES: Record<string, string> = {};
/** the slug of a blog post in `target` (unchanged when both languages share it) */
export function blogSlugFor(slug: string, target: Locale): string {
  if (target === 'es') return BLOG_SLUG_ES[slug] || slug;
  return Object.keys(BLOG_SLUG_ES).find((en) => BLOG_SLUG_ES[en] === slug) || slug;
}

export type BlogNavItem = { label: string; href: string; blurb: string };
export const BLOG_NAV: BlogNavItem[] = [];
export const BLOG_NAV_ES: BlogNavItem[] = [];

export const blogNav = (locale: Locale) => (locale === 'es' ? BLOG_NAV_ES : BLOG_NAV);
