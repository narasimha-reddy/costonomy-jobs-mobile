import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StatusBadge, type StatusBadgeSize } from './StatusBadge';
import {
  APPLICATION_STATUS_DISPLAY,
  CHECKIN_STATUS_DISPLAY,
  INTERVIEW_STATUS_DISPLAY,
  JOB_STATUS_DISPLAY,
  OFFER_STATUS_DISPLAY,
  type StatusDisplay,
} from '@/lib/status-display';
import type {
  ApplicationStatus,
  CheckInStatus,
  InterviewStatus,
  JobStatus,
  OfferStatus,
} from '@/constants/colors';

/**
 * Badges bound to a backend status enum.
 *
 * Screens use these rather than the generic `StatusBadge` so that colour, icon
 * and wording for a given status are decided once, in `lib/status-display.ts`,
 * and can't drift between the employee timeline, the restaurant kanban and a
 * notification row.
 *
 * `label` is an override for the (rare) place a status needs contextual
 * wording — e.g. the restaurant sees "Not selected" as "Rejected". Leave it
 * unset and the shared copy is used.
 */
interface DomainBadgeProps {
  label?: string;
  size?: StatusBadgeSize;
  style?: StyleProp<ViewStyle>;
}

function render(d: StatusDisplay, props: DomainBadgeProps, solid = false) {
  return (
    <StatusBadge
      label={props.label ?? d.fallbackLabel}
      token={d.token}
      icon={d.icon}
      size={props.size}
      solid={solid}
      style={props.style}
    />
  );
}

export function ApplicationStatusBadge({
  status,
  ...props
}: DomainBadgeProps & { status: ApplicationStatus }) {
  // JOINED is the only solid badge in the app — see StatusBadge's `solid` prop.
  return render(APPLICATION_STATUS_DISPLAY[status], props, status === 'JOINED');
}

export function InterviewStatusBadge({
  status,
  ...props
}: DomainBadgeProps & { status: InterviewStatus }) {
  return render(INTERVIEW_STATUS_DISPLAY[status], props);
}

export function OfferStatusBadge({
  status,
  ...props
}: DomainBadgeProps & { status: OfferStatus }) {
  return render(OFFER_STATUS_DISPLAY[status], props);
}

export function JobStatusBadge({ status, ...props }: DomainBadgeProps & { status: JobStatus }) {
  return render(JOB_STATUS_DISPLAY[status], props);
}

/** Restaurant/admin surfaces only — see the note on `CHECKIN_STATUS_DISPLAY`. */
export function CheckInStatusBadge({
  status,
  ...props
}: DomainBadgeProps & { status: CheckInStatus }) {
  return render(CHECKIN_STATUS_DISPLAY[status], props);
}
