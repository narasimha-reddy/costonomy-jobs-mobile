import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { ApplicationStatusBadge, Avatar, Button, StatusTimeline } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { Section } from '@/components/app/Controls';
import { InterviewCard, OfferCard } from '@/components/app/HiringCards';
import { ConfirmSheet, ErrorView, Loading, toast } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api, type ApplicationStatusCode } from '@/lib/api';
import { dateTimeLabel } from '@/lib/format';
import { keys, useApplicationInterviews, useApplicationOffer, useMyApplication } from '@/lib/queries';
import { isTerminalApplicationStatus } from '@/lib/status-display';
import type { ApplicationStatus } from '@/constants/colors';

/**
 * The one screen a candidate returns to: where this application stands, what
 * happens next, and — once they exist — the interview to confirm and the offer to
 * answer, right here rather than hidden behind a notification.
 */
export default function ApplicationDetail() {
  const { t, tx } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const applicationId = Number(id);
  const queryClient = useQueryClient();
  const query = useMyApplication(applicationId);
  const application = query.data;
  const reached = (s: ApplicationStatusCode) => application?.timeline.some((e) => e.status === s) ?? false;
  const interviews = useApplicationInterviews(applicationId, reached('INTERVIEW')).data ?? [];
  const offer = useApplicationOffer(applicationId, reached('OFFERED')).data;
  const [withdrawing, setWithdrawing] = useState(false);

  if (query.isLoading) return <Loading />;
  if (!application) return <ErrorView error={query.error} onRetry={() => query.refetch()} />;

  const entries = Object.fromEntries(
    application.timeline.map((e) => [e.status, { timestamp: dateTimeLabel(e.at) }]),
  ) as Partial<Record<ApplicationStatus, { timestamp: string }>>;
  const rejectReason = [...application.timeline].reverse().find((e) => e.status === application.status)?.reason ?? undefined;
  const terminal = isTerminalApplicationStatus(application.status);

  return (
    <Screen
      header={<Header title={t('application.title')} />}
      tone="tinted"
      refreshing={query.isRefetching}
      onRefresh={() => {
        void query.refetch();
        void queryClient.invalidateQueries({ queryKey: ['applications', applicationId] });
      }}
    >
      <TouchableOpacity onPress={() => router.push(`/jobs/${application.jobId}`)} activeOpacity={PRESS_OPACITY} style={styles.jobCard}>
        <Avatar name={application.restaurantName} uri={application.logoUrl} size="lg" shape="rounded" />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="heading">{application.jobTitle}</Txt>
          <Txt variant="caption" color={Colors.textSecondary}>
            {[application.restaurantName, application.outletName].filter(Boolean).join(' · ')}
          </Txt>
          <View style={{ alignSelf: 'flex-start', marginTop: 6 }}>
            <ApplicationStatusBadge status={application.status} />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.next}>
        <Txt variant="body">{tx(`application.next.${application.status}`, '')}</Txt>
      </View>

      {offer != null && (
        <Section title={t('offer.title')}>
          <OfferCard offer={offer} />
        </Section>
      )}

      {interviews.length > 0 && (
        <Section title={t('interview.title')}>
          <View style={{ gap: Spacing.sm }}>
            {interviews.slice(0, 2).map((i) => (
              <InterviewCard key={i.id} interview={i} />
            ))}
          </View>
        </Section>
      )}

      <Section title={t('application.progress')}>
        <View style={styles.panel}>
          <StatusTimeline current={application.status} entries={entries} terminalReason={rejectReason} />
        </View>
      </Section>

      {application.coverNote ? (
        <Section title={t('application.yourNote')}>
          <View style={styles.panel}>
            <Txt variant="body" color={Colors.textSecondary}>
              {application.coverNote}
            </Txt>
          </View>
        </Section>
      ) : null}

      {!terminal && !['OFFER_ACCEPTED'].includes(application.status) && (
        <View style={{ marginTop: Spacing.xxl }}>
          <Button label={t('application.withdraw')} variant="ghost" fullWidth onPress={() => setWithdrawing(true)} style={{ alignSelf: 'center' }} />
        </View>
      )}

      <ConfirmSheet
        visible={withdrawing}
        onClose={() => setWithdrawing(false)}
        title={t('application.withdraw.confirmTitle')}
        body={t('application.withdraw.confirmBody')}
        confirmLabel={t('application.withdraw')}
        danger
        onConfirm={async () => {
          await api.applications.withdraw(applicationId);
          toast(t('application.withdrawn'));
          await queryClient.invalidateQueries({ queryKey: keys.myApplications });
          await query.refetch();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: Spacing.radiusXl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  next: {
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Spacing.radiusLg,
    backgroundColor: Colors.accentLight,
  },
  panel: {
    padding: Spacing.lg,
    borderRadius: Spacing.radiusLg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
