import type { Metadata } from 'next';
import Script from 'next/script';
import type { Locale } from '@/lib/i18n';
import { PageSchema } from './PageSchema';
import { INTEGRATIONS } from '@/lib/integrations';
import './sleep-quiz/sleep-fit-quiz.css';

/* The Snooze Sleep Fit Quiz as a site page (/sleep-quiz, /es/sleep-quiz), hand-written like the booking page
   (scripts/convert.mjs keeps app/(en)/sleep-quiz and app/es/sleep-quiz on regeneration).

   The quiz is the client's single-store build (sleep-fit-quiz.html): this component renders its shell — the
   progress bar and the #view the screens are drawn into — inside the site's normal header and footer; the quiz's
   own top bar and © line are not needed. Styles are the quiz's own stylesheet scoped under .snz-quiz
   (components/sleep-quiz/sleep-fit-quiz.css). The quiz logic is public/sleep-fit-quiz.js, loaded after hydration
   so React never re-renders the subtree the quiz mutates; it reads the language from data-lang and sends the
   lead to the Rockwall GoHighLevel inbound webhook ([ROCKWALL_QUIZ_WEBHOOK] in lib/integrations.json, passed in as window.__snzQuizWebhook). */

const SITE_URL = 'https://rockwall.snoozemattresscompany.com';
const FAVICON = '/assets/filesafe/qR8peonBlnjGI3ZuLHQP/media/695b9e7d17768458ae206a19.png';
const OG_IMAGE = '/assets/filesafe/BljrSmLCnm4gF9LpsTRZ/media/6a90ca4e747464c6b3a3be10.png.webp';
export const QUIZ_SCRIPT = '/sleep-fit-quiz.js?v=4';

const META: Record<Locale, { title: string; description: string; ogLocale: string; noscript: string }> = {
  en: {
    title: 'Sleep Fit Quiz in Rockwall, TX | Snooze Mattress',
    description: 'Answer 5 quick questions about how you sleep and find the comfort level, support level and mattress features your body needs. Free, in 60 seconds.',
    ogLocale: 'en_US',
    noscript: 'The Sleep Fit Quiz needs JavaScript. Call (469) 769-1300 or visit Snooze Mattress + Wellness at 919 E Interstate 30, Suite 101, Rockwall, TX 75032 and we will find your fit in person.',
  },
  es: {
    title: 'Sleep Fit Quiz en Rockwall, TX | Snooze Mattress',
    description: 'Responde 5 preguntas rápidas sobre cómo duermes y descubre la comodidad, el soporte y las características de colchón que necesitas. Gratis, 60 segundos.',
    ogLocale: 'es_US',
    noscript: 'El Sleep Fit Quiz necesita JavaScript. Llama al (469) 769-1300 o visita Snooze Mattress + Wellness en 919 E Interstate 30, Suite 101, Rockwall, TX 75032 y encontraremos tu ajuste en persona.',
  },
};

/* Results links carry ?r=<answers>; the canonical is the bare page in both languages, so shared results are not
   indexed as separate URLs. */
export function sleepQuizMetadata(locale: Locale): Metadata {
  const m = META[locale] || META.en;
  const path = locale === 'es' ? '/es/sleep-quiz' : '/sleep-quiz';
  return {
    title: m.title,
    description: m.description,
    robots: 'index, follow',
    alternates: { canonical: path, languages: { 'en-US': '/sleep-quiz', 'es-US': '/es/sleep-quiz', 'x-default': '/sleep-quiz' } },
    openGraph: { title: m.title, description: m.description, url: path, type: 'website', locale: m.ogLocale, siteName: 'Snooze Mattress + Wellness', images: [`${SITE_URL}${OG_IMAGE}`] },
    twitter: { card: 'summary_large_image', title: m.title, description: m.description, images: [`${SITE_URL}${OG_IMAGE}`] },
    icons: { icon: FAVICON },
  };
}

/* BreadcrumbList Home › Sleep Fit Quiz, like every other indexable page (Rockwall clone brief, October 31, 2026: sitewide) */
const breadcrumbSchema = (locale: Locale) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: locale === 'es' ? 'Inicio' : 'Home', item: locale === 'es' ? `${SITE_URL}/es` : SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Sleep Fit Quiz', item: `${SITE_URL}${locale === 'es' ? '/es' : ''}/sleep-quiz` },
  ],
});

export function SleepQuiz({ locale = 'en' }: { locale?: Locale }) {
  const m = META[locale] || META.en;
  return (
    <>
      <PageSchema items={[breadcrumbSchema(locale)]} />
      <div className="snz-quiz" id="snz-quiz" data-lang={locale}>
        <div className="sfq" id="sfq" data-animate="fade-up">
          <div id="progressWrap" hidden>
            <div className="progress"><span id="progressBar" /></div>
            <div className="progress-label" id="progressLabel" />
          </div>
          <main id="view" aria-live="polite">
            <noscript>
              <p className="hint">{m.noscript}</p>
            </noscript>
          </main>
        </div>
      </div>
      {/* [ROCKWALL_QUIZ_WEBHOOK] (lib/integrations.json): the quiz script reads window.__snzQuizWebhook; empty = the lead is not sent */}
      <script dangerouslySetInnerHTML={{ __html: `window.__snzQuizWebhook=${JSON.stringify(INTEGRATIONS.quizWebhookUrl)};` }} />
      <Script src={QUIZ_SCRIPT} strategy="afterInteractive" />
    </>
  );
}
