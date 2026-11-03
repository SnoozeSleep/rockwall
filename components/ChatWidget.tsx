import Script from 'next/script';
import { INTEGRATIONS } from '@/lib/integrations';

/**
 * The client's GoHighLevel chat widget (LeadConnector), one per page in the page's language: the English widget on every
 * page under app/(en), the Spanish one on every page under app/es (each root layout renders it once, never a page). The
 * snippet is the client's, verbatim (loader.js with data-resources-url and data-widget-id), through next/script with
 * strategy "lazyOnload": it is added once the page has loaded and the browser is idle, so it adds nothing to the critical
 * path or hydration, and once per page view (the root layout stays mounted across client-side navigations within a
 * language). Switching language is a full page load (the EN | ES links in the top bar and the mobile menu are plain <a>
 * elements, and each language has its own root layout), so every page starts with only its own language's widget. The
 * site does not style or position the widget: its position, look, copy and hours are managed in the client's CRM.
 * Widget ids: lib/integrations.json chatWidgetId (an empty id renders nothing, as for every integration there).
 */
export function ChatWidget({ locale }: { locale: 'en' | 'es' }) {
  const id = INTEGRATIONS.chatWidgetId[locale];
  if (!id) return null;
  return (
    <Script
      key={id}
      id="snz-chat-widget"
      src="https://widgets.leadconnectorhq.com/loader.js"
      data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
      data-widget-id={id}
      strategy="lazyOnload"
    />
  );
}
