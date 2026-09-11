import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ErrorView, Loading, errorMessage } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { dateTimeLabel } from '@/lib/format';
import { readLocationOnce } from '@/lib/location';
import { useCheckInStatus, useInterview, useOffer } from '@/lib/queries';

/**
 * The one screen that asks for location — in context, after saying why, and only
 * inside the check-in window.
 *
 * Whatever the reading says, the candidate sees "You're checked in". A denied
 * permission, a weak signal or a fix 300 metres away is recorded for the
 * restaurant to interpret; it is never shown to the candidate as a failure,
 * because a GPS quirk must not make someone feel accused on their first day.
 */
export default function CheckIn() {
  const { t } = useT();
  const { kind, id } = useLocalSearchParams<{ kind: 'interview' | 'joining'; id: string }>();
  const eventId = Number(id);
  const queryClient = useQueryClient();
  const status = useCheckInStatus(kind, eventId);
  const interview = useInterview(kind === 'interview' ? eventId : 0);
  const offer = useOffer(kind === 'joining' ? eventId : 0);
  const restaurant = (kind === 'interview' ? interview.data?.restaurantName : offer.data?.restaurantName) ?? '';

  const [phase, setPhase] = useState<'ready' | 'locating' | 'done'>('ready');
  const [confirmed, setConfirmed] = useState(true);
  const [error, setError] = useState<string>();

  if (status.isLoading) return <Loading />;
  if (!status.data) return <ErrorView error={status.error} onRetry={() => status.refetch()} />;
  const s = status.data;

  const checkIn = async () => {
    setPhase('locating');
    setError(undefined);
    const { granted, fix } = await readLocationOnce();
    try {
      // Called even when permission was denied, so the attempt is on record
      // rather than vanishing into a client-side branch.
      const result = await api.checkIn.record(kind, eventId, {
        latitude: fix?.latitude ?? null,
        longitude: fix?.longitude ?? null,
        accuracyMeters: fix?.accuracy ?? null,
        locationPermissionStatus: granted ? 'GRANTED' : 'DENIED',
        isMockLocationSuspected: fix?.mocked ?? false,
      });
      setConfirmed(result.locationConfirmed);
      setPhase('done');
      void queryClient.invalidateQueries({ queryKey: ['checkIn'] });
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
      setPhase('ready');
    }
  };

  if (phase === 'done' || s.existing) {
    return (
      <Screen header={<Header close />} footer={<Button label={t('common.done')} size="lg" fullWidth onPress={() => router.back()} />}>
        <View style={styles.center}>
          <View style={[styles.bigIcon, { backgroundColor: Colors.successLight }]}>
            <Ionicons name="checkmark" size={56} color={Colors.success} />
          </View>
          <Txt variant="display" align="center">
            {t('checkin.success.title')}
          </Txt>
          <Txt variant="body" color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.sm }}>
            {phase === 'done' && !confirmed ? t('checkin.fallback.body') : t('checkin.success.body', { restaurant })}
          </Txt>
          {s.existing && phase !== 'done' && (
            <Txt variant="caption" color={Colors.textTertiary} align="center" style={{ marginTop: Spacing.md }}>
              {t('checkin.already', { time: dateTimeLabel(s.existing.checkedInAt) })}
            </Txt>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      header={<Header close />}
      footer={
        s.open ? (
          <Button label={t('checkin.cta')} size="lg" fullWidth icon="location" loading={phase === 'locating'} onPress={checkIn} />
        ) : null
      }
    >
      <View style={styles.center}>
        <View style={[styles.bigIcon, { backgroundColor: Colors.accentLight }]}>
          {phase === 'locating' ? <ActivityIndicator size="large" color={Colors.accent} /> : <Ionicons name="location" size={52} color={Colors.accent} />}
        </View>
        <Txt variant="captionStrong" color={Colors.textSecondary} align="center">
          {kind === 'interview' ? t('checkin.event.interview', { restaurant }) : t('checkin.event.joining', { restaurant })}
        </Txt>
        <Txt variant="display" align="center" style={{ marginTop: Spacing.sm }}>
          {phase === 'locating' ? t('checkin.locating') : t('checkin.explainer.title')}
        </Txt>
        <Txt variant="body" color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.sm }}>
          {s.open ? t('checkin.explainer.body') : s.notYetOpen ? t('checkin.notOpen', { time: dateTimeLabel(s.opensAt) }) : t('checkin.closed')}
        </Txt>
        {error != null && (
          <Txt variant="captionStrong" color={Colors.danger} align="center" style={{ marginTop: Spacing.lg }}>
            {error}
          </Txt>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', paddingTop: Spacing.section, paddingHorizontal: Spacing.lg },
  bigIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
});
