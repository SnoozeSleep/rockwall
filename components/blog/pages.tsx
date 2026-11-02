/* Blog route bodies shared by the English (/blog) and Spanish (/es/blog) routes. */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogArticle, BlogCta, BlogShell, Divider, PostCard } from '@/components/blog/BlogLayout';
import { plain } from '@/components/blog/Rich';
import { SITE } from '@/components/site-config';
import styles from '@/components/blog/blog.module.css';
import { altBlogPath, byNewest, getPost, postsFor, relatedPosts, wordCountOf, type BlogPost } from '@/lib/blog-posts';
import { localizeHref, ui, type Locale } from '@/lib/i18n';
import { SITE_URL } from '@/lib/site-url';
const FAVICON = '/assets/filesafe/qR8peonBlnjGI3ZuLHQP/media/695b9e7d17768458ae206a19.png';
const OG_LOCALE: Record<Locale, string> = { en: 'en_US', es: 'es_US' };
const LANG: Record<Locale, string> = { en: 'en-US', es: 'es-US' };

const alternates = (path: string, locale: Locale) => ({
  canonical: localizeHref(path, locale),
  languages: { 'en-US': localizeHref(path, 'en'), 'es-US': localizeHref(path, 'es'), 'x-default': localizeHref(path, 'en') },
});
/* a post's alternates: its own path as canonical, the English and Spanish paths (which differ for the October 2026
   posts, BlogPost.altSlug) as en-US / es-US, the English one as x-default */
const postAlternates = (post: BlogPost, locale: Locale) => {
  const own = `/blog/${post.slug}`; const other = altBlogPath(post);
  const en = locale === 'en' ? own : other; const es = localizeHref(locale === 'es' ? own : other, 'es');
  return { canonical: localizeHref(own, locale), languages: { 'en-US': en, 'es-US': es, 'x-default': en } };
};

/* BlogPosting author: the company (client brief, November 2026); the publisher is the store (t.org) with the site logo */
const AUTHOR = { '@type': 'Organization', name: 'Snooze Mattress Company', url: 'https://snoozemattresscompany.com' } as const;

/* the site's Open Graph image, used while the blog has no post to take the newest featured image from */
const OG_IMAGE = '/assets/filesafe/BljrSmLCnm4gF9LpsTRZ/media/6a90ca4e747464c6b3a3be10.png.webp';

export function blogIndexMetadata(locale: Locale): Metadata {
  const t = ui(locale).blog;
  const posts = postsFor(locale);
  const image = posts[0]?.featured.src || OG_IMAGE;
  return {
    title: t.indexMetaTitle,
    description: t.indexMetaDesc,
    alternates: alternates('/blog', locale),
    openGraph: { type: 'website', title: t.indexMetaTitle, description: t.ogDesc, url: localizeHref('/blog', locale), locale: OG_LOCALE[locale], images: [image] },
    twitter: { card: 'summary_large_image', images: [image] },
    icons: { icon: FAVICON },
  };
}

export function BlogIndexPage({ locale }: { locale: Locale }) {
  const t = ui(locale).blog;
  const posts = [...postsFor(locale)].sort(byNewest); // newest first; same-day posts keep the document's order
  /* BreadcrumbList Home › Sleep Blog, like every other indexable page (Rockwall clone brief, October 31, 2026: sitewide) */
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t.home, item: `${SITE_URL}${localizeHref('/', locale)}` },
      { '@type': 'ListItem', position: 2, name: t.blogCrumb, item: `${SITE_URL}${localizeHref('/blog', locale)}` },
    ],
  };
  return (
    <BlogShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, '\\u003c') }} />
      <header className={styles.indexHero}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h1 className={styles.title}>{t.indexTitle}</h1>
          <p className={styles.indexIntro}>{t.indexIntro}</p>
          <Divider />
        </div>
      </header>
      <main className={`${styles.container} ${styles.indexGrid}`}>
        {posts.length ? (
          <div className={styles.cards}>
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} headingLevel="h2" locale={locale} />
            ))}
          </div>
        ) : (
          /* no articles yet (lib/blog-posts.ts): the empty state, then the showroom call to action */
          <p className={styles.empty}>{t.empty}</p>
        )}
        <BlogCta locale={locale} />
        <div style={{ height: 'clamp(48px, 6vw, 80px)' }} />
      </main>
    </BlogShell>
  );
}

export function postMetadata(slug: string, locale: Locale): Metadata {
  const post = getPost(slug, locale);
  if (!post) return {};
  const t = ui(locale).blog;
  const path = `/blog/${post.slug}`;
  const url = localizeHref(path, locale);
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: postAlternates(post, locale),
    openGraph: {
      type: 'article',
      title: post.metaTitle,
      description: post.metaDescription,
      url,
      locale: OG_LOCALE[locale],
      siteName: 'Snooze Mattress + Wellness',
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified || post.datePublished,
      authors: [AUTHOR.name],
      images: [{ url: post.featured.src, width: post.featured.width, height: post.featured.height, alt: post.featured.alt }],
    },
    twitter: { card: 'summary_large_image', title: post.metaTitle, description: post.metaDescription, images: [post.featured.src] },
    icons: { icon: FAVICON },
  };
}

export function PostPage({ slug, locale }: { slug: string; locale: Locale }) {
  const post = getPost(slug, locale);
  if (!post) notFound();
  const t = ui(locale).blog;
  const related = relatedPosts(post.slug, locale);
  const url = `${SITE_URL}${localizeHref(`/blog/${post.slug}`, locale)}`;
  const home = `${SITE_URL}${localizeHref('/', locale)}`;
  const wordCount = wordCountOf(post);

  /* FAQPage only when the post has FAQ sections (the November 2026 posts have none: no FAQ block is invented) */
  const faqPage = post.faqs.length
    ? [{
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        inLanguage: LANG[locale],
        mainEntity: post.faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: plain(f.answer) } })),
      }]
    : [];
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${url}#post`,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        url,
        headline: post.title,
        description: post.metaDescription,
        image: { '@type': 'ImageObject', url: `${SITE_URL}${post.featured.src}`, width: post.featured.width, height: post.featured.height },
        datePublished: post.datePublished,
        dateModified: post.dateModified || post.datePublished,
        author: AUTHOR,
        publisher: { '@type': 'Organization', name: t.org, url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}${SITE.logo}` } },
        keywords: post.keywords.join(', '),
        wordCount,
        articleSection: t.section,
        inLanguage: LANG[locale],
      },
      ...faqPage,
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t.home, item: home },
          { '@type': 'ListItem', position: 2, name: t.blogCrumb, item: `${SITE_URL}${localizeHref('/blog', locale)}` },
          { '@type': 'ListItem', position: 3, name: post.title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, '\\u003c') }} />
      <BlogArticle post={post} related={related} locale={locale} />
    </>
  );
}
