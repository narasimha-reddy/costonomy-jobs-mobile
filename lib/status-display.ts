import type Ionicons from '@expo/vector-icons/Ionicons';
import {
  ApplicationStatusColors,
  CheckInStatusColors,
  InterviewStatusColors,
  JobStatusColors,
  OfferStatusColors,
  type ApplicationStatus,
  type CheckInStatus,
  type InterviewStatus,
  type JobStatus,
  type OfferStatus,
  type StatusToken,
} from '@/constants/colors';

/**
 * The single place a backend status enum turns into something a human sees.
 *
 * Every entry carries three things:
 *
 *   `token`        — colour, from `constants/colors`, which in turn tracks the
 *                    state machines in `03-state-machines-permissions.md`.
 *   `icon`         — an Ionicon, so the badge survives colour-blindness and
 *                    greyscale screenshots.
 *   `labelKey`     — the i18n key (07-localization §3's `{surface}.{screen}.{element}`
 *                    convention). `en.json`/`hi.json` own the actual words.
 *   `fallbackLabel`— the English string, used until the locale bundle loads and
 *                    as the last-resort fallback if a key is missing. It is the
 *                    same text `en.json` will hold, not a placeholder.
 *
 * Adding a status to the backend without adding it here is a compile error, not
 * a blank badge: each map is keyed by the enum's own union type.
 */
export interface StatusDisplay {
  token: StatusToken;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  fallbackLabel: string;
}

export const APPLICATION_STATUS_DISPLAY: Record<ApplicationStatus, StatusDisplay> = {
  APPLIED: {
    token: ApplicationStatusColors.APPLIED,
    icon: 'paper-plane-outline',
    labelKey: 'employee.applicationStatus.APPLIED',
    fallbackLabel: 'Applied',
  },
  VIEWED: {
    token: ApplicationStatusColors.VIEWED,
    icon: 'eye-outline',
    labelKey: 'employee.applicationStatus.VIEWED',
    fallbackLabel: 'Viewed',
  },
  SHORTLISTED: {
    token: ApplicationStatusColors.SHORTLISTED,
    icon: 'bookmark',
    labelKey: 'employee.applicationStatus.SHORTLISTED',
    fallbackLabel: 'Shortlisted',
  },
  INTERVIEW: {
    token: ApplicationStatusColors.INTERVIEW,
    icon: 'calendar',
    labelKey: 'employee.applicationStatus.INTERVIEW',
    fallbackLabel: 'Interview',
  },
  SELECTED: {
    token: ApplicationStatusColors.SELECTED,
    icon: 'ribbon',
    labelKey: 'employee.applicationStatus.SELECTED',
    fallbackLabel: 'Selected',
  },
  OFFERED: {
    token: ApplicationStatusColors.OFFERED,
    icon: 'mail-open',
    labelKey: 'employee.applicationStatus.OFFERED',
    fallbackLabel: 'Offered',
  },
  OFFER_ACCEPTED: {
    token: ApplicationStatusColors.OFFER_ACCEPTED,
    icon: 'checkmark-done',
    labelKey: 'employee.applicationStatus.OFFER_ACCEPTED',
    fallbackLabel: 'Offer accepted',
  },
  JOINED: {
    token: ApplicationStatusColors.JOINED,
    icon: 'trophy',
    labelKey: 'employee.applicationStatus.JOINED',
    fallbackLabel: 'Joined',
  },
  DID_NOT_JOIN: {
    token: ApplicationStatusColors.DID_NOT_JOIN,
    icon: 'remove-circle',
    labelKey: 'employee.applicationStatus.DID_NOT_JOIN',
    fallbackLabel: 'Did not join',
  },
  REJECTED: {
    token: ApplicationStatusColors.REJECTED,
    icon: 'close-circle',
    labelKey: 'employee.applicationStatus.REJECTED',
    fallbackLabel: 'Not selected',
  },
  WITHDRAWN: {
    token: ApplicationStatusColors.WITHDRAWN,
    icon: 'arrow-undo',
    labelKey: 'employee.applicationStatus.WITHDRAWN',
    fallbackLabel: 'Withdrawn',
  },
};

/**
 * The ordered pipeline, for the `ApplicationDetail` timeline and the restaurant
 * kanban. Terminal states (`REJECTED`, `WITHDRAWN`) are **not** in this list:
 * they replace the timeline rather than appearing as a step in it.
 */
export const APPLICATION_PIPELINE: readonly ApplicationStatus[] = [
  'APPLIED',
  'VIEWED',
  'SHORTLISTED',
  'INTERVIEW',
  'SELECTED',
  'OFFERED',
  'OFFER_ACCEPTED',
  'JOINED',
] as const;

export const TERMINAL_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  'JOINED',
  'DID_NOT_JOIN',
  'REJECTED',
  'WITHDRAWN',
] as const;

export function isTerminalApplicationStatus(status: ApplicationStatus): boolean {
  return TERMINAL_APPLICATION_STATUSES.includes(status);
}

export const INTERVIEW_STATUS_DISPLAY: Record<InterviewStatus, StatusDisplay> = {
  PROPOSED: {
    token: InterviewStatusColors.PROPOSED,
    icon: 'help-circle',
    labelKey: 'shared.interviewStatus.PROPOSED',
    fallbackLabel: 'Awaiting your reply',
  },
  CONFIRMED: {
    token: InterviewStatusColors.CONFIRMED,
    icon: 'checkmark-circle',
    labelKey: 'shared.interviewStatus.CONFIRMED',
    fallbackLabel: 'Confirmed',
  },
  RESCHEDULED: {
    token: InterviewStatusColors.RESCHEDULED,
    icon: 'refresh-circle',
    labelKey: 'shared.interviewStatus.RESCHEDULED',
    fallbackLabel: 'Rescheduled',
  },
  CANCELLED: {
    token: InterviewStatusColors.CANCELLED,
    icon: 'close-circle-outline',
    labelKey: 'shared.interviewStatus.CANCELLED',
    fallbackLabel: 'Cancelled',
  },
  COMPLETED: {
    token: InterviewStatusColors.COMPLETED,
    icon: 'checkmark-done-circle',
    labelKey: 'shared.interviewStatus.COMPLETED',
    fallbackLabel: 'Completed',
  },
  NO_SHOW: {
    token: InterviewStatusColors.NO_SHOW,
    icon: 'alert-circle',
    labelKey: 'shared.interviewStatus.NO_SHOW',
    fallbackLabel: 'No show',
  },
};

export const OFFER_STATUS_DISPLAY: Record<OfferStatus, StatusDisplay> = {
  DRAFT: {
    token: OfferStatusColors.DRAFT,
    icon: 'document-outline',
    labelKey: 'shared.offerStatus.DRAFT',
    fallbackLabel: 'Draft',
  },
  SENT: {
    token: OfferStatusColors.SENT,
    icon: 'mail-open',
    labelKey: 'shared.offerStatus.SENT',
    fallbackLabel: 'Offer sent',
  },
  ACCEPTED: {
    token: OfferStatusColors.ACCEPTED,
    icon: 'checkmark-circle',
    labelKey: 'shared.offerStatus.ACCEPTED',
    fallbackLabel: 'Accepted',
  },
  DECLINED: {
    token: OfferStatusColors.DECLINED,
    icon: 'close-circle',
    labelKey: 'shared.offerStatus.DECLINED',
    fallbackLabel: 'Declined',
  },
  EXPIRED: {
    token: OfferStatusColors.EXPIRED,
    icon: 'time-outline',
    labelKey: 'shared.offerStatus.EXPIRED',
    fallbackLabel: 'Expired',
  },
  CANCELLED: {
    token: OfferStatusColors.CANCELLED,
    icon: 'close-circle-outline',
    labelKey: 'shared.offerStatus.CANCELLED',
    fallbackLabel: 'Cancelled',
  },
};

export const JOB_STATUS_DISPLAY: Record<JobStatus, StatusDisplay> = {
  DRAFT: {
    token: JobStatusColors.DRAFT,
    icon: 'document-outline',
    labelKey: 'restaurant.jobStatus.DRAFT',
    fallbackLabel: 'Draft',
  },
  OPEN: {
    token: JobStatusColors.OPEN,
    icon: 'radio-button-on',
    labelKey: 'restaurant.jobStatus.OPEN',
    fallbackLabel: 'Open',
  },
  PAUSED: {
    token: JobStatusColors.PAUSED,
    icon: 'pause-circle',
    labelKey: 'restaurant.jobStatus.PAUSED',
    fallbackLabel: 'Paused',
  },
  FILLED: {
    token: JobStatusColors.FILLED,
    icon: 'people',
    labelKey: 'restaurant.jobStatus.FILLED',
    fallbackLabel: 'Filled',
  },
  CLOSED: {
    token: JobStatusColors.CLOSED,
    icon: 'lock-closed-outline',
    labelKey: 'restaurant.jobStatus.CLOSED',
    fallbackLabel: 'Closed',
  },
  EXPIRED: {
    token: JobStatusColors.EXPIRED,
    icon: 'time-outline',
    labelKey: 'restaurant.jobStatus.EXPIRED',
    fallbackLabel: 'Expired',
  },
};

/**
 * Check-in verification, as shown to a **restaurant or admin** user.
 *
 * There is deliberately no employee-facing variant of this map. Per PRD §9.9
 * and 05-mobile-screens, the candidate sees a plain "Checked in" confirmation
 * whatever the verification came back as — a GPS quirk in a mall basement must
 * not produce an accusatory badge on the phone of the person standing in it.
 */
export const CHECKIN_STATUS_DISPLAY: Record<CheckInStatus, StatusDisplay> = {
  WITHIN_RANGE: {
    token: CheckInStatusColors.WITHIN_RANGE,
    icon: 'location',
    labelKey: 'restaurant.checkinStatus.WITHIN_RANGE',
    fallbackLabel: 'At the outlet',
  },
  OUT_OF_RANGE: {
    token: CheckInStatusColors.OUT_OF_RANGE,
    icon: 'navigate-outline',
    labelKey: 'restaurant.checkinStatus.OUT_OF_RANGE',
    fallbackLabel: 'Away from outlet',
  },
  LOW_ACCURACY: {
    token: CheckInStatusColors.LOW_ACCURACY,
    icon: 'help-circle-outline',
    labelKey: 'restaurant.checkinStatus.LOW_ACCURACY',
    fallbackLabel: 'Weak GPS signal',
  },
  MOCK_LOCATION_SUSPECTED: {
    token: CheckInStatusColors.MOCK_LOCATION_SUSPECTED,
    icon: 'warning',
    labelKey: 'restaurant.checkinStatus.MOCK_LOCATION_SUSPECTED',
    fallbackLabel: 'Needs review',
  },
  OUTSIDE_WINDOW: {
    token: CheckInStatusColors.OUTSIDE_WINDOW,
    icon: 'time-outline',
    labelKey: 'restaurant.checkinStatus.OUTSIDE_WINDOW',
    fallbackLabel: 'Outside check-in window',
  },
  MANUAL_OVERRIDE: {
    token: CheckInStatusColors.MANUAL_OVERRIDE,
    icon: 'shield-checkmark',
    labelKey: 'restaurant.checkinStatus.MANUAL_OVERRIDE',
    fallbackLabel: 'Reviewed and cleared',
  },
};
