/* Blog entries shown in the site navigation (header dropdown + mobile drawer). Kept tiny on purpose:
   the header is a client component and must not pull the full article content into every page.
   Hrefs are English paths; the header localizes them (/es/...) for the Spanish site.
   Rockwall site: the five articles of November 3, 2026 (lib/blog-posts.ts), in the document's order. */
import type { Locale } from './i18n';

export const BLOG_INDEX = { label: 'All articles', href: '/blog' };

/* Posts whose slug differs per language: English slug -> Spanish slug. lib/i18n.ts alternateHref() uses it so the
   EN | ES switcher lands on the right article; components/blog/pages.tsx and app/sitemap.ts take the same pairing
   from BlogPost.altSlug (keep both in step). */
export const BLOG_SLUG_ES: Record<string, string> = {
  'snooze-mattress-rockwall-grand-opening': 'snooze-mattress-rockwall-gran-apertura',
  'what-is-dream-mapping-rockwall': 'que-es-dream-mapping-rockwall',
  'best-mattress-for-your-sleep-position': 'mejor-colchon-segun-tu-posicion-al-dormir',
  'firm-vs-soft-mattress-myth': 'colchon-firme-vs-suave-mito',
  'how-to-choose-the-right-pillow': 'como-elegir-la-almohada-correcta',
};
/** the slug of a blog post in `target` (unchanged when both languages share it) */
export function blogSlugFor(slug: string, target: Locale): string {
  if (target === 'es') return BLOG_SLUG_ES[slug] || slug;
  return Object.keys(BLOG_SLUG_ES).find((en) => BLOG_SLUG_ES[en] === slug) || slug;
}

export type BlogNavItem = { label: string; href: string; blurb: string };
export const BLOG_NAV: BlogNavItem[] = [
  { label: 'Hello, Rockwall! Better Sleep Has a New Home on the Lake', href: '/blog/snooze-mattress-rockwall-grand-opening', blurb: 'Meet your new local sleep experts' },
  { label: 'What Is Dream Mapping?', href: '/blog/what-is-dream-mapping-rockwall', blurb: 'How Rockwall shoppers are skipping the guesswork' },
  { label: 'Your Sleep Position Is Telling You Something', href: '/blog/best-mattress-for-your-sleep-position', blurb: 'Side, back, stomach or combination sleeper' },
  { label: 'Myth or Fact? A Firmer Mattress Is Always Better for Your Back', href: '/blog/firm-vs-soft-mattress-myth', blurb: 'Comfort and support are not the same thing' },
  { label: 'Your Pillow Might Be the Reason Your Neck Hurts', href: '/blog/how-to-choose-the-right-pillow', blurb: 'Pillow height by sleep position' },
];
export const BLOG_NAV_ES: BlogNavItem[] = [
  { label: '¡Hola, Rockwall! Dormir mejor tiene un nuevo hogar junto al lago', href: '/blog/snooze-mattress-rockwall-gran-apertura', blurb: 'Conoce a tus nuevos expertos locales en sueño' },
  { label: '¿Qué es Dream Mapping?', href: '/blog/que-es-dream-mapping-rockwall', blurb: 'Así dejan de adivinar los compradores de Rockwall' },
  { label: 'Tu posición al dormir te está diciendo algo', href: '/blog/mejor-colchon-segun-tu-posicion-al-dormir', blurb: 'De lado, boca arriba, boca abajo o combinada' },
  { label: '¿Mito o realidad? Un colchón más firme siempre es mejor para tu espalda', href: '/blog/colchon-firme-vs-suave-mito', blurb: 'Confort y soporte no son lo mismo' },
  { label: 'Tu almohada podría ser la razón de tu dolor de cuello', href: '/blog/como-elegir-la-almohada-correcta', blurb: 'La altura de la almohada según tu posición al dormir' },
];

export const blogNav = (locale: Locale) => (locale === 'es' ? BLOG_NAV_ES : BLOG_NAV);
