import Image from 'next/image';
import type { ReactNode } from 'react';
import { SITE } from '@/components/site-config';
import { readTimeOf, type BlogBlock, type BlogPost, type BlogSection, type BlogTable } from '@/lib/blog-posts';
import { localizeHref, ui, type Locale } from '@/lib/i18n';
import { Faq } from './Faq';
import { Rich } from './Rich';
import { ArrowRightIcon, CheckItem } from '@/components/icons';
import styles from './blog.module.css';

/* Orange brush-stroke divider used under the site's own headings (same SVG as the GHL pages). */
export function Divider({ className }: { className?: string }) {
  return (
    <svg className={`${styles.divider} ${className || ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 430.89 17.62" aria-hidden="true" focusable="false">
      <path fill="#f58433" d="M427.53,6.47l-3.37-.21-6.73-.44C296.38-.75,175-1.39,53.88,2.07,36.2,2.67,17.6,3.39,0,4.47v.66c60.27.54,154.52,1,215.44,1.43,60.73.24,155.45.72,215.45.8V6.71l-3.36-.24" />
      <path fill="#f58433" d="M297.61,11c-23-.11-58.93.06-82.17.11s-59.28.4-82.16.74v.65l1.29.22,1.28.19c6,.92,12,1.58,18,2.16a671.21,671.21,0,0,0,123.25-.63c6.85-.74,13.73-1.57,20.52-2.8V11" />
    </svg>
  );
}

/* Shared page chrome for every blog page: local fonts and the continuous lavender background (the site footer comes from the root layout). */
export function BlogShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <link rel="stylesheet" precedence="default" href="/assets/gfonts-css/css2_family_Inter_3Awght_400..600_display_swap.css" />
      <link rel="stylesheet" precedence="default" href="/assets/gfonts-css/css2_family_Poppins_3Awght_400_500_600_700_display_swap.css" />
      <link rel="stylesheet" precedence="default" href="/assets/gfonts-css/css2_family_Montserrat_3Awght_400_500_600_700_800_900_display_swap.css" />
      {children}
    </div>
  );
}

function Meta({ post, byline, locale = 'en' }: { post: BlogPost; byline: string; locale?: Locale }) {
  return (
    <div className={styles.meta}>
      <span className={styles.byline}>{byline}</span>
      <span aria-hidden="true" className={styles.metaDot}>•</span>
      <span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
        <time dateTime={post.datePublished}>{post.dateDisplay}</time>
      </span>
      <span aria-hidden="true" className={styles.metaDot}>•</span>
      <span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        {readTimeOf(post, locale)}
      </span>
    </div>
  );
}

function DataTable({ table }: { table: BlogTable }) {
  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          {table.caption && <caption>{table.caption}</caption>}
          <thead><tr>{table.head.map((h, k) => <th key={k} scope="col">{h}</th>)}</tr></thead>
          <tbody>{table.rows.map((r, k) => <tr key={k}>{r.map((cell, m) => (m === 0 ? <th key={m} scope="row">{cell}</th> : <td key={m}>{cell}</td>))}</tr>)}</tbody>
        </table>
      </div>
      {table.note && <p className={styles.tableNote}>{table.note}</p>}
    </>
  );
}

/* A section's content in the order written: `blocks` (paragraphs, h3 sub-headings, check-icon or numbered lists,
   tables) when the post uses them, otherwise the paragraphs followed by the table. Check lists reuse the site's
   inline SVG check (components/icons CheckItem, styled by .snz-check-list in overrides/global.css): no emoji, no icon font. */
function SectionBody({ s }: { s: BlogSection }) {
  const blocks: BlogBlock[] = s.blocks || [...s.paragraphs.map((p) => ({ p })), ...(s.table ? [{ table: s.table }] : [])];
  return (
    <>
      {blocks.map((b, j) => {
        if ('p' in b) return <p key={j} className={styles.p}><Rich text={b.p} /></p>;
        if ('h3' in b) return <h3 key={j} className={styles.h3}>{b.h3}</h3>;
        if ('table' in b) return <DataTable key={j} table={b.table} />;
        if (b.list.style === 'number') return <ol key={j} className={styles.olist}>{b.list.items.map((it, k) => <li key={k}><Rich text={it} /></li>)}</ol>;
        return <ul key={j} className={`${styles.list} snz-check-list`}>{b.list.items.map((it, k) => <CheckItem key={k}><Rich text={it} /></CheckItem>)}</ul>;
      })}
    </>
  );
}

export function PostCard({ post, headingLevel = 'h3', locale = 'en' }: { post: BlogPost; headingLevel?: 'h2' | 'h3'; locale?: Locale }) {
  const H = headingLevel;
  const t = ui(locale).blog;
  const href = localizeHref(`/blog/${post.slug}`, locale);
  return (
    <article className={styles.card}>
      <a href={href} className={styles.cardImg} tabIndex={-1} aria-hidden="true">
        <Image src={post.featured.src} alt={post.featured.alt} width={post.featured.width} height={post.featured.height} sizes="(max-width: 720px) 100vw, 33vw" />
      </a>
      <div className={styles.cardBody}>
        <Meta post={post} byline={t.byline} locale={locale} />
        <H className={styles.cardTitle}>
          <a href={href}>{post.title}</a>
        </H>
        <p className={styles.cardExcerpt}>{post.excerpt}</p>
        <a href={href} className={styles.cardMore} aria-label={t.read(post.title)}>
          {t.readArticle} <ArrowRightIcon />
        </a>
      </div>
    </article>
  );
}

export function BlogCta({ locale = 'en' }: { locale?: Locale }) {
  const t = ui(locale).blog;
  return (
    <section className={styles.cta} aria-labelledby="blog-cta-title">
      <div className={styles.ctaGlow} aria-hidden="true" />
      <p className={styles.ctaEyebrow}>{t.ctaEyebrow}</p>
      <h2 id="blog-cta-title" className={styles.ctaTitle}>{t.ctaTitle}</h2>
      <p className={styles.ctaText}>{t.ctaText}</p>
      <div className={styles.ctaBtns}>
        <a href={localizeHref('/booking', locale)} className={styles.btn}>{t.ctaBook}</a>
        <a href={SITE.phoneHref} className={`${styles.btn} ${styles.btnGhost}`}>{t.ctaCall(SITE.phone)}</a>
      </div>
      <p className={styles.ctaAddr}>{t.ctaAddr}</p>
    </section>
  );
}

/* The showroom band ("Visit Our Showroom" · Get Dream Mapped → /booking · call · NAP) on a page outside the blog
   (/about-us, November 2026): the same BlogCta inside the site container, with the blog's colour tokens. */
export function ShowroomCtaBand({ locale = 'en' }: { locale?: Locale }) {
  return (
    <div className={styles.ctaBand}>
      <div className={styles.container}>
        <BlogCta locale={locale} />
      </div>
    </div>
  );
}

/* Sleep Fit Quiz call to action: after the article body, before the showroom CTA and the related posts. */
export function QuizCta({ locale = 'en' }: { locale?: Locale }) {
  const t = ui(locale).quizCta;
  return (
    <section className={styles.quizCta} aria-label={t.aria} data-animate="fade-up">
      <p className={styles.quizCtaLine}>{t.line}</p>
      <a href={localizeHref('/sleep-quiz', locale)} className={styles.btn}>{t.button} <ArrowRightIcon /></a>
    </section>
  );
}

export function BlogArticle({ post, related, locale = 'en' }: { post: BlogPost; related: BlogPost[]; locale?: Locale }) {
  const t = ui(locale).blog;
  return (
    <BlogShell>
      <header className={styles.hero}>
        <div className={styles.container}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <a href={localizeHref('/', locale)}>{t.home}</a>
            <span aria-hidden="true">/</span>
            <a href={localizeHref('/blog', locale)}>{t.blogCrumb}</a>
          </nav>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h1 className={styles.title}>{post.title}</h1>
          <Meta post={post} byline={t.byline} locale={locale} />
          <Divider />
        </div>
      </header>

      <figure className={post.featuredFit === 'contain' ? `${styles.featured} ${styles.featuredContain}` : styles.featured}>
        <Image src={post.featured.src} alt={post.featured.alt} width={post.featured.width} height={post.featured.height} sizes="(max-width: 1100px) 100vw, 1040px" priority />
      </figure>

      {/* the light content block: the shared typography applies inside it (overrides/global.css, scoped) */}
      <main className={`${styles.article} content-light`} id="article">
        {post.sections.map((s, i) => (
          <section key={i} className={styles.section}>
            {s.heading && <h2 className={styles.h2}>{s.heading}</h2>}
            <SectionBody s={s} />
            {s.image && (
              <figure className={styles.figure}>
                <Image src={s.image.src} alt={s.image.alt} width={s.image.width} height={s.image.height} sizes="(max-width: 820px) 100vw, 780px" loading="lazy" />
                {s.image.caption && <figcaption>{s.image.caption}</figcaption>}
              </figure>
            )}
          </section>
        ))}

        {/* the client's closing line ("Stop Guessing. Start Sleeping."): a styled paragraph, not a heading */}
        {post.tagline && <p className={styles.tagline}>{post.tagline}</p>}

        {post.faqs.length ? (
          <section className={styles.faq} aria-labelledby="faq-title">
            <h2 id="faq-title" className={styles.h2}>{t.faq}</h2>
            <Faq items={post.faqs} />
          </section>
        ) : null}

        {post.visit && (
          <section className={styles.visit} aria-labelledby="visit-title">
            <h2 id="visit-title" className={styles.h2}>{post.visit.heading}</h2>
            <div className={styles.visitCard}>
              {post.visit.lines.map((l, i) => <p key={i} className={styles.visitLine}><Rich text={l} /></p>)}
              {post.visit.fine && <p className={styles.fine}>{post.visit.fine}</p>}
            </div>
          </section>
        )}

        {post.sources?.length ? (
          <section className={styles.sources} aria-labelledby="sources-title">
            <h2 id="sources-title" className={styles.h2}>{t.sources}</h2>
            <ol className={styles.sourceList}>
              {post.sources.map((src) => (
                <li key={src.href}><a href={src.href} target="_blank" rel="noopener noreferrer">{src.label}</a></li>
              ))}
            </ol>
          </section>
        ) : null}
      </main>

      <div className={styles.container}>
        <QuizCta locale={locale} />
        <BlogCta locale={locale} />
        <section className={styles.related} aria-labelledby="related-title">
          <h2 id="related-title" className={styles.h2Center}>{t.related}</h2>
          <div className={styles.cards}>
            {related.map((r) => (
              <PostCard key={r.slug} post={r} locale={locale} />
            ))}
          </div>
        </section>
      </div>
    </BlogShell>
  );
}
