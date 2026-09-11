import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Spacing, Shadows } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { EmptyState, JobStatusBadge, SkeletonList } from '@/components/ui';
import { LargeTitle } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { Segmented } from '@/components/app/Controls';
import { ErrorView } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { relativeTime, salaryRange } from '@/lib/format';
import { useFunnel, useRestaurantJobs } from '@/lib/queries';
import { activeMembership, useSession } from '@/lib/session';
import { useResponsive } from '@/hooks/useResponsive';
import type { Job } from '@/lib/api';

/** The restaurant's home: every posting, and how many people are waiting in each. */
export default function RestaurantJobs() {
  const { t } = useT();
  const { gutter } = useResponsive();
  const { restaurantId } = useSession();
  const membership = activeMembership();
  const query = useRestaurantJobs(restaurantId);
  const [filter, setFilter] = useState<'open' | 'all'>('open');

  const jobs = useMemo(() => {
    const all = query.data ?? [];
    return filter === 'open' ? all.filter((j) => j.status === 'OPEN' || j.status === 'PAUSED' || j.status === 'DRAFT') : all;
  }, [query.data, filter]);

  return (
    <SafeAreaView edges={['top']} style={styles.fill}>
      <FlatList
        data={jobs}
        keyExtractor={(j) => String(j.id)}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 120, gap: Spacing.md }}
        ListHeaderComponent={
          <View style={{ marginBottom: Spacing.xs }}>
            <LargeTitle eyebrow={membership?.restaurantName} title={t('rjobs.title')} />
            {(query.data?.length ?? 0) > 0 && (
              <Segmented
                options={[
                  { value: 'open', label: t('rjobs.open') },
                  { value: 'all', label: t('rjobs.all'), count: query.data?.length },
                ]}
                value={filter}
                onChange={setFilter}
              />
            )}
          </View>
        }
        renderItem={({ item }) => <JobRow job={item} />}
        ListEmptyComponent={
          query.isLoading ? (
            <SkeletonList rows={3} />
          ) : query.isError ? (
            <ErrorView error={query.error} onRetry={() => query.refetch()} />
          ) : (
            <EmptyState icon="megaphone-outline" title={t('rjobs.empty.title')} subtitle={t('rjobs.empty.body')} actionLabel={t('rjobs.post')} onAction={() => router.push('/hiring/job-form')} />
          )
        }
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity onPress={() => router.push('/hiring/job-form')} activeOpacity={PRESS_OPACITY} style={[styles.fab, Shadows.lg]} accessibilityRole="button" accessibilityLabel={t('rjobs.post')}>
        <Ionicons name="add" size={22} color={Colors.white} />
        <Txt variant="bodyStrong" color={Colors.white}>
          {t('rjobs.post')}
        </Txt>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function JobRow({ job }: { job: Job }) {
  const { t } = useT();
  const funnel = useFunnel(job.id).data;
  const total = funnel ? Object.values(funnel).reduce((a, b) => a + b, 0) : null;
  const fresh = funnel ? (funnel.APPLIED ?? 0) : 0;

  return (
    <TouchableOpacity onPress={() => router.push(`/hiring/jobs/${job.id}`)} activeOpacity={PRESS_OPACITY} style={styles.card} accessibilityRole="button">
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Txt variant="subheading" numberOfLines={1}>
            {job.title}
          </Txt>
          <Txt variant="caption" color={Colors.textSecondary} numberOfLines={1}>
            {[job.outletName, salaryRange(job.minSalary, job.maxSalary, job.salaryPeriod)].filter(Boolean).join(' · ')}
          </Txt>
        </View>
        <JobStatusBadge status={job.status} size="sm" />
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="people-outline" size={16} color={Colors.textSecondary} />
          <Txt variant="captionStrong">
            {total == null ? '–' : total === 0 ? t('rjobs.noApplicants') : total === 1 ? t('rjobs.oneApplicant') : t('rjobs.applicants', { count: total })}
          </Txt>
        </View>
        {fresh > 0 && (
          <View style={styles.newPill}>
            <Txt variant="micro" color={Colors.white}>
              {t('rjobs.new', { count: fresh })}
            </Txt>
          </View>
        )}
        <View style={{ flex: 1 }} />
        {job.publishedAt != null && (
          <Txt variant="caption" color={Colors.textTertiary}>
            {relativeTime(job.publishedAt)}
          </Txt>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  newPill: { backgroundColor: Colors.primary, borderRadius: Spacing.radiusFull, paddingHorizontal: 8, paddingVertical: 2 },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radiusFull,
    paddingHorizontal: Spacing.xl,
    height: 52,
  },
});
