import type { ReactNode } from 'react';

/* Renders a paragraph or list-item string with the small inline markup the articles use:
     [text](href)  → a real anchor (the link text may itself carry bold / italic)
     **text**      → <strong>
     _text_        → <em>
   Nothing else is parsed, so the article copy stays exactly as written. */
const TOKEN = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|_([^_]+)_/g;

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(TOKEN.source, 'g');
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${m.index}`;
    if (m[1] !== undefined) out.push(<a key={key} href={m[2]}>{inline(m[1], key)}</a>);
    else if (m[3] !== undefined) out.push(<strong key={key}>{inline(m[3], key)}</strong>);
    else out.push(<em key={key}>{m[4]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Rich({ text }: { text: string }) {
  return <>{inline(text, 'r')}</>;
}

/* Plain-text version (for schema.org and meta output). */
export const plain = (text: string) => text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/_([^_]+)_/g, '$1');
