import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { ApplicationStatusBadge, Avatar, Button, StatusTimeline } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { Section, Tiles } from '@/components/app/Controls';
import { InterviewCard, OfferCard } from '@/components/app/HiringCards';
import { ConfirmSheet, ErrorView, Loading, errorMessage, toast } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { api } from '@/lib/api';
import { dateTimeLabel, experience, rupees } from '@/lib/format';
import { keys, useApplicationInterviews, useApplicationOffer, useRestaurantApplication, useRoleName } from '@/lib/queries';
import type { ApplicationStatus } from '@/constants/colors';

/**
 * One candidate for one job, from the restaurant's side. Opening it marks the
 * application VIEWED. The one next step for the stage it is at is the footer
 * button; rejecting is always a quieter secondary action.
 */
export default function RestaurantApplication() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const applicationId = Number(id);
  const queryClient = useQueryClient();
  const roleName = useRoleName();
  const query = useRestaurantApplication(applicationId);
  const a = query.data;
  const interviews = useApplicationInterviews(applicationId, a != null && a.timeline.some((e) => e.status === 'INTERVIEW'));
  const offer = useApplicationOffer(applicationId, a != null && a.timeline.some((e) => e.status === 'SELECTED'));
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);

  if (query.isLoading) return <Loading />;
  if (!a) return <ErrorView error={query.error} onRetry={() => query.refetch()} />;

  const refresh = async () => {
    await query.refetch();
    void interviews.refetch();
    void offer.refetch();
    void queryClient.invalidateQueries({ queryKey: keys.jobApplications(a.jobId) });
    void queryClient.invalidateQueries({ queryKey: keys.funnel(a.jobId) });
  };

  const run = async (action: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await action();
      toast(done);
      await refresh();
    } catch (e) {
      toast(errorMessage(e, t('common.errorBody')), 'error');
    } finally {
      setBusy(false);
    }
  };

  const latestInterview = interviews.data?.[0];
  const interviewDone = latestInterview?.status === 'COMPLETED';
  const c = a.candidate;
  const canReject = ['APPLIED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED'].includes(a.status);

  let primary: React.ReactNode = null;
  switch (a.status) {
    case 'APPLIED':
    case 'VIEWED':
      primary = <Button label={t('rapp.shortlist')} size="lg" fullWidth icon="bookmark" loading={busy} onPress={() => run(() => api.applications.shortlist(applicationId), t('rapp.shortlisted'))} />;
      break;
    case 'SHORTLISTED':
      primary = <Button label={t('rapp.schedule')} size="lg" fullWidth icon="calendar" onPress={() => router.push({ pathname: '/hiring/schedule', params: { applicationId: String(applicationId) } })} />;
      break;
    case 'INTERVIEW':
      primary = interviewDone ? (
        <Button label={t('rapp.select')} size="lg" fullWidth icon="ribbon" loading={busy} onPress={() => run(() => api.applications.select(applicationId), t('rapp.selected'))} />
      ) : null;
      break;
    case 'SELECTED':
      primary = offer.data == null ? (
        <Button label={t('rapp.makeOffer')} size="lg" fullWidth icon="mail" onPress={() => router.push({ pathname: '/hiring/offer', params: { applicationId: String(applicationId), expected: String(c?.expectedSalary ?? ''), name: a.candidateName ?? '' } })} />
      ) : null;
      break;
    case 'OFFER_ACCEPTED':
      primary = <Button label={t('rapp.recordJoining')} size="lg" fullWidth icon="flag" onPress={() => router.push({ pathname: '/hiring/joining', params: { applicationId: String(applicationId), name: a.candidateName ?? '' } })} />;
      break;
  }

  const entries = Object.fromEntries(a.timeline.map((e) => [e.status, { timestamp: dateTimeLabel(e.at) }])) as Partial<Record<ApplicationStatus, { timestamp: string }>>;

  return (
    <Screen
      header={<Header title={t('rapp.title')} />}
      tone="tinted"
      refreshing={query.isRefetching}
      onRefresh={refresh}
      footer={primary || canReject ? (
        <View style={{ gap: Spacing.sm }}>
          {primary}
          {a.status === 'INTERVIEW' && !interviewDone && (
            <Txt variant="caption" color={Colors.textSecondary} align="center">
              {t('rapp.selectHint')}
            </Txt>
          )}
          {canReject && <Button label={t('rapp.reject')} variant="ghost" fullWidth onPress={() => setRejecting(true)} style={{ alignSelf: 'center' }} />}
        </View>
      ) : undefined}
    >
      <View style={styles.hero}>
        <Avatar name={a.candidateName} size="xl" />
        <Txt variant="title" style={{ marginTop: Spacing.md }} align="center">
          {a.candidateName}
        </Txt>
        <Txt variant="body" color={Colors.textSecondary} align="center">
          {t('rapp.appliedFor', { job: a.jobTitle ?? '' })}
        </Txt>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
          <ApplicationStatusBadge status={a.status} />
          {a.matchScore != null && (
            <View style={styles.match}>
              <Txt variant="captionStrong" color={Colors.accentDark}>
                {t('rapp.match', { score: a.matchScore })}
              </Txt>
            </View>
          )}
        </View>
      </View>

      {c != null && (
        <View style={{ marginTop: Spacing.lg }}>
          <Tiles
            items={[
              { icon: 'restaurant-outline', label: t('rapp.role'), value: roleName(c.primaryRoleId) || t('common.notSet') },
              { icon: 'ribbon-outline', label: t('rapp.experience'), value: experience(c.totalExperienceMonths) },
              { icon: 'cash-outline', label: t('rapp.expects'), value: c.expectedSalary ? rupees(c.expectedSalary) : t('common.notSet') },
              { icon: 'flash-outline', label: t('rapp.canJoin'), value: t(`availability.${c.availability}` as MessageKey) },
            ]}
          />
        </View>
      )}

      {a.coverNote ? (
        <Section title={t('rapp.note')}>
          <View style={styles.panel}>
            <Txt variant="body" color={Colors.textSecondary}>
              “{a.coverNote}”
            </Txt>
          </View>
        </Section>
      ) : null}

      {offer.data != null && (
        <Section title={t('offer.title')}>
          <OfferCard offer={offer.data} />
        </Section>
      )}

      {latestInterview != null && (
        <Section title={t('interview.title')}>
          <InterviewCard interview={latestInterview} />
        </Section>
      )}

      <Section title={t('rapp.history')}>
        <View style={styles.panel}>
          <StatusTimeline current={a.status} entries={entries} />
        </View>
      </Section>

      <ConfirmSheet
        visible={rejecting}
        onClose={() => setRejecting(false)}
        title={t('rapp.reject.confirmTitle', { name: a.candidateName ?? '' })}
        confirmLabel={t('rapp.reject')}
        danger
        reasonPlaceholder={t('rapp.reject.reasonPlaceholder')}
        onConfirm={async (reason) => {
          await api.applications.reject(applicationId, reason);
          toast(t('rapp.rejected'));
          await refresh();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: Spacing.radiusXl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  match: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Spacing.radiusFull, backgroundColor: Colors.accentLight },
  panel: {
    padding: Spacing.lg,
    borderRadius: Spacing.radiusLg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
