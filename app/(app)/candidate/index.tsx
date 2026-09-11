import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { EmptyState, SkeletonList } from '@/components/ui';
import { Txt } from '@/components/app/Txt';
import { Segmented } from '@/components/app/Controls';
import { JobCard } from '@/components/app/Pieces';
import { ErrorView } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { DEFAULT_CITY_ID } from '@/lib/config';
import { greetingKey } from '@/lib/format';
import { useFeed, useProfile } from '@/lib/queries';
import { useSession } from '@/lib/session';
import { useResponsive } from '@/hooks/useResponsive';

/**
 * The candidate's home. "For you" is ranked by the match engine against their
 * profile; "Latest" is newest first. Both run the same filter server-side, so
 * switching only reorders.
 */
export default function Feed() {
  const { t } = useT();
  const { me } = useSession();
  const { gutter, contentMaxWidth } = useResponsive();
  const profile = useProfile().data;
  const [sort, setSort] = useState<'relevance' | 'newest'>('relevance');

  const cityId = profile?.currentCityId ?? DEFAULT_CITY_ID;
  const feed = useFeed({ cityId, sort }, profile != null);
  const jobs = useMemo(() => feed.data?.pages.flatMap((p) => p.data) ?? [], [feed.data]);

  const firstName = (me?.user.name ?? profile?.name ?? '').split(' ')[0];
  const completion = profile?.profileCompletionPercentage ?? 100;

  const header = (
    <View>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color={Colors.textSecondary}>
            {t(greetingKey())}
            {firstName ? `, ${firstName}` : ''}
          </Txt>
          <Txt variant="display">{t('feed.title')}</Txt>
        </View>
      </View>

      <TouchableOpacity onPress={() => router.push('/jobs/search')} activeOpacity={PRESS_OPACITY} style={styles.search} accessibilityRole="search">
        <Ionicons name="search" size={20} color={Colors.textTertiary} />
        <Txt variant="body" color={Colors.textTertiary} style={{ flex: 1 }}>
          {t('feed.searchPlaceholder')}
        </Txt>
        <View style={styles.filterIcon}>
          <Ionicons name="options-outline" size={18} color={Colors.textPrimary} />
        </View>
      </TouchableOpacity>

      {completion < 70 && (
        <TouchableOpacity onPress={() => router.push('/profile/edit')} activeOpacity={PRESS_OPACITY} style={styles.nudge}>
          <View style={styles.nudgeRing}>
            <Txt variant="captionStrong" color={Colors.primaryDark}>
              {completion}%
            </Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">{t('feed.completeProfile.title', { percent: completion })}</Txt>
            <Txt variant="caption" color={Colors.textSecondary}>
              {t('feed.completeProfile.body')}
            </Txt>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
        </TouchableOpacity>
      )}

      <View style={{ marginTop: Spacing.lg, marginBottom: Spacing.md }}>
        <Segmented
          options={[
            { value: 'relevance', label: t('feed.forYou') },
            { value: 'newest', label: t('feed.latest') },
          ]}
          value={sort}
          onChange={setSort}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.fill}>
      <FlatList
        data={jobs}
        keyExtractor={(j) => String(j.id)}
        contentContainerStyle={[
          { paddingHorizontal: gutter, paddingBottom: Spacing.section, gap: Spacing.md },
          contentMaxWidth != null && { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' },
        ]}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <JobCard job={item} showMatch={sort === 'relevance'} onPress={() => router.push(`/jobs/${item.id}`)} />
        )}
        ListEmptyComponent={
          feed.isLoading || profile == null ? (
            <SkeletonList rows={3} />
          ) : feed.isError ? (
            <ErrorView error={feed.error} onRetry={() => feed.refetch()} />
          ) : (
            <EmptyState
              icon="briefcase-outline"
              title={t('feed.empty.title')}
              subtitle={t('feed.empty.body')}
              actionLabel={sort === 'relevance' ? t('feed.empty.cta') : undefined}
              onAction={() => setSort('newest')}
            />
          )
        }
        onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        onEndReachedThreshold={0.4}
        ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={Colors.primary} style={{ margin: Spacing.lg }} /> : null}
        refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: Colors.background },
  topRow: { flexDirection: 'row', alignItems: 'flex-end', paddingTop: Spacing.md, paddingBottom: Spacing.lg },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusFull,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: Spacing.lg,
    paddingRight: 6,
    minHeight: 52,
  },
  filterIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Spacing.radiusLg,
    backgroundColor: Colors.primaryLight,
  },
  nudgeRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
});
