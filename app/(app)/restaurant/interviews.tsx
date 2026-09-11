import React, { useMemo } from 'react';
import { RefreshControl, SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { Avatar, EmptyState, InterviewStatusBadge, SkeletonList } from '@/components/ui';
import { LargeTitle } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ErrorView } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { dayLabel, parseServerDate, timeLabel } from '@/lib/format';
import { useCalendar } from '@/lib/queries';
import { useSession } from '@/lib/session';
import { useResponsive } from '@/hooks/useResponsive';
import type { Interview } from '@/lib/api';

/** The next two weeks of interviews across every outlet the manager can see, grouped by day. */
export default function RestaurantInterviews() {
  const { t } = useT();
  const { gutter } = useResponsive();
  const { restaurantId } = useSession();
  const query = useCalendar(restaurantId);

  const sections = useMemo(() => {
    const live = (query.data ?? []).filter((i) => i.status !== 'CANCELLED');
    const byDay = new Map<string, Interview[]>();
    live.forEach((i) => {
      const d = parseServerDate(i.scheduledAt)!;
      const key = d.toDateString();
      byDay.set(key, [...(byDay.get(key) ?? []), i]);
    });
    return [...byDay.entries()].map(([key, data]) => ({ title: dayLabel(new Date(key)), data }));
  }, [query.data]);

  return (
    <SafeAreaView edges={['top']} style={styles.fill}>
      <SectionList
        sections={sections}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: Spacing.section }}
        ListHeaderComponent={<LargeTitle title={t('rinterviews.title')} subtitle={t('rinterviews.subtitle')} />}
        renderSectionHeader={({ section }) => (
          <Txt variant="captionStrong" color={Colors.textSecondary} style={styles.dayHeader}>
            {section.title}
          </Txt>
        )}
        renderItem={({ item }) => {
          const at = parseServerDate(item.scheduledAt)!;
          return (
            <TouchableOpacity onPress={() => router.push(`/interviews/${item.id}`)} activeOpacity={PRESS_OPACITY} style={styles.card} accessibilityRole="button">
              <View style={styles.time}>
                <Txt variant="subheading">{timeLabel(at)}</Txt>
                <Txt variant="caption" color={Colors.textTertiary}>
                  {t('interview.minutes', { n: item.durationMinutes })}
                </Txt>
              </View>
              <View style={styles.divider} />
              <Avatar name={item.candidateName} size="sm" />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="bodyStrong" numberOfLines={1}>
                  {item.candidateName ?? t('common.deletedAccount')}
                </Txt>
                <Txt variant="caption" color={Colors.textSecondary} numberOfLines={1}>
                  {[item.jobTitle, t(`interview.type.${item.interviewType}` as MessageKey)].filter(Boolean).join(' · ')}
                </Txt>
                <View style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                  <InterviewStatusBadge status={item.status} size="sm" />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          query.isLoading ? (
            <SkeletonList rows={3} />
          ) : query.isError ? (
            <ErrorView error={query.error} onRetry={() => query.refetch()} />
          ) : (
            <EmptyState icon="calendar-outline" title={t('rinterviews.empty.title')} subtitle={t('rinterviews.empty.body')} />
          )
        }
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={Colors.primary} />}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: Colors.background },
  dayHeader: { marginTop: Spacing.lg, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
  },
  time: { width: 72 },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: Colors.border },
});
