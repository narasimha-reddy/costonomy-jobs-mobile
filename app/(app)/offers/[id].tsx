import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button, OfferStatusBadge } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ListGroup, ListRow, Section } from '@/components/app/Controls';
import { ConfirmSheet, ErrorView, Loading, toast } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { api } from '@/lib/api';
import { dateTimeLabel, dayLabel, parseServerDate, rupees, shortDate } from '@/lib/format';
import { useCheckInStatus, useOffer } from '@/lib/queries';
import { useSession } from '@/lib/session';

/** An offer, for both sides: the candidate answers it; the restaurant can withdraw it or close the hire. */
export default function OfferDetail() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const offerId = Number(id);
  const { role } = useSession();
  const isCandidate = role === 'candidate';
  const queryClient = useQueryClient();
  const query = useOffer(offerId);
  const offer = query.data;
  const accepted = offer?.status === 'ACCEPTED';
  const checkIn = useCheckInStatus('joining', offerId, isCandidate && accepted && offer?.joiningState === 'JOINING_EXPECTED');
  const [confirm, setConfirm] = useState<'accept' | 'decline' | 'cancel' | null>(null);

  if (query.isLoading) return <Loading />;
  if (!offer) return <ErrorView error={query.error} onRetry={() => query.refetch()} />;

  const joining = parseServerDate(offer.joiningDate)!;
  const refresh = async () => {
    await query.refetch();
    void queryClient.invalidateQueries({ queryKey: ['applications'] });
    void queryClient.invalidateQueries({ queryKey: ['restaurantApplication'] });
    void queryClient.invalidateQueries({ queryKey: ['job'] });
  };

  const status = checkIn.data;
  let footer: React.ReactNode = null;
  if (isCandidate && offer.status === 'SENT') {
    footer = (
      <View style={styles.footerRow}>
        <Button label={t('offer.decline')} variant="secondary" size="lg" style={{ flex: 1 }} onPress={() => setConfirm('decline')} />
        <Button label={t('offer.accept')} size="lg" style={{ flex: 2 }} onPress={() => setConfirm('accept')} />
      </View>
    );
  } else if (isCandidate && accepted && status?.open && !status.existing) {
    footer = <Button label={t('offer.firstDay')} size="lg" fullWidth icon="location" onPress={() => router.push({ pathname: '/check-in', params: { kind: 'joining', id: String(offerId) } })} />;
  } else if (!isCandidate && accepted && offer.joiningState === 'JOINING_EXPECTED') {
    footer = <Button label={t('offer.recordJoining')} size="lg" fullWidth onPress={() => router.push({ pathname: '/hiring/joining', params: { applicationId: String(offer.applicationId), name: offer.candidateName ?? '' } })} />;
  }

  return (
    <Screen header={<Header title={t('offer.title')} />} footer={footer} refreshing={query.isRefetching} onRefresh={refresh}>
      {isCandidate && accepted && (
        <View style={styles.hired}>
          <Ionicons name="trophy" size={28} color={Colors.success} />
          <Txt variant="heading" color={Colors.success}>
            {t('offer.hired')}
          </Txt>
        </View>
      )}

      <View style={styles.salary}>
        <Txt variant="captionStrong" color={Colors.primaryDark}>
          {t('offer.salary')}
        </Txt>
        <Txt variant="display" style={{ fontSize: 36, lineHeight: 44 }}>
          {rupees(offer.salary)}
        </Txt>
        <Txt variant="body" color={Colors.textSecondary}>
          {offer.jobTitle ?? offer.roleDisplay} · {offer.restaurantName}
        </Txt>
        <View style={{ alignSelf: 'flex-start', marginTop: Spacing.sm }}>
          <OfferStatusBadge status={offer.status} />
        </View>
      </View>

      <Section>
        <ListGroup>
          <ListRow icon="calendar-outline" title={t('offer.joiningDate')} value={dayLabel(joining)} />
          <ListRow icon="storefront-outline" title={offer.outletName ?? ''} subtitle={offer.restaurantName ?? undefined} />
          {!isCandidate && offer.candidateName ? <ListRow icon="person-outline" title={offer.candidateName} /> : null}
          {offer.joiningState ? <ListRow icon="flag-outline" title={t(`offer.joiningState.${offer.joiningState}` as MessageKey)} /> : null}
        </ListGroup>
      </Section>

      {offer.benefits ? (
        <Section title={t('offer.benefits')}>
          <View style={styles.panel}>
            <Txt variant="body" color={Colors.textSecondary}>
              {offer.benefits}
            </Txt>
          </View>
        </Section>
      ) : null}

      {offer.status === 'SENT' && offer.expiresAt != null && (
        <Txt variant="caption" color={Colors.warning} style={{ marginTop: Spacing.lg }}>
          {t('offer.replyBy', { date: shortDate(parseServerDate(offer.expiresAt)!) })}
        </Txt>
      )}

      {isCandidate && accepted && status != null && (
        <View style={styles.checkIn}>
          <Ionicons name={status.existing ? 'checkmark-circle' : 'location-outline'} size={22} color={status.existing ? Colors.success : Colors.accent} />
          <Txt variant="body" style={{ flex: 1 }}>
            {status.existing
              ? t('checkin.already', { time: dateTimeLabel(status.existing.checkedInAt) })
              : status.notYetOpen
                ? t('checkin.notOpen', { time: dateTimeLabel(status.opensAt) })
                : status.open
                  ? t('checkin.explainer.body')
                  : t('checkin.closed')}
          </Txt>
        </View>
      )}

      {!isCandidate && offer.status === 'SENT' && (
        <View style={{ marginTop: Spacing.xxl }}>
          <Button label={t('offer.cancel')} variant="ghost" fullWidth onPress={() => setConfirm('cancel')} />
        </View>
      )}

      <ConfirmSheet
        visible={confirm === 'accept'}
        onClose={() => setConfirm(null)}
        title={t('offer.accept.confirmTitle')}
        body={t('offer.accept.confirmBody', { restaurant: offer.restaurantName ?? '', date: dayLabel(joining) })}
        confirmLabel={t('offer.accept')}
        onConfirm={async () => {
          await api.offers.accept(offerId);
          toast(t('offer.accepted'));
          await refresh();
        }}
      />
      <ConfirmSheet
        visible={confirm === 'decline'}
        onClose={() => setConfirm(null)}
        title={t('offer.decline.confirmTitle')}
        confirmLabel={t('offer.decline')}
        danger
        reasonPlaceholder={t('offer.decline.reasonPlaceholder')}
        onConfirm={async (reason) => {
          await api.offers.decline(offerId, reason);
          toast(t('offer.declined'));
          await refresh();
        }}
      />
      <ConfirmSheet
        visible={confirm === 'cancel'}
        onClose={() => setConfirm(null)}
        title={t('offer.cancel.confirmTitle')}
        confirmLabel={t('offer.cancel')}
        danger
        reasonPlaceholder={t('interview.cancel.reasonPlaceholder')}
        onConfirm={async (reason) => {
          await api.offers.cancel(offerId, reason);
          toast(t('offer.cancelled'));
          await refresh();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hired: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Spacing.radiusLg,
    backgroundColor: Colors.successLight,
  },
  salary: {
    marginTop: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: Spacing.radiusXl,
    backgroundColor: Colors.primaryLight,
    gap: 2,
  },
  panel: { padding: Spacing.lg, borderRadius: Spacing.radiusLg, backgroundColor: Colors.background },
  checkIn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Spacing.radiusLg,
    backgroundColor: Colors.accentLight,
  },
  footerRow: { flexDirection: 'row', gap: Spacing.sm },
});
