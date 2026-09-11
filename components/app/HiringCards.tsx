import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { InterviewStatusBadge, OfferStatusBadge } from '@/components/ui';
import { useT, type MessageKey } from '@/lib/i18n';
import { dateTimeLabel, dayLabel, dayParts, parseServerDate, rupees } from '@/lib/format';
import type { Interview, Offer } from '@/lib/api';
import { Txt } from './Txt';

/** An interview at a glance: when, how, and its state. Taps through to the full screen. */
export function InterviewCard({ interview }: { interview: Interview }) {
  const { t } = useT();
  const at = parseServerDate(interview.scheduledAt);
  return (
    <TouchableOpacity onPress={() => router.push(`/interviews/${interview.id}`)} activeOpacity={PRESS_OPACITY} style={styles.card} accessibilityRole="button">
      <View style={[styles.dateBlock, { backgroundColor: '#F5F3FF' }]}>
        <Txt variant="micro" color="#6D28D9">
          {at ? dayParts(at).month.toUpperCase() : ''}
        </Txt>
        <Txt variant="title" color="#6D28D9">
          {at?.getDate()}
        </Txt>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="subheading">{dateTimeLabel(interview.scheduledAt)}</Txt>
        <Txt variant="caption" color={Colors.textSecondary}>
          {t(`interview.type.${interview.interviewType}` as MessageKey)} · {t('interview.minutes', { n: interview.durationMinutes })}
        </Txt>
        <View style={{ marginTop: 4, alignSelf: 'flex-start' }}>
          <InterviewStatusBadge status={interview.status} size="sm" />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

export function OfferCard({ offer }: { offer: Offer }) {
  const { t } = useT();
  const joining = parseServerDate(offer.joiningDate);
  return (
    <TouchableOpacity onPress={() => router.push(`/offers/${offer.id}`)} activeOpacity={PRESS_OPACITY} style={[styles.card, styles.offer]} accessibilityRole="button">
      <View style={[styles.dateBlock, { backgroundColor: Colors.white }]}>
        <Ionicons name="mail-open" size={24} color={Colors.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="heading">{rupees(offer.salary)}</Txt>
        <Txt variant="caption" color={Colors.textSecondary}>
          {t('offer.joiningDate')}: {joining ? dayLabel(joining) : ''}
        </Txt>
        <View style={{ marginTop: 4, alignSelf: 'flex-start' }}>
          <OfferStatusBadge status={offer.status} size="sm" />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  offer: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryMuted },
  dateBlock: { width: 52, height: 56, borderRadius: Spacing.radiusMd, alignItems: 'center', justifyContent: 'center' },
});
