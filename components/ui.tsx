/* The shared typography components (client brief, November 2026; scoped after the revert of 7130686): section headings,
   lead-in lines, body copy, check-icon lists, two-column blocks and the two-line call-to-action button. They only emit
   classes; the scoped typography block in overrides/global.css styles them inside a light content block that carries
   the wrapper class `content-light` (the ContentPage article, the booking page's visit section, the blog article) and
   nowhere else. They set size, weight, line-height and spacing: text and heading colours come from the section. */
import type { ReactNode } from 'react';
import { CheckItem } from '@/components/icons';

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/** a page band with the shared vertical padding; `container` wraps the children at the 1200px measure */
export function Section({ children, className, container = true, ...rest }: { children: ReactNode; className?: string; container?: boolean } & Omit<React.HTMLAttributes<HTMLElement>, 'className' | 'children'>) {
  return (
    <section className={cx('snz-section', className)} {...rest}>
      {container ? <div className="snz-container">{children}</div> : children}
    </section>
  );
}

/** section heading (h2 by default): black, with the key phrase in orange through `accent` or an inline <span className="snz-accent"> */
export function SectionHeading({ children, accent, as: Tag = 'h2', center, light, className, id }: { children: ReactNode; accent?: string; as?: 'h1' | 'h2' | 'h3'; center?: boolean; light?: boolean; className?: string; id?: string }) {
  return (
    <Tag id={id} className={cx('snz-h2', center && 'snz-h2--center', light && 'snz-h2--light', className)}>
      {children}
      {accent ? <> <span className="snz-accent">{accent}</span></> : null}
    </Tag>
  );
}

/** the line that introduces a list ("Qualified buyers may access:") */
export function LeadIn({ children, light, className }: { children: ReactNode; light?: boolean; className?: string }) {
  return <p className={cx('snz-lead', light && 'snz-lead--light', className)}>{children}</p>;
}

/** body copy between lists */
export function BodyText({ children, light, className }: { children: ReactNode; light?: boolean; className?: string }) {
  return <p className={cx('snz-body', light && 'snz-body--light', className)}>{children}</p>;
}

/** check-icon list: one orange outline check per item (components/icons CheckItem), text wrapping under itself */
export function CheckList({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <ul className={cx('snz-check-list', className)}>
      {items.map((item, i) => <CheckItem key={i}>{item}</CheckItem>)}
    </ul>
  );
}

/** image + text, 45 / 55, vertically centred; stacks image-first on phones */
export function TwoColumn({ media, children, className }: { media: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cx('snz-two-col', className)}>
      <div className="snz-two-col__media">{media}</div>
      <div className="snz-two-col__text">{children}</div>
    </div>
  );
}

/** the two-line call-to-action button ("YES! BOOK MY DREAM MAPPING APPOINTMENT NOW!" / "Get it now!") */
export function CtaButton({ href, main, sub, className, ...rest }: { href: string; main: ReactNode; sub?: ReactNode; className?: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'>) {
  return (
    <a href={href} className={cx('snz-cta-btn', className)} {...rest}>
      <span className="snz-cta-btn__main">{main}</span>
      {sub ? <span className="snz-cta-btn__sub">{sub}</span> : null}
    </a>
  );
}
