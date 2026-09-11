import React from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { Avatar, EmptyState, SkeletonList } from '@/components/ui';
import { LargeTitle } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ErrorView } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { relativeTime } from '@/lib/format';
import { useConversations } from '@/lib/queries';
import { useResponsive } from '@/hooks/useResponsive';

/** Every thread this person is in, newest first, unread ones in bold. */
export function ConversationList({ side, header }: { side: 'candidate' | 'restaurant'; header?: React.ReactNode }) {
  const { t } = useT();
  const { gutter } = useResponsive();
  const query = useConversations(side);
  const items = query.data ?? [];

  return (
    <SafeAreaView edges={['top']} style={styles.fill}>
      <FlatList
        data={items}
        keyExtractor={(c) => String(c.applicationId)}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: Spacing.section }}
        ListHeaderComponent={
          <View>
            <LargeTitle title={t('alerts.title')} />
            {header}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/messages/${item.applicationId}`)}
            activeOpacity={PRESS_OPACITY}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={item.counterpartName ?? undefined}
          >
            <Avatar name={item.counterpartName} uri={item.counterpartPhotoUrl} shape={side === 'candidate' ? 'rounded' : 'circle'} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.titleRow}>
                <Txt variant={item.unread ? 'bodyStrong' : 'body'} numberOfLines={1} style={{ flex: 1 }}>
                  {item.counterpartName ?? t('common.deletedAccount')}
                </Txt>
                <Txt variant="caption" color={item.unread ? Colors.primary : Colors.textTertiary}>
                  {relativeTime(item.lastMessageAt)}
                </Txt>
              </View>
              <Txt variant="caption" color={Colors.textTertiary} numberOfLines={1}>
                {item.jobTitle}
              </Txt>
              <Txt variant="caption" color={item.unread ? Colors.textPrimary : Colors.textSecondary} numberOfLines={1}>
                {item.lastMessageMine ? `${t('messages.you')}: ` : ''}
                {item.lastMessagePreview}
              </Txt>
            </View>
            {item.unread && <View style={styles.dot} />}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          query.isLoading ? (
            <SkeletonList rows={4} />
          ) : query.isError ? (
            <ErrorView error={query.error} onRetry={() => query.refetch()} />
          ) : (
            <EmptyState
              icon="chatbubbles-outline"
              title={t('messages.empty.title')}
              subtitle={side === 'candidate' ? t('messages.empty.candidate') : t('messages.empty.restaurant')}
            />
          )
        }
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: Colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 56 },
});
