import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Screen } from '@/components/app/Screen';
import { IconButton, LargeTitle } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ListGroup, ListRow, OptionCard, Section } from '@/components/app/Controls';
import { Sheet } from '@/components/app/Sheet';
import { Tag } from '@/components/app/Pieces';
import { EditableAvatar } from '@/components/app/Media';
import { useT, type MessageKey } from '@/lib/i18n';
import { restaurantTypeLabel } from '@/lib/options';
import { keys, useOutlets, useRestaurants, useTeam } from '@/lib/queries';
import { api } from '@/lib/api';
import { upload } from '@/lib/media';
import { useQueryClient } from '@tanstack/react-query';
import { setRole, useSession } from '@/lib/session';

export default function Business() {
  const { t } = useT();
  const { me, restaurantId } = useSession();
  const restaurants = useRestaurants();
  const outlets = useOutlets(restaurantId).data ?? [];
  const team = useTeam(restaurantId).data ?? [];
  const queryClient = useQueryClient();
  const [switching, setSwitching] = useState(false);

  const restaurant = restaurants.data?.find((r) => r.id === restaurantId);
  const hasCandidate = me?.employeeProfile != null;
  const canManage = restaurant?.myRole === 'OWNER' || restaurant?.myRole === 'ADMIN';

  return (
    <Screen tone="tinted" refreshing={restaurants.isRefetching} onRefresh={() => restaurants.refetch()}>
      <LargeTitle title={t('business.title')} right={<IconButton icon="settings-outline" label={t('profile.settings')} onPress={() => router.push('/settings')} />} />

      <View style={styles.card}>
        <EditableAvatar
          name={restaurant?.name}
          uri={restaurant?.logoUrl}
          shape="rounded"
          editable={canManage && restaurantId != null}
          onUpload={async (file) => {
            const token = await upload(file, (type, size) => api.restaurants.logoUpload(restaurantId!, type, size));
            await api.restaurants.setLogo(restaurantId!, token);
            await queryClient.invalidateQueries({ queryKey: keys.restaurants });
          }}
          onRemove={async () => {
            await api.restaurants.removeLogo(restaurantId!);
            await queryClient.invalidateQueries({ queryKey: keys.restaurants });
          }}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="title">{restaurant?.name ?? ''}</Txt>
          {restaurant?.restaurantType ? (
            <Txt variant="body" color={Colors.textSecondary}>
              {restaurantTypeLabel(restaurant.restaurantType, t)}
            </Txt>
          ) : null}
          {restaurant != null && (
            <View style={{ alignSelf: 'flex-start' }}>
              <Tag label={t(`restaurantRole.${restaurant.myRole}` as MessageKey)} icon="shield-checkmark-outline" tone="accent" />
            </View>
          )}
        </View>
      </View>

      <Section>
        <ListGroup>
          {canManage && <ListRow icon="create-outline" title={t('business.profile')} onPress={() => router.push('/hiring/restaurant')} />}
          <ListRow icon="location-outline" title={t('business.outlets')} value={String(outlets.length)} onPress={() => router.push('/hiring/outlets')} />
          {canManage && <ListRow icon="people-outline" title={t('business.team')} value={String(team.length || '')} onPress={() => router.push('/hiring/team')} />}
          {(restaurants.data?.length ?? 0) > 1 && <ListRow icon="repeat-outline" title={t('business.switchRestaurant')} onPress={() => setSwitching(true)} />}
        </ListGroup>
      </Section>

      <Section>
        <ListGroup>
          {hasCandidate ? (
            <ListRow
              icon="swap-horizontal"
              iconColor={Colors.accent}
              title={t('settings.switchToJobs')}
              onPress={async () => {
                await setRole('candidate');
                router.replace('/candidate');
              }}
            />
          ) : (
            <ListRow icon="search-outline" iconColor={Colors.accent} title={t('settings.startJobSearch')} onPress={() => router.push('/onboarding/candidate')} />
          )}
          <ListRow icon="settings-outline" title={t('profile.settings')} onPress={() => router.push('/settings')} />
        </ListGroup>
      </Section>

      <Sheet visible={switching} onClose={() => setSwitching(false)} title={t('business.switchRestaurant')}>
        <View style={{ gap: Spacing.sm }}>
          {(restaurants.data ?? []).map((r) => (
            <OptionCard
              key={r.id}
              title={r.name}
              subtitle={t(`restaurantRole.${r.myRole}` as MessageKey)}
              selected={r.id === restaurantId}
              onPress={async () => {
                await setRole('restaurant', r.id);
                setSwitching(false);
              }}
            />
          ))}
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: Spacing.radiusXl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
