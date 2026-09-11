import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { ApplicationStatusBadge, Avatar, EmptyState, SkeletonList } from '@/components/ui';
import { LargeTitle } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { Segmented } from '@/components/app/Controls';
import { ErrorView } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { relativeTime } from '@/lib/format';
import { useMyApplications } from '@/lib/queries';
import { isTerminalApplicationStatus } from '@/lib/status-display';
import { useResponsive } from '@/hooks/useResponsive';
import type { Application } from '@/lib/api';

/** Where a candidate checks on everything they've applied for. Active first, finished out of the way. */
export default function Applications() {
  const { t } = useT();
  const { gutter } = useResponsive();
  const query = useMyApplications();
  const [tab, setTab] = useState<'active' | 'closed'>('active');

  const { active, closed } = useMemo(() => {
    const all = query.data ?? [];
    return {
      active: all.filter((a) => !isTerminalApplicationStatus(a.status)),
      closed: all.filter((a) => isTerminalApplicationStatus(a.status)),
    };
  }, [query.data]);

  const list = tab === 'active' ? active : closed;

  return (
    <SafeAreaView edges={['top']} style={styles.fill}>
      <FlatList
        data={list}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: Spacing.section, gap: Spacing.md }}
        ListHeaderComponent={
          <View style={{ marginBottom: Spacing.xs }}>
            <LargeTitle title={t('applications.title')} />
            <Segmented
              options={[
                { value: 'active', label: t('applications.active'), count: active.length },
                { value: 'closed', label: t('applications.closed'), count: closed.length },
              ]}
              value={tab}
              onChange={setTab}
            />
          </View>
        }
        renderItem={({ item }) => <ApplicationRow application={item} />}
        ListEmptyComponent={
          query.isLoading ? (
            <SkeletonList rows={3} />
          ) : query.isError ? (
            <ErrorView error={query.error} onRetry={() => query.refetch()} />
          ) : tab === 'active' ? (
            <EmptyState
              icon="document-text-outline"
              title={t('applications.empty.title')}
              subtitle={t('applications.empty.body')}
              actionLabel={t('applications.empty.cta')}
              onAction={() => router.navigate('/candidate')}
            />
          ) : (
            <EmptyState icon="archive-outline" title={t('applications.closedEmpty')} />
          )
        }
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function ApplicationRow({ application: a }: { application: Application }) {
  const { t, tx } = useT();
  return (
    <TouchableOpacity onPress={() => router.push(`/applications/${a.id}`)} activeOpacity={PRESS_OPACITY} style={styles.card} accessibilityRole="button">
      <Avatar name={a.restaurantName} uri={a.logoUrl} shape="rounded" />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="subheading" numberOfLines={1}>
          {a.jobTitle}
        </Txt>
        <Txt variant="caption" color={Colors.textSecondary} numberOfLines={1}>
          {[a.restaurantName, a.outletName].filter(Boolean).join(' · ')}
        </Txt>
        <View style={styles.meta}>
          <ApplicationStatusBadge status={a.status} size="sm" />
          <Txt variant="caption" color={Colors.textTertiary}>
            {t('applications.appliedOn', { date: relativeTime(a.appliedAt) })}
          </Txt>
        </View>
        {!isTerminalApplicationStatus(a.status) && (
          <Txt variant="caption" color={Colors.textSecondary} style={{ marginTop: 4 }}>
            {tx(`application.next.${a.status}`, '')}
          </Txt>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: Colors.background },
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
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 6, flexWrap: 'wrap' },
});
