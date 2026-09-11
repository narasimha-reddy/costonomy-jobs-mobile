import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

/**
 * Crash reporting (10-testing-cicd-seed-data.md).
 *
 * Off unless `EXPO_PUBLIC_SENTRY_DSN` is set, and always off in development, so
 * nothing leaves a laptop and a missing DSN is never an error.
 *
 * This audience's data is sensitive — who is looking for work, and where — so
 * reports carry no personal data: no default PII, user identified by id only,
 * phone numbers masked in messages, and query strings stripped from URLs, because
 * signed file URLs carry their credential there.
 */
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
export const monitoringEnabled = Boolean(DSN) && !__DEV__;

const PHONE = /\+?91[\s-]?[6-9]\d{4}[\s-]?\d{5}|\b[6-9]\d{9}\b/g;
const scrub = (text: string | undefined) => text?.replace(PHONE, '[phone]');
const stripQuery = (url: string | undefined) => url?.split('?')[0];

export function initMonitoring() {
  if (!monitoringEnabled) return;
  Sentry.init({
    dsn: DSN,
    environment: process.env.EXPO_PUBLIC_APP_ENV ?? 'production',
    release: Constants.expoConfig?.version,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.data?.url) breadcrumb.data.url = stripQuery(String(breadcrumb.data.url));
      if (breadcrumb.message) breadcrumb.message = scrub(breadcrumb.message);
      return breadcrumb;
    },
    beforeSend(event) {
      if (event.message) event.message = scrub(event.message);
      event.exception?.values?.forEach((v) => {
        v.value = scrub(v.value);
      });
      if (event.request) {
        delete event.request.data;
        event.request.url = stripQuery(event.request.url);
      }
      return event;
    },
  });
}

/** Reports carry the account id so repeat crashes group by person — never a name or number. */
export function identify(userId: number | null) {
  if (!monitoringEnabled) return;
  Sentry.setUser(userId == null ? null : { id: String(userId) });
}

export function wrapRoot(component: React.ComponentType<Record<string, unknown>>) {
  return monitoringEnabled ? Sentry.wrap(component) : component;
}
