import React, { useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button, InterviewStatusBadge } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ListGroup, ListRow, Section } from '@/components/app/Controls';
import { Sheet } from '@/components/app/Sheet';
import { ConfirmSheet, ErrorView, Loading, errorMessage, toast } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { api } from '@/lib/api';
import { dateTimeLabel, dayLabel, dayParts, parseServerDate, timeLabel } from '@/lib/format';
import { useCheckInStatus, useInterview } from '@/lib/queries';
import { useSession } from '@/lib/session';

/**
 * One interview, for both sides. What you can do depends on who you are and where
 * it stands: the candidate confirms and checks in; the restaurant records whether
 * they came. Either can move or cancel it while it is still live.
 */
export default function InterviewDetail() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const interviewId = Number(id);
  const { role } = useSession();
  const isCandidate = role === 'candidate';
  const queryClient = useQueryClient();
  const query = useInterview(interviewId);
  const interview = query.data;
  const live = interview != null && ['PROPOSED', 'CONFIRMED', 'RESCHEDULED'].includes(interview.status);
  const checkIn = useCheckInStatus('interview', interviewId, isCandidate && live && interview?.interviewType === 'IN_PERSON');

  const [cancelling, setCancelling] = useState(false);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  if (query.isLoading) return <Loading />;
  if (!interview) return <ErrorView error={query.error} onRetry={() => query.refetch()} />;

  const at = parseServerDate(interview.scheduledAt)!;
  const past = at.getTime() < Date.now();

  const refresh = async () => {
    await query.refetch();
    void queryClient.invalidateQueries({ queryKey: ['applications'] });
    void queryClient.invalidateQueries({ queryKey: ['restaurantApplication'] });
    void queryClient.invalidateQueries({ queryKey: ['restaurants'] });
  };

  const run = async (key: string, action: () => Promise<unknown>, done: string) => {
    setBusy(key);
    try {
      await action();
      toast(done);
      await refresh();
    } catch (e) {
      toast(errorMessage(e, t('common.errorBody')), 'error');
    } finally {
      setBusy(null);
    }
  };

  const place = interview.interviewType === 'IN_PERSON'
    ? [interview.outletName, interview.outletAddress].filter(Boolean).join(', ')
    : interview.location ?? '';

  const openPlace = () => {
    if (interview.interviewType !== 'IN_PERSON') {
      const loc = interview.location ?? '';
      void Linking.openURL(/^\+?\d[\d\s-]+$/.test(loc) ? `tel:${loc.replace(/\s/g, '')}` : loc);
      return;
    }
    const q = encodeURIComponent(place);
    void Linking.openURL(Platform.OS === 'ios' ? `http://maps.apple.com/?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  // A restaurant confirms only a time the candidate proposed.
  const canConfirm = interview.status === 'PROPOSED' && (isCandidate || interview.rescheduleCount > 0);
  const status = checkIn.data;

  let footer: React.ReactNode = null;
  if (isCandidate && live && interview.interviewType === 'IN_PERSON' && status?.open && !status.existing) {
    footer = (
      <Button label={t('interview.checkIn')} size="lg" fullWidth icon="location" onPress={() => router.push({ pathname: '/check-in', params: { kind: 'interview', id: String(interviewId) } })} />
    );
  } else if (canConfirm) {
    footer = (
      <Button
        label={isCandidate ? t('interview.confirm') : t('interview.confirmNewTime')}
        size="lg"
        fullWidth
        loading={busy === 'confirm'}
        onPress={() => run('confirm', () => api.interviews.confirm(interviewId), t('interview.confirmed'))}
      />
    );
  } else if (!isCandidate && live && past) {
    footer = <Button label={t('interview.outcomeTitle')} size="lg" fullWidth onPress={() => setOutcomeOpen(true)} />;
  }

  return (
    <Screen header={<Header title={t('interview.title')} />} footer={footer} refreshing={query.isRefetching} onRefresh={refresh}>
      <View style={styles.hero}>
        <View style={styles.calendar}>
          <Txt variant="micro" color={Colors.white}>
            {dayParts(at).month.toUpperCase()}
          </Txt>
          <Txt variant="display" color={Colors.white}>
            {at.getDate()}
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="title">{dayLabel(at)}</Txt>
          <Txt variant="body" color={Colors.textSecondary}>
            {timeLabel(at)} · {t('interview.minutes', { n: interview.durationMinutes })}
          </Txt>
          <View style={{ alignSelf: 'flex-start', marginTop: 6 }}>
            <InterviewStatusBadge status={interview.status} />
          </View>
        </View>
      </View>

      {interview.previousScheduledAt != null && live && (
        <Txt variant="caption" color={Colors.textSecondary} style={{ marginTop: Spacing.md }}>
          {t('interview.previously', { time: dateTimeLabel(interview.previousScheduledAt) })}
        </Txt>
      )}

      {interview.cancelledBy != null && (
        <View style={styles.cancelled}>
          <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          <Txt variant="body" color={Colors.textSecondary} style={{ flex: 1 }}>
            {t(`interview.cancelledBy.${interview.cancelledBy}` as MessageKey)}
            {interview.cancellationReason ? ` — ${interview.cancellationReason}` : ''}
          </Txt>
        </View>
      )}

      <Section>
        <ListGroup>
          <ListRow icon="briefcase-outline" title={interview.jobTitle ?? ''} subtitle={isCandidate ? interview.restaurantName ?? undefined : t('interview.with', { name: interview.candidateName ?? t('common.deletedAccount') })} />
          <ListRow
            icon={interview.interviewType === 'IN_PERSON' ? 'location-outline' : interview.interviewType === 'PHONE' ? 'call-outline' : 'videocam-outline'}
            title={t(`interview.type.${interview.interviewType}` as MessageKey)}
            subtitle={place || undefined}
            onPress={place ? openPlace : undefined}
          />
        </ListGroup>
      </Section>

      {isCandidate && live && interview.interviewType === 'IN_PERSON' && status != null && (
        <View style={styles.checkIn}>
          <Ionicons name={status.existing ? 'checkmark-circle' : 'location-outline'} size={22} color={status.existing ? Colors.success : Colors.accent} />
          <Txt variant="body" style={{ flex: 1 }}>
            {status.existing
              ? t('interview.checkedIn', { time: dateTimeLabel(status.existing.checkedInAt) })
              : status.notYetOpen
                ? t('interview.checkInOpensAt', { time: dateTimeLabel(status.opensAt) })
                : status.open
                  ? t('checkin.explainer.body')
                  : t('checkin.closed')}
          </Txt>
        </View>
      )}

      {!isCandidate && interview.notes ? (
        <Section title={t('interview.notes')}>
          <View style={styles.notes}>
            <Txt variant="body" color={Colors.textSecondary}>
              {interview.notes}
            </Txt>
          </View>
        </Section>
      ) : null}

      {live && (
        <View style={{ marginTop: Spacing.xxl, gap: Spacing.sm }}>
          <Button
            label={t('interview.reschedule')}
            variant="secondary"
            fullWidth
            icon="calendar-outline"
            onPress={() => router.push({ pathname: '/hiring/schedule', params: { interviewId: String(interviewId), applicationId: String(interview.applicationId) } })}
          />
          <Button label={t('interview.cancel')} variant="ghost" fullWidth onPress={() => setCancelling(true)} />
        </View>
      )}

      <ConfirmSheet
        visible={cancelling}
        onClose={() => setCancelling(false)}
        title={t('interview.cancel.confirmTitle')}
        confirmLabel={t('interview.cancel')}
        danger
        reasonPlaceholder={t('interview.cancel.reasonPlaceholder')}
        onConfirm={async (reason) => {
          await api.interviews.cancel(interviewId, reason);
          toast(t('interview.cancelled'));
          await refresh();
        }}
      />

      <Sheet visible={outcomeOpen} onClose={() => setOutcomeOpen(false)} title={t('interview.outcomeTitle')}>
        <View style={{ gap: Spacing.sm }}>
          <Button
            label={t('interview.attended')}
            variant="accent"
            size="lg"
            fullWidth
            icon="checkmark-circle"
            loading={busy === 'COMPLETED'}
            onPress={() => run('COMPLETED', () => api.interviews.complete(interviewId, 'COMPLETED'), t('interview.markedAttended')).then(() => setOutcomeOpen(false))}
          />
          <Button
            label={t('interview.noShow')}
            variant="secondary"
            size="lg"
            fullWidth
            loading={busy === 'NO_SHOW'}
            onPress={() => run('NO_SHOW', () => api.interviews.complete(interviewId, 'NO_SHOW'), t('interview.markedNoShow')).then(() => setOutcomeOpen(false))}
          />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginTop: Spacing.md },
  calendar: {
    width: 72,
    height: 80,
    borderRadius: Spacing.radiusLg,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Spacing.radiusMd,
    backgroundColor: Colors.surfaceSunken,
  },
  checkIn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Spacing.radiusLg,
    backgroundColor: Colors.accentLight,
  },
  notes: { padding: Spacing.lg, borderRadius: Spacing.radiusLg, backgroundColor: Colors.background },
});
