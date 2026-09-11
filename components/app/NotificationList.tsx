import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { EmptyState, SkeletonList } from '@/components/ui';
import { LargeTitle } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ErrorView } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api, type AppNotification } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import { keys, useNotifications } from '@/lib/queries';
import { useResponsive } from '@/hooks/useResponsive';

const ICONS: Record<string, { icon: keyof typeof Ionicons.glyphMap; fg: string; bg: string }> = {
  APPLICATION: { icon: 'document-text', fg: Colors.info, bg: Colors.infoLight },
  INTERVIEW: { icon: 'calendar', fg: '#7C3AED', bg: '#F5F3FF' },
  OFFER: { icon: 'mail-open', fg: Colors.primary, bg: Colors.primaryLight },
  JOB: { icon: 'briefcase', fg: Colors.accent, bg: Colors.accentLight },
};

/**
 * The in-app list, shared by both sides. A tap marks the notification read and
 * opens the thing it is about — the same destination a push tap would reach.
 */
export function NotificationList({ side }: { side: 'candidate' | 'restaurant' }) {
  const { t } = useT();
  const { gutter } = useResponsive();
  const queryClient = useQueryClient();
  const query = useNotifications();
  const items = useMemo(() => query.data?.pages.flatMap((p) => p.data) ?? [], [query.data]);
  const unread = items.some((n) => !n.read);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: keys.notifications });
  };

  const markAll = useMutation({ mutationFn: api.notifications.markAllRead, onSuccess: refresh });

  const open = async (n: AppNotification) => {
    if (!n.read) {
      void api.notifications.markRead(n.id).then(refresh).catch(() => {});
    }
    const id = n.entityId;
    if (id == null) return;
    switch (n.entityType) {
      case 'APPLICATION':
        router.push(side === 'candidate' ? `/applications/${id}` : `/hiring/applications/${id}`);
        break;
      case 'INTERVIEW':
        router.push(`/interviews/${id}`);
        break;
      case 'OFFER':
        router.push(`/offers/${id}`);
        break;
      case 'JOB':
        router.push(side === 'candidate' ? `/jobs/${id}` : `/hiring/jobs/${id}`);
        break;
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.fill}>
      <FlatList
        data={items}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: Spacing.section }}
        ListHeaderComponent={
          <LargeTitle
            title={t('alerts.title')}
            right={
              unread ? (
                <TouchableOpacity onPress={() => markAll.mutate()} accessibilityRole="button" style={{ paddingVertical: Spacing.sm }}>
                  <Txt variant="captionStrong" color={Colors.primary}>
                    {t('alerts.markAllRead')}
                  </Txt>
                </TouchableOpacity>
              ) : undefined
            }
          />
        }
        renderItem={({ item }) => {
          const style = ICONS[item.entityType ?? 'JOB'] ?? ICONS.JOB!;
          return (
            <TouchableOpacity onPress={() => open(item)} activeOpacity={PRESS_OPACITY} style={styles.row} accessibilityRole="button">
              <View style={[styles.icon, { backgroundColor: style.bg }]}>
                <Ionicons name={style.icon} size={20} color={style.fg} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Txt variant={item.read ? 'body' : 'bodyStrong'} style={{ flex: 1 }} numberOfLines={1}>
                    {item.title}
                  </Txt>
                  <Txt variant="caption" color={Colors.textTertiary}>
                    {relativeTime(item.createdAt)}
                  </Txt>
                </View>
                <Txt variant="caption" color={item.read ? Colors.textTertiary : Colors.textSecondary} numberOfLines={2}>
                  {item.body}
                </Txt>
              </View>
              {!item.read && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          query.isLoading ? (
            <SkeletonList rows={4} />
          ) : query.isError ? (
            <ErrorView error={query.error} onRetry={() => query.refetch()} />
          ) : (
            <EmptyState
              icon="notifications-outline"
              title={t('alerts.empty.title')}
              subtitle={side === 'candidate' ? t('alerts.empty.body') : t('alerts.empty.restaurantBody')}
            />
          )
        }
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={Colors.primary} style={{ margin: Spacing.lg }} /> : null}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: Colors.surface },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.lg },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 8 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 52 },
});
