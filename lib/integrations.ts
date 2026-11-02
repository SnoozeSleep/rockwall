/* Typed view of lib/integrations.json: the third-party ids of the Rockwall store, every one a placeholder until the
   client supplies it. An empty string (or empty list) disables the integration: the component renders nothing and makes
   no request. The JSON is the single place to edit; the scripts (scripts/integrations.mjs, scripts/reviews-cta.mjs)
   read the same file. */
import data from './integrations.json';

export type Integrations = {
  /** Google Tag Manager container id */
  gtmId: string;
  /** Google Analytics 4 measurement ids (gtag.js), one loader + config each */
  ga4Ids: string[];
  /** Simpli.fi tag id (tag.simpli.fi/sifitag/<id>) */
  simplifiId: string;
  /** [ROCKWALL_CHAT_EN] / [ROCKWALL_CHAT_ES] LeadConnector chat widget id per language */
  chatWidgetId: { en: string; es: string };
  /** [ROCKWALL_QUIZ_WEBHOOK] inbound webhook URL for the Sleep Fit Quiz lead */
  quizWebhookUrl: string;
  /** [ROCKWALL_CALENDAR_URL] the Dream Mapping booking calendar id */
  calendarId: string;
  /** [ROCKWALL_FORM_ID] the contact (opt-in) form id */
  formId: string;
  /** [ROCKWALL_REVIEWS_WIDGET] the LeadConnector reviews widget */
  reviewsWidget: { locationId: string; widgetId: string };
};

const d = data as Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
export const INTEGRATIONS: Integrations = {
  gtmId: str(d.gtmId),
  ga4Ids: Array.isArray(d.ga4Ids) ? (d.ga4Ids as unknown[]).map(str).filter(Boolean) : [],
  simplifiId: str(d.simplifiId),
  chatWidgetId: { en: str((d.chatWidgetId as Record<string, unknown> | undefined)?.en), es: str((d.chatWidgetId as Record<string, unknown> | undefined)?.es) },
  quizWebhookUrl: str(d.quizWebhookUrl),
  calendarId: str(d.calendarId),
  formId: str(d.formId),
  reviewsWidget: { locationId: str((d.reviewsWidget as Record<string, unknown> | undefined)?.locationId), widgetId: str((d.reviewsWidget as Record<string, unknown> | undefined)?.widgetId) },
};
